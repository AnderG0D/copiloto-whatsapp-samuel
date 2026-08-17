import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import {
  classifyPath,
  deriveNextAction,
  globToRegExp,
  replaceAutoBlock,
  repositoryRoot,
  stripAutoBlockBodies,
} from './shared.mjs';
import {
  autoBlockComparisonText,
  documentDigest,
  normalizeLineEndings,
  readNormalizedTextFile,
  validateFrontmatter,
  validateGeneratedDeclaration,
} from './validate-documentation.mjs';

const execFileAsync = promisify(execFile);
let currentProjectStatePromise;

async function pathContentAllEvidenceMatches(evidence, sourceOverrides = new Map()) {
  const matches = await Promise.all(evidence.pathContentAll.map(async (candidate) => {
    const source = sourceOverrides.get(candidate.path)
      ?? await readFile(path.join(repositoryRoot, candidate.path), 'utf8');
    const normalizedSource = source.toLowerCase();
    return candidate.contentAll.every((needle) => (
      normalizedSource.includes(needle.toLowerCase())
    ));
  }));
  return matches.every(Boolean);
}

async function checkpointEvidence(checkpointId) {
  const milestones = JSON.parse(await readFile(
    path.join(repositoryRoot, 'docs/control/milestones.json'), 'utf8',
  ));
  return milestones.milestones
    .find((milestone) => milestone.id === milestones.activeMilestone)
    .checkpoints.find((checkpoint) => checkpoint.id === checkpointId)
    .evidence;
}

function fixtureNote(lineEnding, overrides = {}) {
  const values = {
    type: 'fixture-note',
    project: 'Documentation fixture',
    generated: 'true',
    ...overrides,
  };
  return [
    '---',
    ...Object.entries(values).map(([key, value]) => `${key}: ${value}`),
    '---',
    '',
    '# Fixture note',
    '',
  ].join(lineEnding);
}

async function createTextFixture(t, content, prefix = '.docs-eol-test-') {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), prefix));
  t.after(async () => rm(temporaryDirectory, { recursive: true, force: true }));
  const file = path.join(temporaryDirectory, 'note.md');
  await writeFile(file, content, 'utf8');
  return file;
}

async function createGitTextFixture(t) {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), '.docs-eol-git-test-'),
  );
  t.after(async () => rm(temporaryDirectory, { recursive: true, force: true }));
  const file = path.join(temporaryDirectory, 'note.md');
  const base = `${fixtureNote('\n')}
Human content.

<!-- AUTO:BEGIN fixture -->
Old generated content.
<!-- AUTO:END fixture -->
`;

  await execFileAsync('git', ['init', '--quiet'], { cwd: temporaryDirectory });
  await execFileAsync('git', ['config', 'user.name', 'Documentation Test'], {
    cwd: temporaryDirectory,
  });
  await execFileAsync('git', ['config', 'user.email', 'docs-test@example.invalid'], {
    cwd: temporaryDirectory,
  });
  await writeFile(file, base, 'utf8');
  await execFileAsync('git', ['add', 'note.md'], { cwd: temporaryDirectory });
  await execFileAsync('git', ['commit', '-m', 'docs: add fixture'], {
    cwd: temporaryDirectory,
  });

  const { stdout } = await execFileAsync('git', ['show', 'HEAD:note.md'], {
    cwd: temporaryDirectory,
  });
  return { base, blob: normalizeLineEndings(stdout), file };
}

async function collectCurrentProjectState() {
  if (!currentProjectStatePromise) {
    currentProjectStatePromise = (async () => {
      const temporaryDirectory = await mkdtemp(
        path.join(repositoryRoot, '.docs-automation-test-'),
      );
      const outputPath = path.join(temporaryDirectory, 'project-state.json');
      const relativeOutputPath = path.relative(repositoryRoot, outputPath);

      try {
        await execFileAsync(
          process.execPath,
          [
            'scripts/docs/collect-project-state.mjs',
            '--source-ref',
            'HEAD',
            '--output',
            relativeOutputPath,
          ],
          {
            cwd: repositoryRoot,
            env: { ...process.env, GITHUB_TOKEN: '' },
          },
        );

        return JSON.parse(await readFile(outputPath, 'utf8'));
      } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    })();
  }

  return currentProjectStatePromise;
}

