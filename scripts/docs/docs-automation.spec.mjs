import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyPath,
  deriveNextAction,
  globToRegExp,
  replaceAutoBlock,
  stripAutoBlockBodies,
} from './shared.mjs';

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
