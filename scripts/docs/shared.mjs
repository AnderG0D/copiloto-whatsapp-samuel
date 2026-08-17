import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

export const repositoryRoot = path.resolve(scriptDirectory, '../..');

export function fromRoot(...parts) {
  return path.join(repositoryRoot, ...parts);
}

export function toPosix(value) {
  return value.split(path.sep).join('/');
}

export async function readJson(relativePath) {
  return JSON.parse(await readFile(fromRoot(relativePath), 'utf8'));
}

export async function writeJson(relativePath, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  await mkdir(path.dirname(fromRoot(relativePath)), { recursive: true });
  await writeFile(fromRoot(relativePath), serialized, 'utf8');
}

export async function listFiles(relativeDirectory, predicate = () => true) {
  const root = fromRoot(relativeDirectory);
  const output = [];
  const ignoredDirectories = new Set(['.git', 'coverage', 'dist', 'node_modules']);

  async function visit(current) {
    const entries = await readdir(current, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) continue;
        await visit(absolute);
      } else if (entry.isFile()) {
        const relative = toPosix(path.relative(repositoryRoot, absolute));
        if (predicate(relative)) output.push(relative);
      }
    }
  }

  try {
    await visit(root);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }

  return output;
}

export async function pathExists(relativePath) {
  try {
    await stat(fromRoot(relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

export function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

export function parseArguments(argv) {
  const result = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith('--')) continue;
    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      result[key] = true;
    } else {
      result[key] = next;
      index += 1;
    }
  }

  return result;
}

export function replaceAutoBlock(text, name, body) {
  const begin = `<!-- AUTO:BEGIN ${name} -->`;
  const end = `<!-- AUTO:END ${name} -->`;
  const startIndex = text.indexOf(begin);
  const endIndex = text.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing or invalid AUTO block "${name}"`);
  }

  if (text.indexOf(begin, startIndex + begin.length) !== -1) {
    throw new Error(`Duplicate AUTO block "${name}"`);
  }

  const before = text.slice(0, startIndex + begin.length);
  const after = text.slice(endIndex);
  return `${before}\n${body.trim()}\n${after}`;
}

export function stripAutoBlockBodies(text) {
  const pattern = /<!-- AUTO:BEGIN ([a-z0-9-]+) -->[\s\S]*?<!-- AUTO:END \1 -->/gi;
  return text.replace(pattern, (_match, name) => (
    `<!-- AUTO:BEGIN ${name} -->\n<AUTO-CONTENT>\n<!-- AUTO:END ${name} -->`
  ));
}

export function globToRegExp(glob) {
  let expression = '^';

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index];
    if (character === '*') {
      if (glob[index + 1] === '*') {
        expression += '.*';
        index += 1;
      } else {
        expression += '[^/]*';
      }
    } else if (character === '?') {
      expression += '[^/]';
    } else {
      expression += character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }

  return new RegExp(`${expression}$`);
}

export function classifyPath(relativePath, policy) {
  for (const category of ['generated', 'protected', 'mixed', 'human']) {
    const patterns = policy.classes[category] ?? [];
    if (patterns.some((pattern) => globToRegExp(pattern).test(relativePath))) {
      return category;
    }
  }

  return null;
}

export function markdownStatus(value) {
  const labels = {
    passed: 'APROBADO',
    failed: 'FALLÓ',
    skipped: 'OMITIDO',
    not_run: 'NO EJECUTADO',
  };
  return labels[value] ?? String(value).toUpperCase();
}

export function deriveNextAction({ verification, activeMilestone, pullRequest }) {
  if (activeMilestone === null) {
    return {
      kind: 'await-next-milestone-approval',
      title: 'Esperar aprobación del siguiente hito',
      text: 'Esperar aprobación humana explícita antes de definir o activar el siguiente hito.',
      commitHint: null,
      doneWhen: 'Una persona aprueba explícitamente el alcance y la activación de un próximo hito.',
    };
  }

  const failedChecks = Object.entries(verification)
    .filter(([, value]) => value === 'failed')
    .map(([name]) => name);

  if (failedChecks.length > 0) {
    return {
      kind: 'repair-verification',
      title: `Corregir ${failedChecks.join(', ')}`,
      text: `Reproducir y corregir la falla de ${failedChecks.join(', ')} antes de continuar el hito.`,
      commitHint: 'fix: restore backend verification',
      doneWhen: 'Los comandos afectados y el resto de la validación requerida terminan correctamente.',
    };
  }

  if (pullRequest?.state === 'open') {
    return {
      kind: 'review-pull-request',
      title: `Revisar PR #${pullRequest.number}`,
      text: `Revisar los checks y el diff del PR #${pullRequest.number}; fusionarlo solo si cumple el alcance del hito.`,
      commitHint: null,
      doneWhen: 'El PR está fusionado o existe una corrección concreta registrada.',
    };
  }

  const pendingCheckpoint = activeMilestone.checkpoints.find((item) => !item.complete);
  if (pendingCheckpoint) {
    return {
      kind: 'implement-checkpoint',
      title: `${pendingCheckpoint.id}: ${pendingCheckpoint.title}`,
      text: `En la rama \`${activeMilestone.workingBranch}\`, implementar únicamente el checkpoint **${pendingCheckpoint.id}: ${pendingCheckpoint.title}** y sus pruebas, sin ampliar el alcance.`,
      commitHint: pendingCheckpoint.commitHint,
      doneWhen: 'La evidencia configurada existe, las pruebas relevantes pasan y el diff no conecta envíos ni servicios externos.',
    };
  }

  return {
    kind: 'close-milestone',
    title: `Cerrar Hito ${activeMilestone.id}`,
    text: `Comprobar el merge y los checks finales del Hito ${activeMilestone.id}; si son correctos, registrar su cierre y activar el siguiente hito ya aprobado.`,
    commitHint: null,
    doneWhen: 'El hito está fusionado, la validación está verde y su estado documental coincide con GitHub.',
  };
}