async function collectWaitingProjectState(t) {
  const temporaryDirectory = await mkdtemp(
    path.join(repositoryRoot, '.docs-waiting-state-test-'),
  );
  t.after(async () => rm(temporaryDirectory, { recursive: true, force: true }));
  const configPath = path.join(temporaryDirectory, 'milestones.json');
  const outputPath = path.join(temporaryDirectory, 'project-state.json');
  const milestones = JSON.parse(await readFile(
    path.join(repositoryRoot, 'docs/control/milestones.json'), 'utf8',
  ));
  const active = milestones.milestones.find((milestone) => milestone.id === '4.4');
  active.status = 'done';
  milestones.activeMilestone = null;
  milestones.lifecycleState = 'awaiting-next-milestone-approval';
  milestones.lastClosedMilestone = '4.4';
  await writeFile(configPath, `${JSON.stringify(milestones, null, 2)}\n`, 'utf8');

  await execFileAsync(
    process.execPath,
    [
      'scripts/docs/collect-project-state.mjs',
      '--source-ref', 'HEAD',
      '--output', path.relative(repositoryRoot, outputPath),
      '--milestones-config', path.relative(repositoryRoot, configPath),
    ],
    { cwd: repositoryRoot, env: { ...process.env, GITHUB_TOKEN: '' } },
  );

  return { outputPath, state: JSON.parse(await readFile(outputPath, 'utf8')) };
}

test('glob matching keeps protected decisions out of the human fallback', () => {
  const policy = {
    classes: {
      generated: ['docs/_generated/**'],
      protected: ['docs/project/03 Decisions/**'],
      mixed: ['docs/project/01 Panel.md'],
      human: ['docs/project/**'],
    },
  };

  assert.equal(
    classifyPath('docs/project/03 Decisions/ADR 001.md', policy),
    'protected',
  );
  assert.equal(classifyPath('docs/project/01 Panel.md', policy), 'mixed');
  assert.equal(classifyPath('docs/project/04 Docs/Vision.md', policy), 'human');
  assert.ok(globToRegExp('docs/project/**').test('docs/project/a/b.md'));
});

test('AUTO block replacement leaves human content unchanged', () => {
  const original = `# Title

Human decision.

<!-- AUTO:BEGIN state -->
Old state
<!-- AUTO:END state -->

Human scope.
`;
  const updated = replaceAutoBlock(original, 'state', 'New state');

  assert.match(updated, /New state/);
  assert.equal(stripAutoBlockBodies(updated), stripAutoBlockBodies(original));
  assert.match(updated, /Human decision/);
  assert.match(updated, /Human scope/);
});

test('failed verification outranks milestone work', () => {
  const action = deriveNextAction({
    verification: { unit: 'failed', e2e: 'passed', build: 'passed' },
    activeMilestone: {
      id: '4.2',
      workingBranch: 'feature/hito-4-2-response-drafts',
      checkpoints: [{ id: '4.2-A', title: 'Contracts', complete: false }],
    },
    pullRequest: null,
  });

  assert.equal(action.kind, 'repair-verification');
});

test('first incomplete checkpoint becomes the next action', () => {
  const action = deriveNextAction({
    verification: { unit: 'passed', e2e: 'passed', build: 'passed' },
    activeMilestone: {
      id: '4.2',
      workingBranch: 'feature/hito-4-2-response-drafts',
      checkpoints: [
        { id: '4.2-A', title: 'Contracts', complete: true },
        { id: '4.2-B', title: 'Context', complete: false, commitHint: 'feat: context' },
      ],
    },
    pullRequest: null,
  });

  assert.equal(action.kind, 'implement-checkpoint');
  assert.match(action.text, /4\.2-B/);
});

