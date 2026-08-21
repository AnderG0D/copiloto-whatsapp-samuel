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

test('pull request validation accepts only the declared activation pending PR', () => {
  const pendingContract = {
    schemaVersion: 3,
    lifecycleState: 'activation-pending-sync',
    activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
  };
  assert.throws(
    () => validatePullRequestContract({
      contract: pendingContract,
      pullRequest: promotionPullRequest({ number: 45, head: { ref: 'docs/activate-hito-4-5', sha: promotionSha } }),
    }),
    /declared activation pull request/,
  );
  assert.doesNotThrow(() => validatePullRequestContract({
    contract: pendingContract,
    pullRequest: promotionPullRequest({ number: 46, head: { ref: 'docs/activate-hito-4-5', sha: promotionSha } }),
  }));
});

test('workflow filters include isolated handoff-state changes and main waits for a promotion', async () => {
  const [syncWorkflow, backendWorkflow] = await Promise.all([
    readFile('.github/workflows/documentation-sync.yml', 'utf8'),
    readFile('.github/workflows/backend-ci.yml', 'utf8'),
  ]);
  assert.match(syncWorkflow, /'docs\/control\/handoff-state\.json'/);
  assert.match(backendWorkflow, /--await-promotion --source-sha/);
  assert.match(backendWorkflow, /--require-github-api/);
  assert.doesNotMatch(backendWorkflow, /--allow-activation-pending\n/);
});
