import { execFileSync, spawnSync } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
  classifyPath,
  deriveNextAction,
  parseArguments,
} from './shared.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '../..');
const contractPath = 'docs/control/handoff-state.json';
const milestonesPath = 'docs/control/milestones.json';
const policyPath = 'docs/control/documentation-policy.json';
const observedStatePath = 'docs/_generated/project-state.json';
const agentsPath = 'AGENTS.md';

function validationError(message) {
  return new Error(`Milestone handoff validation failed: ${message}`);
}

function ensure(condition, message) {
  if (!condition) throw validationError(message);
}

function normalizeLf(value) {
  return value.replace(/\r\n?/g, '\n');
}

function resolveRepositoryPath(root, relativePath) {
  ensure(
    typeof relativePath === 'string'
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes('\\'),
    `invalid repository-relative path: ${String(relativePath)}`,
  );

  const absolute = path.resolve(root, ...relativePath.split('/'));
  const relative = path.relative(root, absolute);
  ensure(
    relative !== '..'
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative),
    `path escapes the repository: ${relativePath}`,
  );
  return absolute;
}

async function readText(root, relativePath) {
  try {
    return normalizeLf(await readFile(resolveRepositoryPath(root, relativePath), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw validationError(`required source is missing: ${relativePath}`);
    }
    throw error;
  }
}

async function readJson(root, relativePath) {
  const text = await readText(root, relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw validationError(`invalid JSON in ${relativePath}: ${error.message}`);
  }
}

async function pathExists(root, relativePath) {
  try {
    await access(resolveRepositoryPath(root, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function git(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const details = normalizeLf(String(error?.stderr ?? '')).trim();
    throw validationError(
      `git ${args.join(' ')} failed${details ? `: ${details}` : ''}`,
    );
  }
}

function isAncestor(root, ancestor, descendant) {
  const result = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', ancestor, descendant],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw validationError(
    `could not validate Git ancestry: ${normalizeLf(result.stderr ?? '').trim()}`,
  );
}

function parseFrontmatter(relativePath, text) {
  ensure(text.startsWith('---\n'), `${relativePath} has no YAML frontmatter`);
  const end = text.indexOf('\n---\n', 4);
  ensure(end !== -1, `${relativePath} has invalid YAML frontmatter`);

  const values = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      value.length >= 2
      && ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function markdownSection(relativePath, text, title) {
  const lines = text.split('\n');
  const heading = `## ${title}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  ensure(start !== -1, `${relativePath} is missing section "${title}"`);

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^#{1,2}\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const body = lines.slice(start + 1, end).join('\n').trim();
  ensure(body.length > 0, `${relativePath} has an empty section "${title}"`);
  return body;
}

function quoteMarkdown(text) {
  return text.split('\n').map((line) => (line ? `> ${line}` : '>')).join('\n');
}

function escapeTable(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function milestoneFileId(id) {
  ensure(/^\d+(?:\.\d+)*$/.test(id ?? ''), `invalid milestone id: ${String(id)}`);
  const [major, ...rest] = id.split('.');
  return [major.padStart(2, '0'), ...rest].join('.');
}

function validateOutputPaths(root, contract, policy) {
  const outputNames = ['masterPrompt', 'portablePrompt', 'historicalHandoff'];
  ensure(
    contract.outputs && typeof contract.outputs === 'object',
    'handoff contract has no output paths',
  );
  ensure(
    isDeepStrictEqual(Object.keys(contract.outputs).sort(), [...outputNames].sort()),
    'handoff contract must declare exactly the three supported outputs',
  );

  const outputs = Object.fromEntries(
    outputNames.map((name) => [name, contract.outputs[name]]),
  );
  ensure(
    new Set(Object.values(outputs)).size === outputNames.length,
    'handoff output paths must be unique',
  );

  const docsRoot = policy.repositoryDocsRoot;
  const roleConventions = {
    masterPrompt: {
      directory: `${docsRoot}/_generated`,
      filename: 'Prompt Maestro - Hito actual.md',
    },
    portablePrompt: {
      directory: `${docsRoot}/_generated`,
      filename: 'Prompt Portatil - Hito actual.md',
    },
    historicalHandoff: {
      directory: `${docsRoot}/04 Handoffs`,
      filename: `Hito ${milestoneFileId(contract.lastClosedMilestone)} a ${milestoneFileId(contract.activeMilestone)}.md`,
    },
  };

  for (const [name, outputPath] of Object.entries(outputs)) {
    const absolute = resolveRepositoryPath(root, outputPath);
    ensure(path.extname(outputPath) === '.md', `${outputPath} is not a Markdown output`);
    ensure(
      path.dirname(outputPath).replaceAll('\\', '/') === roleConventions[name].directory
        && path.basename(absolute) === roleConventions[name].filename,
      `${outputPath} is not classified as the ${name} output`,
    );
    ensure(
      classifyPath(outputPath, policy) === 'generated',
      `${outputPath} is not classified as generated by ${policyPath}`,
    );
  }

  return outputs;
}

function generatedFrontmatter(type, project, handoff, state) {
  return `---
type: ${type}
project: ${project}
generated: true
handoff: ${handoff.handoffId}
source-revision: ${handoff.frozenRevision}
observed-revision: ${handoff.observedRevision}
updated: ${state.observedDate}
---`;
}

function canonicalActionText(nextAction) {
  return `- [ ] ${nextAction.text}
${nextAction.commitHint ? `\n**Commit sugerido:** \`${nextAction.commitHint}\`\n` : ''}
**Termina cuando:** ${nextAction.doneWhen}`;
}

function transitionStatusText(context) {
  const {
    active,
    contract,
    firstIncomplete,
    progress,
  } = context;

  return `- Gate de transición actual: ${contract.transitionGate.description}.
- Progreso funcional actual del Hito ${active.id}: **${progress.complete}/${progress.total}**.
- Primera acción funcional: **${firstIncomplete.id} — ${firstIncomplete.title}**.
- ${firstIncomplete.id} solo puede comenzar después de que ${contract.transitionGate.completionCondition}.

Mientras este gate siga abierto, la acción actual es ${contract.transitionGate.description}; no avances a ${firstIncomplete.id}.`;
}

function safetyInvariantText(context) {
  return `- \`sender=${context.contract.safetyInvariants.sender}\`.
- \`AUTO_SEND_MESSAGES=${context.contract.safetyInvariants.autoSendMessages}\`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.`;
}

function renderMasterPrompt(context) {
  const {
    active,
    activeNote,
    agents,
    contract,
    lastClosed,
    lastClosedNote,
    project,
    sources,
    state,
  } = context;

  const sourceLines = sources.map((source) => `- \`${source}\`.`).join('\n');
  const closureEvidence = lastClosed.evidence;

  return `${generatedFrontmatter(
    'generated-milestone-handoff-master-prompt', project, contract, state,
  )}

# Prompt maestro — Hito ${active.id}

## Propósito

Continúa el proyecto **${project}** desde el cierre verificable del Hito ${lastClosed.id} y la activación del Hito ${active.id}. Trabaja desde las fuentes del repositorio; no sustituyas evidencia por memoria de chat.

## Transición congelada

- Relevo: \`${contract.handoffId}\`.
- Último hito cerrado: **${lastClosed.id} — ${lastClosed.title}**.
- Hito activo: **${active.id} — ${active.title}**.
- Revisión observada del cierre: \`${contract.observedRevision}\`.
- Revisión congelada del repositorio: \`${contract.frozenRevision}\`.
- Evidencia configurada del cierre: PR ${closureEvidence.pullRequests.map((number) => `#${number}`).join(', ')}, merge \`${closureEvidence.mergeCommit}\` y ${closureEvidence.requiredPaths.length} rutas obligatorias.

## Fuentes que debes leer antes de actuar

${sourceLines}

## Cierre documentado del Hito ${lastClosed.id}

${quoteMarkdown(markdownSection(lastClosed.document, lastClosedNote, 'Objetivo alcanzado'))}

### Validación final documentada

${quoteMarkdown(markdownSection(lastClosed.document, lastClosedNote, 'Validación final'))}

## Alcance activo del Hito ${active.id}

${quoteMarkdown(markdownSection(active.document, activeNote, 'Objetivo'))}

### Gate técnico documentado

${quoteMarkdown(markdownSection(active.document, activeNote, 'Gate técnico previo'))}

### Alcance aprobado

${quoteMarkdown(markdownSection(active.document, activeNote, 'Alcance aprobado'))}

## Gate de transición y progreso funcional

${transitionStatusText(context)}

## Primera acción funcional condicionada

Esta acción identifica el primer checkpoint funcional, pero permanece bloqueada hasta que se cumpla el gate de transición.

${canonicalActionText(state.nextAction)}

## Reglas vigentes extraídas de AGENTS.md

### Arquitectura

${quoteMarkdown(markdownSection(agentsPath, agents, 'Architecture'))}

### Seguridad y privacidad

${quoteMarkdown(markdownSection(agentsPath, agents, 'Safety and privacy'))}

### Flujo de ingeniería

${quoteMarkdown(markdownSection(agentsPath, agents, 'Engineering workflow'))}

### Gobierno documental

${quoteMarkdown(markdownSection(agentsPath, agents, 'Documentation governance'))}

### Validación

${quoteMarkdown(markdownSection(agentsPath, agents, 'Validation'))}

## Restricciones específicas del Hito ${active.id}

${quoteMarkdown(markdownSection(active.document, activeNote, 'Reglas de seguridad'))}

## Invariantes de ausencia de envío

${safetyInvariantText(context)}

## Instrucción de arranque

Antes de editar, verifica la rama y el árbol de trabajo, confirma que la revisión congelada pertenece al historial actual y contrasta el primer checkpoint incompleto con el estado observado. Completa primero el gate de transición y no implementes la primera acción funcional hasta que el generador haya sido validado y fusionado. Detente ante cualquier discrepancia de evidencia o alcance.
`;
}

function renderPortablePrompt(context) {
  const {
    active,
    contract,
    lastClosed,
    policy,
    project,
    state,
  } = context;

  return `${generatedFrontmatter(
    'generated-milestone-handoff-portable-prompt', project, contract, state,
  )}

# Prompt portátil — Hito ${active.id}

Continúa **${project}** en la transición \`${contract.handoffId}\`: el Hito ${lastClosed.id} está cerrado y el Hito ${active.id} está activo.

Antes de editar, lee \`AGENTS.md\`, \`${contractPath}\`, \`${milestonesPath}\`, \`${observedStatePath}\`, las notas de ambos hitos y \`${policy.canonicalNextAction}\`. Valida que \`${contract.observedRevision}\` sea la revisión observada, que su sucesor congelado sea \`${contract.frozenRevision}\`, que exista exactamente un hito activo y que la evidencia obligatoria del cierre siga presente.

## Gate de transición y progreso funcional

${transitionStatusText(context)}

## Primera acción funcional condicionada

Esta acción permanece bloqueada hasta que se cumpla el gate de transición.

${canonicalActionText(state.nextAction)}

## Invariantes de ausencia de envío

${safetyInvariantText(context)}

Respeta el alcance y las reglas de seguridad de \`${active.document}\`. No inventes información, no uses servicios externos ni credenciales y no avances a la primera acción funcional mientras el gate permanezca abierto.
`;
}

function renderHistoricalHandoff(context) {
  const {
    active,
    contract,
    lastClosed,
    policy,
    project,
    state,
  } = context;
  const evidence = lastClosed.evidence;
  const checks = ['unit', 'e2e', 'build'].map((name) => (
    `| ${name} | \`${state.verification[name]}\` |`
  )).join('\n');
  const checkpoints = state.milestone.checkpoints.map((checkpoint) => (
    `| ${checkpoint.id} | ${escapeTable(checkpoint.title)} | ${checkpoint.complete ? 'completo' : 'pendiente'} |`
  )).join('\n');
  const outputRows = Object.entries(contract.outputs).map(([name, outputPath]) => (
    `| ${name} | \`${outputPath}\` |`
  )).join('\n');

  return `${generatedFrontmatter(
    'generated-milestone-handoff', project, contract, state,
  )}

# Relevo del Hito ${lastClosed.id} al Hito ${active.id}

## Estado congelado

| Dato | Valor |
| --- | --- |
| Relevo | \`${contract.handoffId}\` |
| Último hito cerrado | ${lastClosed.id} — ${escapeTable(lastClosed.title)} |
| Hito activo | ${active.id} — ${escapeTable(active.title)} |
| Revisión observada | \`${contract.observedRevision}\` |
| Revisión congelada | \`${contract.frozenRevision}\` |
| Fecha observada | ${state.observedDate} |

La revisión observada es el padre directo de la revisión congelada. La revisión congelada pertenece al historial actual al generar o comprobar este relevo.

## Evidencia obligatoria del cierre

- Pull requests configurados: ${evidence.pullRequests.map((number) => `#${number}`).join(', ')}.
- Merge funcional configurado: \`${evidence.mergeCommit}\`.
- Pull request de cierre observado: #${state.source.pullRequest.number}, fusionado en \`${state.source.pullRequest.mergedAt}\`.
- Rutas obligatorias:
${evidence.requiredPaths.map((requiredPath) => `  - \`${requiredPath}\`.`).join('\n')}

## Verificaciones observadas

| Verificación | Resultado |
| --- | --- |
${checks}

## Gate de transición y progreso funcional

${transitionStatusText(context)}

## Checkpoints del Hito ${active.id}

| Checkpoint | Resultado | Estado observado |
| --- | --- | --- |
${checkpoints}

## Primera acción funcional condicionada

Fuente canónica: \`${policy.canonicalNextAction}\`.

Esta acción permanece bloqueada hasta que se cumpla el gate de transición.

${canonicalActionText(state.nextAction)}

## Invariantes de ausencia de envío

${safetyInvariantText(context)}

## Salidas de este relevo

| Salida | Ruta |
| --- | --- |
${outputRows}

Este archivo es una salida determinista del contrato \`${contractPath}\`; no debe editarse manualmente.
`;
}

async function validateAndBuild(root) {
  const [contract, milestones, policy, state, agents] = await Promise.all([
    readJson(root, contractPath),
    readJson(root, milestonesPath),
    readJson(root, policyPath),
    readJson(root, observedStatePath),
    readText(root, agentsPath),
  ]);

  ensure(contract.schemaVersion === 1, 'handoff schemaVersion must be 1');
  ensure(
    typeof contract.lastClosedMilestone === 'string'
      && typeof contract.activeMilestone === 'string',
    'handoff contract must declare both milestone ids',
  );
  const derivedHandoffId = `${contract.lastClosedMilestone}-to-${contract.activeMilestone}`;
  ensure(
    contract.handoffId === derivedHandoffId,
    `handoffId must match the derived transition ${derivedHandoffId}`,
  );
  ensure(
    contract.safetyInvariants?.sender === false,
    'handoff contract must require sender=false',
  );
  ensure(
    contract.safetyInvariants?.autoSendMessages === false,
    'handoff contract must require AUTO_SEND_MESSAGES=false',
  );
  ensure(
    state.architecture?.components?.sender === false,
    `${observedStatePath} must declare sender=false`,
  );
  const safetyAndPrivacy = markdownSection(agentsPath, agents, 'Safety and privacy');
  ensure(
    /(?:^|[^A-Z0-9_])AUTO_SEND_MESSAGES=false(?:[^A-Z0-9_]|$)/.test(safetyAndPrivacy),
    `${agentsPath} must authoritatively require AUTO_SEND_MESSAGES=false`,
  );

  for (const [name, revision] of [
    ['frozenRevision', contract.frozenRevision],
    ['observedRevision', contract.observedRevision],
  ]) {
    ensure(/^[0-9a-f]{40}$/.test(revision ?? ''), `${name} must be a full Git SHA`);
  }

  ensure(Array.isArray(milestones.milestones), `${milestonesPath} has no milestones`);
  const configuredActive = milestones.milestones.filter(
    (milestone) => milestone.status === 'active',
  );
  ensure(
    configuredActive.length === 1,
    `expected exactly one active milestone in ${milestonesPath}; found ${configuredActive.length}`,
  );
  ensure(
    milestones.activeMilestone === configuredActive[0].id,
    `${milestonesPath} activeMilestone does not identify its only active milestone`,
  );
  ensure(
    milestones.activeMilestone === contract.activeMilestone,
    'contract and milestone configuration disagree about the active milestone',
  );

  const lastClosed = milestones.milestones.find(
    (milestone) => milestone.id === contract.lastClosedMilestone,
  );
  const active = configuredActive[0];
  ensure(lastClosed, `Hito ${contract.lastClosedMilestone} is not configured`);
  ensure(lastClosed.status === 'done', `Hito ${lastClosed.id} is not closed`);
  ensure(active.id === contract.activeMilestone, `Hito ${contract.activeMilestone} is not active`);
  const lastClosedIndex = milestones.milestones.indexOf(lastClosed);
  const activeIndex = milestones.milestones.indexOf(active);
  ensure(
    activeIndex === lastClosedIndex + 1,
    `Hito ${lastClosed.id} must immediately precede Hito ${active.id}`,
  );
  ensure(typeof lastClosed.document === 'string', `Hito ${lastClosed.id} has no note`);
  ensure(typeof active.document === 'string', `Hito ${active.id} has no note`);

  ensure(Array.isArray(state.milestones), `${observedStatePath} has no milestones`);
  const observedActive = state.milestones.filter(
    (milestone) => milestone.status === 'active',
  );
  ensure(
    observedActive.length === 1,
    `expected exactly one active milestone in ${observedStatePath}; found ${observedActive.length}`,
  );
  ensure(
    observedActive[0].id === contract.activeMilestone,
    'contract, milestone configuration and observed state disagree about the active milestone',
  );
  const observedLastClosed = state.milestones.find(
    (milestone) => milestone.id === contract.lastClosedMilestone,
  );
  ensure(
    observedLastClosed?.status === 'done',
    `observed state does not mark Hito ${lastClosed.id} as closed`,
  );
  ensure(
    state.milestone?.id === active.id && state.milestone?.status === 'active',
    'observed active milestone does not match the contract and milestone configuration',
  );

  const configuredProjection = milestones.milestones.map(
    ({ id, title, status, document }) => ({ id, title, status, document }),
  );
  ensure(
    isDeepStrictEqual(state.milestones, configuredProjection),
    'milestone configuration and observed milestone list do not match',
  );
  ensure(
    state.milestone.title === active.title
      && state.milestone.workingBranch === active.workingBranch
      && state.milestone.document === active.document,
    'active milestone details differ between configuration and observed state',
  );
  ensure(
    Array.isArray(active.checkpoints)
      && Array.isArray(state.milestone.checkpoints)
      && active.checkpoints.length === state.milestone.checkpoints.length,
    'active milestone checkpoints differ between configuration and observed state',
  );
  for (let index = 0; index < active.checkpoints.length; index += 1) {
    const configured = active.checkpoints[index];
    const observed = state.milestone.checkpoints[index];
    ensure(
      observed.id === configured.id
        && observed.title === configured.title
        && observed.commitHint === configured.commitHint
        && isDeepStrictEqual(observed.evidence, configured.evidence),
      `checkpoint ${configured.id} differs between configuration and observed state`,
    );
  }

  ensure(
    state.source?.sha === contract.observedRevision,
    'contract observedRevision does not match the observed project state',
  );
  ensure(
    /^\d{4}-\d{2}-\d{2}$/.test(state.observedDate ?? ''),
    'observed project state has no stable observedDate',
  );

  const [lastClosedNote, activeNote] = await Promise.all([
    readText(root, lastClosed.document),
    readText(root, active.document),
  ]);
  const lastClosedFrontmatter = parseFrontmatter(lastClosed.document, lastClosedNote);
  const activeFrontmatter = parseFrontmatter(active.document, activeNote);
  ensure(
    lastClosedFrontmatter.status === 'done'
      && lastClosedFrontmatter.hito === lastClosed.id,
    `${lastClosed.document} must declare Hito ${lastClosed.id} as DONE`,
  );
  ensure(
    activeFrontmatter.status === 'active' && activeFrontmatter.hito === active.id,
    `${active.document} must declare Hito ${active.id} as ACTIVE`,
  );
  ensure(
    lastClosedFrontmatter.project
      && lastClosedFrontmatter.project === activeFrontmatter.project,
    'milestone notes do not identify the same project',
  );

  const evidence = lastClosed.evidence;
  ensure(evidence && typeof evidence === 'object', `Hito ${lastClosed.id} has no evidence`);
  ensure(
    Array.isArray(evidence.pullRequests)
      && evidence.pullRequests.length > 0
      && evidence.pullRequests.every((number) => Number.isInteger(number) && number > 0),
    `Hito ${lastClosed.id} is missing required pull request evidence`,
  );
  ensure(
    /^[0-9a-f]{40}$/.test(evidence.mergeCommit ?? ''),
    `Hito ${lastClosed.id} is missing a full mergeCommit`,
  );
  ensure(
    Array.isArray(evidence.requiredPaths) && evidence.requiredPaths.length > 0,
    `Hito ${lastClosed.id} is missing required path evidence`,
  );
  for (const requiredPath of evidence.requiredPaths) {
    ensure(
      await pathExists(root, requiredPath),
      `required closing evidence is missing: ${requiredPath}`,
    );
  }
  for (const pullRequest of evidence.pullRequests) {
    ensure(
      lastClosedNote.includes(`#${pullRequest}`),
      `${lastClosed.document} is missing evidence for PR #${pullRequest}`,
    );
  }
  ensure(
    lastClosedNote.includes(evidence.mergeCommit.slice(0, 7)),
    `${lastClosed.document} is missing merge evidence ${evidence.mergeCommit.slice(0, 7)}`,
  );
  for (const verification of ['unit', 'e2e', 'build']) {
    ensure(
      state.verification?.[verification] === 'passed',
      `closing verification ${verification} is not passed`,
    );
  }
  ensure(
    state.source?.pullRequest?.state === 'closed'
      && typeof state.source.pullRequest.mergedAt === 'string'
      && state.source.pullRequest.mergedAt.length > 0,
    'observed closing pull request is not confirmed as merged',
  );

  const expectedNextAction = deriveNextAction({
    verification: state.verification,
    activeMilestone: state.milestone,
    pullRequest: state.source.pullRequest,
  });
  ensure(
    isDeepStrictEqual(state.nextAction, expectedNextAction),
    'observed nextAction does not match the canonical nextAction logic',
  );
  const firstIncomplete = state.milestone.checkpoints.find(
    (checkpoint) => !checkpoint.complete,
  );
  ensure(firstIncomplete, `Hito ${active.id} has no incomplete checkpoint`);
  ensure(
    expectedNextAction.kind === 'implement-checkpoint'
      && expectedNextAction.title
        === `${firstIncomplete.id}: ${firstIncomplete.title}`,
    `nextAction does not correspond to the first incomplete checkpoint ${firstIncomplete.id}`,
  );
  ensure(
    contract.transitionGate
      && typeof contract.transitionGate.description === 'string'
      && contract.transitionGate.description.trim().length > 0,
    'handoff contract has no transition gate description',
  );
  ensure(
    contract.transitionGate.conditionedCheckpoint === firstIncomplete.id,
    `transition gate checkpoint must match nextAction checkpoint ${firstIncomplete.id}`,
  );
  ensure(
    typeof contract.transitionGate.completionCondition === 'string'
      && contract.transitionGate.completionCondition.trim().length > 0,
    'handoff contract has no transition gate completion condition',
  );
  const progress = {
    complete: state.milestone.checkpoints.filter(
      (checkpoint) => checkpoint.complete === true,
    ).length,
    total: state.milestone.checkpoints.length,
  };

  ensure(
    typeof policy.repositoryDocsRoot === 'string'
      && policy.automationRules?.allowGeneratedFileReplacement === true,
    'documentation policy does not allow generated file replacement',
  );
  const outputs = validateOutputPaths(root, contract, policy);
  ensure(
    typeof policy.canonicalNextAction === 'string',
    `${policyPath} has no canonicalNextAction`,
  );
  const canonicalNextAction = await readText(root, policy.canonicalNextAction);
  for (const expectedFragment of [
    state.nextAction.text,
    state.nextAction.commitHint,
    state.nextAction.doneWhen,
  ].filter(Boolean)) {
    ensure(
      canonicalNextAction.includes(expectedFragment),
      `${policy.canonicalNextAction} does not match observed nextAction`,
    );
  }

  ensure(
    git(root, ['rev-parse', `${contract.observedRevision}^{commit}`])
      === contract.observedRevision,
    'observedRevision does not resolve to the expected commit',
  );
  ensure(
    git(root, ['rev-parse', `${contract.frozenRevision}^{commit}`])
      === contract.frozenRevision,
    'frozenRevision does not resolve to the expected commit',
  );
  ensure(
    git(root, ['rev-parse', `${evidence.mergeCommit}^{commit}`])
      === evidence.mergeCommit,
    `closing mergeCommit ${evidence.mergeCommit} is not in Git history`,
  );
  ensure(
    isAncestor(root, evidence.mergeCommit, contract.observedRevision),
    'closing mergeCommit is not an ancestor of observedRevision',
  );
  const frozenParents = git(
    root, ['rev-list', '--parents', '-n', '1', contract.frozenRevision],
  ).split(/\s+/).slice(1);
  ensure(
    frozenParents[0] === contract.observedRevision,
    'observedRevision is not the direct first parent of frozenRevision',
  );
  ensure(
    isAncestor(root, contract.frozenRevision, 'HEAD'),
    'frozenRevision is not in the current HEAD history',
  );

  let frozenState;
  try {
    frozenState = JSON.parse(git(
      root, ['show', `${contract.frozenRevision}:${observedStatePath}`],
    ));
  } catch (error) {
    if (error.message.startsWith('Milestone handoff validation failed: invalid JSON')) {
      throw error;
    }
    throw validationError(
      `frozenRevision does not contain valid ${observedStatePath}`,
    );
  }
  ensure(
    isDeepStrictEqual(frozenState, state),
    `${observedStatePath} differs from the frozen revision`,
  );

  const sources = [
    agentsPath,
    milestonesPath,
    observedStatePath,
    contractPath,
    lastClosed.document,
    active.document,
    policyPath,
    policy.canonicalNextAction,
  ];
  const context = {
    active,
    activeNote,
    agents,
    contract,
    firstIncomplete,
    lastClosed,
    lastClosedNote,
    policy,
    progress,
    project: activeFrontmatter.project,
    sources,
    state,
  };

  return {
    outputs,
    contents: {
      masterPrompt: renderMasterPrompt(context),
      portablePrompt: renderPortablePrompt(context),
      historicalHandoff: renderHistoricalHandoff(context),
    },
  };
}

export async function generateMilestoneHandoff({
  root = defaultRepositoryRoot,
  check = false,
} = {}) {
  const repositoryRoot = path.resolve(root);
  const result = await validateAndBuild(repositoryRoot);

  for (const name of ['masterPrompt', 'portablePrompt', 'historicalHandoff']) {
    const outputPath = result.outputs[name];
    const expected = Buffer.from(result.contents[name], 'utf8');
    const absolute = resolveRepositoryPath(repositoryRoot, outputPath);

    if (check) {
      let actual;
      try {
        actual = await readFile(absolute);
      } catch (error) {
        if (error?.code === 'ENOENT') {
          throw validationError(`generated output is missing: ${outputPath}`);
        }
        throw error;
      }
      ensure(actual.equals(expected), `generated output is out of date: ${outputPath}`);
      continue;
    }

    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, expected);
  }

  return result.outputs;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const root = args.root ? path.resolve(args.root) : defaultRepositoryRoot;
  const check = args.check === true;
  const outputs = await generateMilestoneHandoff({ root, check });
  const action = check ? 'verified' : 'generated';
  console.log(`Milestone handoff ${action}: ${Object.values(outputs).join(', ')}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