test('waiting lifecycle has one human action without branch, checkpoint or commit', () => {
  const action = deriveNextAction({
    verification: { unit: 'failed', e2e: 'failed', build: 'failed' },
    activeMilestone: null,
    pullRequest: { state: 'open', number: 99 },
  });

  assert.deepEqual(action, {
    kind: 'await-next-milestone-approval',
    title: 'Esperar aprobación del siguiente hito',
    text: 'Esperar aprobación humana explícita antes de definir o activar el siguiente hito.',
    commitHint: null,
    doneWhen: 'Una persona aprueba explícitamente el alcance y la activación de un próximo hito.',
  });
});

test('collects and dry-renders a v2 waiting lifecycle without a milestone object', async (t) => {
  const { outputPath, state } = await collectWaitingProjectState(t);

  assert.equal(state.schemaVersion, 2);
  assert.equal(state.lifecycleState, 'awaiting-next-milestone-approval');
  assert.equal(state.lastClosedMilestone, '4.4');
  assert.equal(state.activeMilestone, null);
  assert.equal(state.milestone, null);
  assert.equal(state.nextAction.kind, 'await-next-milestone-approval');
  assert.equal(state.nextAction.commitHint, null);
  assert.doesNotMatch(state.nextAction.text, /4\.5/);

  const { stdout } = await execFileAsync(
    process.execPath,
    [
      'scripts/docs/render-documentation.mjs',
      '--input', path.relative(repositoryRoot, outputPath),
      '--dry-run',
    ],
    { cwd: repositoryRoot, env: { ...process.env, GITHUB_TOKEN: '' } },
  );
  assert.match(stdout, /Would render/);
});

test('Hito 4.4 is ready to close after all checkpoint evidence is complete', async () => {
  const state = await collectCurrentProjectState();

  assert.equal(state.milestone.id, '4.4');
  assert.equal(state.nextAction.kind, 'close-milestone');
  assert.match(state.nextAction.title, /Cerrar Hito 4\.4/);
});

test('Hito 4.2 components remain detected after the active milestone changes', async () => {
  const state = await collectCurrentProjectState();

  assert.equal(state.architecture.components.conversationContext, true);
  assert.equal(state.architecture.components.responseDraft, true);
});

test('the indirect webhook AI path is detected without claiming message sending', async () => {
  const state = await collectCurrentProjectState();

  assert.equal(state.architecture.components.responseDraftConnectedToWebhook, true);
  assert.equal(state.architecture.components.aiConnectedToWebhook, true);
  assert.equal(state.architecture.components.sender, false);
});

test('the current Hito 4.4 records all checkpoints complete without a sender', async () => {
  const state = await collectCurrentProjectState();

  assert.equal(state.milestone.checkpoints.length, 4);
  assert.deepEqual(
    state.milestone.checkpoints.map(({ id, complete }) => ({ id, complete })),
    [
      { id: '4.4-A', complete: true },
      { id: '4.4-B', complete: true },
      { id: '4.4-C', complete: true },
      { id: '4.4-D', complete: true },
    ],
  );
  assert.equal(state.nextAction.kind, 'close-milestone');
  assert.doesNotMatch(state.nextAction.text, /implementar.*4\.4-D/i);
  assert.equal(state.architecture.components.sender, false);
});

test('4.4-D remains incomplete when any required per-file assertion is truly absent', async () => {
  const evidence = await checkpointEvidence('4.4-D');
  const target = evidence.pathContentAll.find((candidate) => (
    candidate.path === 'agent-core/src/webhooks/evolution/evolution-webhook.service.spec.ts'
  ));
  const source = await readFile(path.join(repositoryRoot, target.path), 'utf8');

  assert.equal(await pathContentAllEvidenceMatches(evidence), true);
  assert.equal(
    await pathContentAllEvidenceMatches(
      evidence,
      new Map([[target.path, source.replace('outbox', 'out-box')]]),
    ),
    false,
  );
});

test('complete LF frontmatter remains valid', async (t) => {
  const file = await createTextFixture(t, fixtureNote('\n'));
  const text = await readNormalizedTextFile(file);
  const issues = [];

  const frontmatter = validateFrontmatter('fixture-lf.md', text, issues);

  assert.deepEqual(issues, []);
  assert.match(frontmatter, /^type: fixture-note$/m);
});

