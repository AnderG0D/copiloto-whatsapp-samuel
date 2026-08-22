import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { bootstrapEvidenceForPullRequest, findActivationPromotion, validatePullRequestContract } from './verify-activation-promotion.mjs';

const sha = 'a'.repeat(40);
const promotionSha = 'b'.repeat(40);
const currentMainSha = '3678bd9b12fd4c02f22d034b47c8193f0fded827';
const bootstrap = {
  pullRequestNumber: 49, baseRef: 'main', headRef: 'fix/docs-auto-marker-escaping',
  headSha: '4654041e02746dad0b85c7bc4ef35c071429362a',
  directParentSha: '2b3e90123306e0b54ab066ddea13528d613a2976',
  repairBaseSha: '2b3e90123306e0b54ab066ddea13528d613a2976',
  allowedPaths: ['scripts/docs/generate-milestone-handoff.mjs', 'scripts/docs/generate-milestone-handoff.spec.mjs'],
  patchSha256: 'd81e0b3615e05924537d06d2447d3a5e2c2b4e195063a46beda31f7b3be54a3e',
  expiresAt: '2099-01-01T00:00:00.000Z', consumed: false,
};

function response(body, status = 200) { return { ok: status >= 200 && status < 300, status, json: async () => body }; }
function promotionPullRequest(overrides = {}) {
  return { number: 99, state: 'open', base: { ref: 'main' },
    head: { ref: 'docs/auto-sync-123', sha: promotionSha }, user: { login: 'github-actions[bot]' }, ...overrides };
}
function pendingContract(overrides = {}) {
  return { schemaVersion: 3, lifecycleState: 'activation-pending-sync',
    activationPullRequest: { number: 46, headRef: 'docs/activate-hito-4-5' },
    safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: true },
    bootstrapMaintenanceAuthorization: { ...bootstrap }, ...overrides };
}
function bootstrapPullRequest(overrides = {}) {
  return { number: 49, state: 'open', merged: false, merged_at: null,
    base: { ref: 'main', sha: currentMainSha }, head: { ref: bootstrap.headRef, sha: bootstrap.headSha }, ...overrides };
}
function bootstrapEvidence(overrides = {}) {
  return { baseSha: currentMainSha, mergeBaseSha: bootstrap.repairBaseSha,
    directParentSha: bootstrap.directParentSha, commitCount: 1, changedPaths: [...bootstrap.allowedPaths],
    changes: bootstrap.allowedPaths.map((path) => ({ path, status: 'M', oldMode: '100644', newMode: '100644' })),
    patchSha256: bootstrap.patchSha256, ...overrides };
}
function assertBootstrapRejected(overrides, error) {
  assert.throws(() => validatePullRequestContract({ contract: pendingContract(overrides.contract),
    pullRequest: bootstrapPullRequest(overrides.pullRequest), evidence: bootstrapEvidence(overrides.evidence),
    now: new Date('2026-08-21T00:00:00.000Z') }), error);
}

test('rejects a main schema 3 revision without an associated automatic promotion', async () => {
  const result = await findActivationPromotion({ repository: 'example/project', sourceSha: sha, token: 'test-token',
    fetchImpl: async () => response([]) });
  assert.equal(result, null);
});

test('accepts only a two-commit automatic promotion rooted at the current main revision', async () => {
  const result = await findActivationPromotion({ repository: 'example/project', sourceSha: sha, token: 'test-token',
    fetchImpl: async (url) => (url.includes('/pulls?') ? response([promotionPullRequest()]) : response({ merge_base_commit: { sha }, status: 'ahead', ahead_by: 2 })) });
  assert.equal(result.number, 99);
});

test('rejects a promotion PR with an invalid history relationship', async () => {
  const result = await findActivationPromotion({ repository: 'example/project', sourceSha: sha, token: 'test-token',
    fetchImpl: async (url) => (url.includes('/pulls?') ? response([promotionPullRequest()]) : response({ merge_base_commit: { sha }, status: 'ahead', ahead_by: 1 })) });
  assert.equal(result, null);
});

