import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  classifyPath,
  fromRoot,
  git,
  listFiles,
  parseArguments,
  stripAutoBlockBodies,
} from './shared.mjs';

export function normalizeLineEndings(text) {
  return text.replace(/\r\n?/g, '\n');
}

export async function readNormalizedTextFile(absolutePath) {
  return normalizeLineEndings(await readFile(absolutePath, 'utf8'));
}

async function readRepositoryText(relativePath) {
  return readNormalizedTextFile(fromRoot(relativePath));
}

async function readRepositoryJson(relativePath) {
  return JSON.parse(await readRepositoryText(relativePath));
}

export function documentDigest(text) {
  return createHash('sha256').update(text).digest('hex');
}

export function autoBlockComparisonText(text) {
  return stripAutoBlockBodies(text).trimEnd();
}

export function validateFrontmatter(file, text, issues) {
  if (!text.startsWith('---\n')) {
    issues.push(`${file}: missing YAML frontmatter`);
    return null;
  }
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) {
    issues.push(`${file}: frontmatter has no closing delimiter`);
    return null;
  }
  return text.slice(4, end);
}

export function validateGeneratedDeclaration(file, category, frontmatter, issues) {
  if (category === 'generated' && !/^generated:\s*true\s*$/m.test(frontmatter ?? '')) {
    issues.push(`${file}: generated note must declare generated: true`);
  }
}

function outsideCodeFences(text) {
  const output = [];
  let fence = null;
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (match) {
      const marker = match[1][0];
      fence = fence === null ? marker : (fence === marker ? null : fence);
    } else if (fence === null) {
      output.push(line);
    }
  }
  return output.join('\n');
}

function validateAutoBlocks(file, text, issues) {
  const begins = [...text.matchAll(/<!-- AUTO:BEGIN ([a-z0-9-]+) -->/gi)].map((item) => item[1]);
  const ends = [...text.matchAll(/<!-- AUTO:END ([a-z0-9-]+) -->/gi)].map((item) => item[1]);
  if (begins.length !== ends.length || begins.some((name, index) => name !== ends[index])) {
    issues.push(`${file}: unbalanced or misordered AUTO markers`);
  }
  if (new Set(begins).size !== begins.length) {
    issues.push(`${file}: duplicate AUTO block name`);
  }
}

export async function validateDocumentation(args = {}) {
  const policy = await readRepositoryJson('docs/control/documentation-policy.json');
  const docsRoot = policy.repositoryDocsRoot;
  const markdownFiles = await listFiles(docsRoot, (file) => file.endsWith('.md'));
  const issues = [];
  const titles = new Map();
  const hashes = new Map();

  function addTitle(title, file) {
    const normalized = title.trim().toLocaleLowerCase('es-MX');
    const entries = titles.get(normalized) ?? [];
    entries.push(file);
    titles.set(normalized, entries);
  }

  for (const file of markdownFiles) {
    const text = await readRepositoryText(file);
    const isArchive = file.includes('/90 Archive/');
    if (!text.trim()) issues.push(`${file}: empty Markdown file`);
    const frontmatter = isArchive ? null : validateFrontmatter(file, text, issues);
    validateAutoBlocks(file, text, issues);

    const visible = outsideCodeFences(text);
    const h1 = visible.match(/^#\s+.+$/gm) ?? [];
    if (!isArchive && h1.length !== 1) {
      issues.push(`${file}: expected exactly one H1, found ${h1.length}`);
    }

    const fenceCount = (text.match(/^\s*(`{3,}|~{3,})/gm) ?? []).length;
    if (fenceCount % 2 !== 0) issues.push(`${file}: unbalanced code fences`);

    addTitle(path.basename(file, '.md'), file);
    if (!isArchive) {
      const digest = documentDigest(text);
      const duplicates = hashes.get(digest) ?? [];
      duplicates.push(file);
      hashes.set(digest, duplicates);
    }

    const category = classifyPath(file, policy);
    if (!category) issues.push(`${file}: not classified by documentation policy`);
    validateGeneratedDeclaration(file, category, frontmatter, issues);
  }

  for (const duplicates of hashes.values()) {
    if (duplicates.length > 1) issues.push(`exact duplicate notes: ${duplicates.join(', ')}`);
  }

  for (const file of markdownFiles) {
    const visible = outsideCodeFences(await readRepositoryText(file));
    for (const match of visible.matchAll(/!?\[\[([^\]]+)\]\]/g)) {
      const target = match[1].split('|', 1)[0].split('#', 1)[0].trim();
      if (!target) continue;
      const stem = path.basename(target.replaceAll('\\', '/')).toLocaleLowerCase('es-MX');
      if (!titles.has(stem)) issues.push(`${file}: broken wikilink [[${match[1]}]]`);
    }
  }

  const secretPatterns = [
    ['Google API key', /AIza[0-9A-Za-z_-]{20,}/],
    ['Groq key', /gsk_[0-9A-Za-z]{20,}/],
    ['OpenAI-style key', /sk-[0-9A-Za-z_-]{20,}/],
    ['JWT', /eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/],
  ];

  for (const file of markdownFiles) {
    const text = await readRepositoryText(file);
    for (const [label, pattern] of secretPatterns) {
      if (pattern.test(text)) issues.push(`${file}: possible ${label}`);
    }
  }

  for (const jsonFile of await listFiles('docs/control', (file) => file.endsWith('.json'))) {
    try {
      JSON.parse(await readRepositoryText(jsonFile));
    } catch (error) {
      issues.push(`${jsonFile}: invalid JSON (${error.message})`);
    }
  }

  const panelPath = `${docsRoot}/01 Panel de Proyecto - Copiloto WhatsApp Samuel.md`;
  const panel = await readRepositoryText(panelPath);
  if (!panel.includes('![[Siguiente accion]]')) {
    issues.push(`${panelPath}: must transclude the canonical next action`);
  }

  if (args['automation-base']) {
    const base = args['automation-base'];
    const tracked = normalizeLineEndings(
      git(['diff', '--name-only', base, '--']),
    ).split('\n').filter(Boolean);
    const untracked = normalizeLineEndings(
      git(['ls-files', '--others', '--exclude-standard']),
    ).split('\n').filter(Boolean);
    const changedFiles = [...new Set([...tracked, ...untracked])];

    for (const file of changedFiles.filter((item) => item.startsWith(`${docsRoot}/`))) {
      const category = classifyPath(file, policy);
      if (category === 'generated') continue;
      if (category === 'protected' || category === 'human' || !category) {
        issues.push(`${file}: automation changed ${category ?? 'unclassified'} content`);
        continue;
      }

      if (category === 'mixed') {
        let baseText;
        try {
          baseText = normalizeLineEndings(git(['show', `${base}:${file}`]));
        } catch {
          issues.push(`${file}: automation created a new mixed document`);
          continue;
        }
        const currentText = await readRepositoryText(file);
        if (autoBlockComparisonText(baseText) !== autoBlockComparisonText(currentText)) {
          issues.push(`${file}: automation changed content outside AUTO blocks`);
        }
      }
    }
  }

  return {
    markdownFiles: markdownFiles.length,
    generatedFiles: markdownFiles.filter(
      (file) => classifyPath(file, policy) === 'generated',
    ).length,
    issues,
  };
}

async function main() {
  const result = await validateDocumentation(parseArguments(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
  if (result.issues.length > 0) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
