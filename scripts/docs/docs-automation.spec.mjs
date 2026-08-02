import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
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

const execFileAsync = promisify(execFile);
let currentProjectStatePromise;

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

test('Hito 4.3 selects its first pending checkpoint as the next action', async () => {
  const state = await collectCurrentProjectState();

  assert.equal(state.milestone.id, '4.3');
  assert.equal(state.nextAction.kind, 'implement-checkpoint');
  assert.match(state.nextAction.title, /^4\.3-A:/);
  assert.match(state.nextAction.text, /4\.3-A/);
});

test('Hito 4.2 components remain detected after the active milestone changes', async () => {
  const state = await collectCurrentProjectState();

  assert.equal(state.architecture.components.conversationContext, true);
  assert.equal(state.architecture.components.responseDraft, true);
});

test('the current Hito 4.3 evidence starts at zero of four checkpoints', async () => {
  const state = await collectCurrentProjectState();

  assert.equal(state.milestone.checkpoints.length, 4);
  assert.equal(
    state.milestone.checkpoints.filter((checkpoint) => checkpoint.complete).length,
    0,
  );
});