test('complete CRLF frontmatter is normalized and remains valid', async (t) => {
  const file = await createTextFixture(t, fixtureNote('\r\n'));
  const text = await readNormalizedTextFile(file);
  const issues = [];

  const frontmatter = validateFrontmatter('fixture-crlf.md', text, issues);

  assert.deepEqual(issues, []);
  assert.match(frontmatter, /^type: fixture-note$/m);
  assert.equal(text.includes('\r'), false);
});

test('CRLF frontmatter exposes fields between valid opening and closing delimiters', async (t) => {
  const file = await createTextFixture(
    t,
    fixtureNote('\r\n', { status: 'active', hito: '4.4' }),
  );
  const text = await readNormalizedTextFile(file);
  const issues = [];

  const frontmatter = validateFrontmatter('fixture-fields.md', text, issues);

  assert.deepEqual(issues, []);
  assert.match(frontmatter, /^status: active$/m);
  assert.match(frontmatter, /^hito: 4\.4$/m);
});

test('a document truly missing frontmatter still fails', async (t) => {
  const file = await createTextFixture(t, '# No frontmatter\r\n');
  const text = await readNormalizedTextFile(file);
  const issues = [];

  const frontmatter = validateFrontmatter('missing-frontmatter.md', text, issues);

  assert.equal(frontmatter, null);
  assert.deepEqual(issues, [
    'missing-frontmatter.md: missing YAML frontmatter',
  ]);
});

test('automation comparison treats an LF Git blob and equivalent CRLF working tree as equal', async (t) => {
  const fixture = await createGitTextFixture(t);
  const workingCrlf = fixture.base
    .replace('Old generated content.', 'New generated content.')
    .replace(/\n/g, '\r\n');
  await writeFile(fixture.file, workingCrlf, 'utf8');

  const working = await readNormalizedTextFile(fixture.file);

  assert.match(await readFile(fixture.file, 'utf8'), /\r\n/);
  assert.doesNotMatch(fixture.blob, /\r/);
  assert.equal(
    autoBlockComparisonText(fixture.blob),
    autoBlockComparisonText(working),
  );
});

test('duplicate hashes are equal for semantically identical LF and CRLF notes', async (t) => {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), '.docs-eol-hash-test-'),
  );
  t.after(async () => rm(temporaryDirectory, { recursive: true, force: true }));
  const lfFile = path.join(temporaryDirectory, 'lf.md');
  const crlfFile = path.join(temporaryDirectory, 'crlf.md');
  await writeFile(lfFile, fixtureNote('\n'), 'utf8');
  await writeFile(crlfFile, fixtureNote('\r\n'), 'utf8');

  const lfDigest = documentDigest(await readNormalizedTextFile(lfFile));
  const crlfDigest = documentDigest(await readNormalizedTextFile(crlfFile));

  assert.equal(crlfDigest, lfDigest);
});

test('automation comparison continues to detect a real human-content difference', async (t) => {
  const fixture = await createGitTextFixture(t);
  const changedCrlf = fixture.base
    .replace('Human content.', 'Changed human content.')
    .replace('Old generated content.', 'New generated content.')
    .replace(/\n/g, '\r\n');
  await writeFile(fixture.file, changedCrlf, 'utf8');

  const working = await readNormalizedTextFile(fixture.file);

  assert.notEqual(
    autoBlockComparisonText(fixture.blob),
    autoBlockComparisonText(working),
  );
});

test('generated true is accepted after CRLF frontmatter normalization', async (t) => {
  const file = await createTextFixture(t, fixtureNote('\r\n'));
  const text = await readNormalizedTextFile(file);
  const issues = [];
  const frontmatter = validateFrontmatter('generated-crlf.md', text, issues);

  validateGeneratedDeclaration(
    'generated-crlf.md', 'generated', frontmatter, issues,
  );

  assert.deepEqual(issues, []);
});

test('line-ending normalization handles CRLF and lone CR without changing content', () => {
  assert.equal(normalizeLineEndings('one\r\ntwo\rthree\n'), 'one\ntwo\nthree\n');
});
