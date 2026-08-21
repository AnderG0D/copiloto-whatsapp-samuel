import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  findActivationPromotion,
  validatePullRequestContract,
} from './verify-activation-promotion.mjs';

const sha = 'a'.repeat(40);
const promotionSha = 'b'.repeat(40);

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function promotionPullRequest(overrides = {}) {
  return {
    number: 99,
    state: 'open',
    base: { ref: 'main' },
    head: { ref: 'docs/auto-sync-123', sha: promotionSha },
    user: { login: 'github-actions[bot]' },
    ...overrides,
  };
}

test('rejects a main schema 3 revision without an associated automatic promotion', async () => {
  const result = await findActivationPromotion({
    repository: 'example/project',
    sourceSha: sha,
    token: 'test-token',
    fetchImpl: async () => response([]),
  });
  assert.equal(result, null);
});

test('accepts only a two-commit automatic promotion rooted at the current main revision', async () => {
  const result = await findActivationPromotion({
    repository: 'example/project',
    sourceSha: sha,
    token: 'test-token',
    fetchImpl: async (url) => {
      if (url.includes('/pulls?')) return response([promotionPullRequest()]);
      return response({
        merge_base_commit: { sha },
        status: 'ahead',
        ahead_by: 2,
      });
    },
  });
  assert.equal(result.number, 99);
});

test('rejects a promotion PR with an invalid history relationship', async () => {
  const result = await findActivationPromotion({
    repository: 'example/project',
    sourceSha: sha,
    token: 'test-token',
    fetchImpl: async (url) => {
      if (url.includes('/pulls?')) return response([promotionPullRequest()]);
      return response({
        merge_base_commit: { sha },
        status: 'ahead',
        ahead_by: 1,
      });
    },
  });
  assert.equal(result, null);
});

test('pull request validation rejects an arbitrary schema 1 PR and accepts the automatic promotion PR', () => {
  const finalContract = { schemaVersion: 1 };
  assert.throws(
    () => validatePullRequestContract({
      contract: finalContract,
      pullRequest: promotionPullRequest({ head: { ref: 'feature/arbitrary', sha: promotionSha } }),
    }),
    /only valid for an automatic documentation promotion/,
  );
  assert.doesNotThrow(() => validatePullRequestContract({
    contract: finalContract,
    pullRequest: promotionPullRequest(),
  }));
});

test('pull request validation accepts the declared activation pending PR #46', () => {
  const pendingContract = {
    schemaVersion: 3,
    lifecycleState: 'activation-pending-sync',
    activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
    safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: true },
  };
  const activationPullRequest = promotionPullRequest({
    number: 46,
    head: { ref: 'docs/activate-hito-4-5', sha: promotionSha },
  });
  assert.throws(
    () => validatePullRequestContract({
      contract: pendingContract,
      pullRequest: promotionPullRequest({ number: 45, head: { ref: 'docs/activate-hito-4-5', sha: promotionSha } }),
    }),
    /explicit fix\/docs-\* repair branch/,
  );
  assert.equal(validatePullRequestContract({
    contract: pendingContract,
    pullRequest: activationPullRequest,
  }), 'activation');
});

function documentationRepairPullRequest(overrides = {}) {
  return promotionPullRequest({
    number: 47,
    head: { ref: 'fix/docs-handoff-4-5-gate-v2', sha: promotionSha },
    ...overrides,
  });
}

const documentationRepairPaths = [
  'docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first.md',
  'scripts/docs/verify-activation-promotion.mjs',
  'scripts/docs/activation-promotion.spec.mjs',
  'scripts/docs/generate-milestone-handoff.spec.mjs',
];

test('pull request validation accepts a constrained documentation repair including the handoff generator test', () => {
  const pendingContract = {
    schemaVersion: 3,
    lifecycleState: 'activation-pending-sync',
    activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
    safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: true },
  };
  assert.equal(validatePullRequestContract({
    contract: pendingContract,
    pullRequest: documentationRepairPullRequest(),
    changedPaths: documentationRepairPaths,
  }), 'maintenance-repair');
});