test('schema 1 rejects an arbitrary PR and accepts the automatic promotion PR', () => {
  assert.throws(() => validatePullRequestContract({ contract: { schemaVersion: 1 },
    pullRequest: promotionPullRequest({ head: { ref: 'feature/arbitrary', sha: promotionSha } }) }), /only valid for an automatic documentation promotion/);
  assert.doesNotThrow(() => validatePullRequestContract({ contract: { schemaVersion: 1 }, pullRequest: promotionPullRequest() }));
});

test('schema 3 accepts only activation PR #46 on its normal route', () => {
  assert.equal(validatePullRequestContract({ contract: pendingContract({ bootstrapMaintenanceAuthorization: undefined }),
    pullRequest: bootstrapPullRequest({ number: 46, head: { ref: 'docs/activate-hito-4-5', sha: 'b'.repeat(40) } }) }), 'activation');
  assertBootstrapRejected({ pullRequest: { number: 47, head: { ref: 'fix/docs-anything', sha: bootstrap.headSha } } }, /only permits pull request #49/);
});

test('accepts the exact unconsumed, unexpired bootstrap patch for PR #49', () => {
  assert.equal(validatePullRequestContract({ contract: pendingContract(), pullRequest: bootstrapPullRequest(), evidence: bootstrapEvidence(), now: new Date('2026-08-21T00:00:00.000Z') }), 'bootstrap-maintenance');
});

test('derives the authorized evidence from the pinned PR #49 commit', () => {
  const pullRequest = bootstrapPullRequest();
  const evidence = bootstrapEvidenceForPullRequest({ pullRequest });
  assert.equal(evidence.baseSha, currentMainSha);
  assert.equal(evidence.mergeBaseSha, bootstrap.repairBaseSha);
  assert.equal(evidence.directParentSha, bootstrap.directParentSha);
  assert.equal(evidence.patchSha256, bootstrap.patchSha256);
  assert.equal(validatePullRequestContract({ contract: pendingContract(), pullRequest, evidence,
    now: new Date('2026-08-21T00:00:00.000Z') }), 'bootstrap-maintenance');
});

test('accepts the real PR #49 event with current main and historical merge-base', () => {
  const pullRequest = bootstrapPullRequest();
  const evidence = bootstrapEvidenceForPullRequest({ pullRequest });
  assert.deepEqual(evidence, bootstrapEvidence());
  assert.equal(validatePullRequestContract({ contract: pendingContract(), pullRequest, evidence,
    now: new Date('2026-08-21T00:00:00.000Z') }), 'bootstrap-maintenance');
});

for (const [name, overrides, error] of [
  ['missing authorization', { contract: { bootstrapMaintenanceAuthorization: undefined } }, /authorization is required/],
  ['tampered authorization pin', { contract: { bootstrapMaintenanceAuthorization: { ...bootstrap, directParentSha: sha } } }, /unexpected directParentSha/],
  ['tampered authorization paths', { contract: { bootstrapMaintenanceAuthorization: { ...bootstrap, allowedPaths: [bootstrap.allowedPaths[0]] } } }, /unexpected allowedPaths/],
  ['other PR', { pullRequest: { number: 48 } }, /only permits pull request #49/],
  ['other fix/docs branch', { pullRequest: { head: { ref: 'fix/docs-other', sha: bootstrap.headSha } } }, /head ref/],
  ['different head SHA', { pullRequest: { head: { ref: bootstrap.headRef, sha } } }, /head SHA/],
  ['wrong base ref', { pullRequest: { base: { ref: 'trunk', sha: currentMainSha } } }, /base must be main/],
  ['wrong merge base', { evidence: { mergeBaseSha: sha } }, /merge-base/],
  ['additional commit', { evidence: { commitCount: 2 } }, /exactly the authorized commit/],
  ['different parent', { evidence: { directParentSha: sha } }, /exactly the authorized commit/],
  ['force push', { pullRequest: { head: { ref: bootstrap.headRef, sha } } }, /head SHA/],
  ['additional file', { evidence: { changedPaths: [...bootstrap.allowedPaths, 'README.md'] } }, /changed paths/],
  ['rename', { evidence: { changes: [{ path: bootstrap.allowedPaths[0], status: 'R', oldMode: '100644', newMode: '100644' }] } }, /rename, change mode, or delete/],
  ['mode change', { evidence: { changes: [{ path: bootstrap.allowedPaths[0], status: 'M', oldMode: '100644', newMode: '100755' }] } }, /rename, change mode, or delete/],
  ['deletion', { evidence: { changes: [{ path: bootstrap.allowedPaths[0], status: 'D', oldMode: '100644', newMode: '000000' }] } }, /rename, change mode, or delete/],
  ['different patch hash', { evidence: { patchSha256: '0'.repeat(64) } }, /patch hash/],
  ['merged pull request', { pullRequest: { merged: true } }, /open and unmerged/],
  ['closed pull request', { pullRequest: { state: 'closed' } }, /pull request must be open/],
  ['expired authorization', { contract: { bootstrapMaintenanceAuthorization: { ...bootstrap, expiresAt: '2026-08-20T00:00:00.000Z' } } }, /expired/],
  ['consumed authorization', { contract: { bootstrapMaintenanceAuthorization: { ...bootstrap, consumed: true } } }, /already been consumed/],
  ['sender invariant', { contract: { safetyInvariants: { sender: true, autoSendMessages: false, noLeadSend: true } } }, /sender=false/],
  ['AUTO_SEND_MESSAGES invariant', { contract: { safetyInvariants: { sender: false, autoSendMessages: true, noLeadSend: true } } }, /AUTO_SEND_MESSAGES=false/],
  ['noLeadSend invariant', { contract: { safetyInvariants: { sender: false, autoSendMessages: false, noLeadSend: false } } }, /noLeadSend=true/],
]) test(`rejects bootstrap maintenance with ${name}`, () => assertBootstrapRejected(overrides, error));

test('permits a changed current main base when the authorized historical merge-base remains intact', () => {
  assert.equal(validatePullRequestContract({ contract: pendingContract(), pullRequest: bootstrapPullRequest({
    base: { ref: 'main', sha },
  }), evidence: bootstrapEvidence({ baseSha: sha }), now: new Date('2026-08-21T00:00:00.000Z') }), 'bootstrap-maintenance');
});

for (const changedPath of [
  'scripts/docs/collect-project-state.mjs',
  'docs/control/handoff-state.json',
  'docs/control/milestones.json',
  'docs/control/documentation-policy.json',
  'docs/_generated/project-state.json',
  'docs/obsidian/Copiloto WhatsApp Samuel/_generated/Prompt Maestro - Hito actual.md',
  'docs/obsidian/Copiloto WhatsApp Samuel/04 Handoffs/Hito 04.4 a 04.5.md',
  'agent-core/src/main.ts',
]) {
  test(`rejects bootstrap maintenance changing restricted path ${changedPath}`, () => {
    assertBootstrapRejected({ evidence: { changedPaths: [...bootstrap.allowedPaths, changedPath] } }, /unexpected changed paths/);
  });
}

test('workflow filters include isolated handoff-state changes and main waits for a promotion', async () => {
  const [activeMilestone, syncWorkflow, backendWorkflow] = await Promise.all([
    readFile('docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first.md', 'utf8'),
    readFile('.github/workflows/documentation-sync.yml', 'utf8'),
    readFile('.github/workflows/backend-ci.yml', 'utf8'),
  ]);
  assert.match(activeMilestone, /^## Gate técnico previo$/m);
  assert.match(syncWorkflow, /'docs\/control\/handoff-state\.json'/);
  assert.match(backendWorkflow, /--await-promotion --source-sha/);
  assert.match(backendWorkflow, /--require-github-api/);
  assert.doesNotMatch(backendWorkflow, /--allow-activation-pending\n/);
});