test('pull request validation accepts a chain of constrained documentation repairs after PR #46', () => {
  const pendingContract = {
    schemaVersion: 3,
    lifecycleState: 'activation-pending-sync',
    activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
    safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: true },
  };
  for (const number of [47, 48, 49]) {
    assert.equal(validatePullRequestContract({
      contract: pendingContract,
      pullRequest: documentationRepairPullRequest({
        number,
        head: { ref: `fix/docs-handoff-4-5-gate-v${number}`, sha: promotionSha },
      }),
      changedPaths: documentationRepairPaths,
    }), 'maintenance-repair');
  }
});

test('pull request validation accepts the four repair scripts without requiring an active-note change', () => {
  const pendingContract = {
    schemaVersion: 3,
    lifecycleState: 'activation-pending-sync',
    activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
    safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: true },
  };
  assert.equal(validatePullRequestContract({
    contract: pendingContract,
    pullRequest: documentationRepairPullRequest(),
    changedPaths: documentationRepairPaths.slice(1),
  }), 'maintenance-repair');
});

test('pull request validation rejects any fifth repair path', () => {
  const pendingContract = {
    schemaVersion: 3,
    lifecycleState: 'activation-pending-sync',
    activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
    safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: true },
  };
  assert.throws(
    () => validatePullRequestContract({
      contract: pendingContract,
      pullRequest: documentationRepairPullRequest(),
      changedPaths: [...documentationRepairPaths, 'scripts/docs/collect-project-state.mjs'],
    }),
    /cannot modify scripts\/docs\/collect-project-state\.mjs/,
  );
});

for (const changedPath of [
  'docs/control/handoff-state.json',
  'docs/control/milestones.json',
  'docs/control/documentation-policy.json',
  'docs/_generated/project-state.json',
  'docs/obsidian/Copiloto WhatsApp Samuel/_generated/Prompt Maestro - Hito actual.md',
  'docs/obsidian/Copiloto WhatsApp Samuel/04 Handoffs/Hito 04.4 a 04.5.md',
  'agent-core/src/main.ts',
]) {
  test(`pull request validation rejects a schema 3 maintenance repair changing ${changedPath}`, () => {
    const pendingContract = {
      schemaVersion: 3,
      lifecycleState: 'activation-pending-sync',
      activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
      safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: true },
    };
    assert.throws(
      () => validatePullRequestContract({
        contract: pendingContract,
        pullRequest: documentationRepairPullRequest(),
        changedPaths: [...documentationRepairPaths, changedPath],
      }),
      new RegExp(`cannot modify ${changedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
  });
}

for (const [safetyInvariants, error] of [
  [{ sender: true, autoSendMessages: false, noLeadSend: true }, /sender=false/],
  [{ sender: false, autoSendMessages: true, noLeadSend: true }, /AUTO_SEND_MESSAGES=false/],
  [{ sender: false, autoSendMessages: false, noLeadSend: false }, /noLeadSend=true/],
]) {
  test('pull request validation rejects a schema 3 repair that weakens a safety invariant', () => {
    const pendingContract = {
      schemaVersion: 3,
      lifecycleState: 'activation-pending-sync',
      activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
      safetyInvariants,
    };
    assert.throws(
      () => validatePullRequestContract({
        contract: pendingContract,
        pullRequest: documentationRepairPullRequest(),
        changedPaths: documentationRepairPaths,
      }),
      error,
    );
  });
}

test('workflow filters include isolated handoff-state changes and main waits for a promotion', async () => {
  const [activeMilestone, syncWorkflow, backendWorkflow] = await Promise.all([
    readFile(
      'docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first.md',
      'utf8',
    ),
    readFile('.github/workflows/documentation-sync.yml', 'utf8'),
    readFile('.github/workflows/backend-ci.yml', 'utf8'),
  ]);
  assert.match(activeMilestone, /^## Gate técnico previo$/m);
  assert.match(syncWorkflow, /'docs\/control\/handoff-state\.json'/);
  assert.match(backendWorkflow, /--await-promotion --source-sha/);
  assert.match(backendWorkflow, /--require-github-api/);
  assert.doesNotMatch(backendWorkflow, /--allow-activation-pending\n/);
});
