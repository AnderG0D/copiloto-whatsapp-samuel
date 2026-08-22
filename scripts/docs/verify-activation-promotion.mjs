import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArguments } from './shared.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '../..');
const contractPath = 'docs/control/handoff-state.json';
const bootstrapRepair = Object.freeze({
  pullRequestNumber: 49,
  baseRef: 'main',
  headRef: 'fix/docs-auto-marker-escaping',
  headSha: '4654041e02746dad0b85c7bc4ef35c071429362a',
  directParentSha: '2b3e90123306e0b54ab066ddea13528d613a2976',
  repairBaseSha: '2b3e90123306e0b54ab066ddea13528d613a2976',
  allowedPaths: [
    'scripts/docs/generate-milestone-handoff.mjs',
    'scripts/docs/generate-milestone-handoff.spec.mjs',
  ],
  patchSha256: 'd81e0b3615e05924537d06d2447d3a5e2c2b4e195063a46beda31f7b3be54a3e',
});

function ensure(condition, message) {
  if (!condition) throw new Error(`Activation promotion verification failed: ${message}`);
}

async function requestJson(fetchImpl, url, token) {
  const response = await fetchImpl(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  ensure(response.ok, `GitHub API request failed (${response.status})`);
  return response.json();
}

export async function findActivationPromotion({
  repository,
  sourceSha,
  token,
  fetchImpl = fetch,
}) {
  ensure(/^[0-9a-f]{40}$/.test(sourceSha ?? ''), 'source SHA must be a full Git SHA');
  ensure(repository && token, 'GITHUB_REPOSITORY and GITHUB_TOKEN are required');
  const baseUrl = `https://api.github.com/repos/${repository}`;
  const pullRequests = await requestJson(
    fetchImpl,
    `${baseUrl}/pulls?state=open&base=main&per_page=100`,
    token,
  );

  for (const pullRequest of pullRequests) {
    if (
      pullRequest.base?.ref !== 'main'
      || !/^docs\/auto-sync-\d+$/.test(pullRequest.head?.ref ?? '')
      || pullRequest.user?.login !== 'github-actions[bot]'
      || !/^[0-9a-f]{40}$/.test(pullRequest.head?.sha ?? '')
    ) continue;

    const comparison = await requestJson(
      fetchImpl,
      `${baseUrl}/compare/${sourceSha}...${pullRequest.head.sha}`,
      token,
    );
    if (
      comparison.merge_base_commit?.sha === sourceSha
      && comparison.status === 'ahead'
      && comparison.ahead_by === 2
    ) return pullRequest;
  }

  return null;
}

export async function awaitActivationPromotion({
  repository,
  sourceSha,
  token,
  timeoutSeconds = 900,
  intervalMilliseconds = 10_000,
  fetchImpl = fetch,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
}) {
  const deadline = Date.now() + (timeoutSeconds * 1000);
  do {
    const promotion = await findActivationPromotion({ repository, sourceSha, token, fetchImpl });
    if (promotion) return promotion;
    if (Date.now() >= deadline) break;
    await sleep(intervalMilliseconds);
  } while (Date.now() < deadline);
  throw new Error('Activation promotion verification failed: no valid two-commit automatic promotion PR was associated with the current main revision before timeout');
}

function verifySafetyInvariants(contract) {
  ensure(contract.safetyInvariants?.sender === false, 'schema 3 must preserve sender=false');
  ensure(contract.safetyInvariants?.autoSendMessages === false,
    'schema 3 must preserve AUTO_SEND_MESSAGES=false');
  ensure(contract.safetyInvariants?.noLeadSend === true,
    'schema 3 must preserve noLeadSend=true');
}

function exactArray(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

function verifyBootstrapAuthorization({ contract, pullRequest, evidence, now }) {
  const authorization = contract.bootstrapMaintenanceAuthorization;
  ensure(authorization && typeof authorization === 'object',
    'schema 3 bootstrap maintenance authorization is required');
  for (const key of [
    'pullRequestNumber', 'baseRef', 'headRef', 'headSha', 'directParentSha',
    'repairBaseSha', 'patchSha256',
  ]) {
    ensure(authorization[key] === bootstrapRepair[key],
      `schema 3 bootstrap maintenance authorization has an unexpected ${key}`);
  }
  ensure(exactArray(authorization.allowedPaths, bootstrapRepair.allowedPaths),
    'schema 3 bootstrap maintenance authorization has unexpected allowedPaths');
  ensure(authorization.consumed === false,
    'schema 3 bootstrap maintenance authorization has already been consumed');
  ensure(typeof authorization.expiresAt === 'string' && Number.isFinite(Date.parse(authorization.expiresAt)),
    'schema 3 bootstrap maintenance authorization must declare a valid expiresAt');
  ensure(Date.parse(authorization.expiresAt) > now.getTime(),
    'schema 3 bootstrap maintenance authorization has expired');

  ensure(pullRequest.number === bootstrapRepair.pullRequestNumber,
    'schema 3 bootstrap maintenance authorization only permits pull request #49');
  ensure(pullRequest.base?.ref === bootstrapRepair.baseRef,
    'schema 3 bootstrap maintenance pull request base must be main');
  ensure(pullRequest.head?.ref === bootstrapRepair.headRef,
    'schema 3 bootstrap maintenance pull request head ref is not authorized');
  ensure(pullRequest.head?.sha === bootstrapRepair.headSha,
    'schema 3 bootstrap maintenance pull request head SHA is not authorized');
  ensure(pullRequest.state === 'open' && pullRequest.merged !== true && pullRequest.merged_at == null,
    'schema 3 bootstrap maintenance pull request must be open and unmerged');
  ensure(evidence && typeof evidence === 'object',
    'schema 3 bootstrap maintenance pull request evidence is required');
  ensure(evidence?.baseSha === bootstrapRepair.repairBaseSha,
    'schema 3 bootstrap maintenance pull request base SHA is not authorized');
  ensure(evidence.mergeBaseSha === bootstrapRepair.repairBaseSha,
    'schema 3 bootstrap maintenance pull request merge-base is not authorized');
  ensure(evidence.directParentSha === bootstrapRepair.directParentSha && evidence.commitCount === 1,
    'schema 3 bootstrap maintenance pull request must contain exactly the authorized commit');
  ensure(exactArray(evidence.changedPaths, bootstrapRepair.allowedPaths),
    'schema 3 bootstrap maintenance pull request has unexpected changed paths');
  ensure(evidence.changes?.every(({ status, oldMode, newMode }) => (
    status === 'M' && oldMode === newMode
  )), 'schema 3 bootstrap maintenance pull request cannot rename, change mode, or delete files');
  ensure(evidence.patchSha256 === bootstrapRepair.patchSha256,
    'schema 3 bootstrap maintenance pull request patch hash is not authorized');
}

export function bootstrapEvidenceForPullRequest({ pullRequest, root = defaultRepositoryRoot }) {
  const baseSha = pullRequest?.base?.sha;
  const headSha = pullRequest?.head?.sha;
  ensure(/^[0-9a-f]{40}$/.test(baseSha ?? ''), 'pull request base SHA must be a full Git SHA');
  ensure(/^[0-9a-f]{40}$/.test(headSha ?? ''), 'pull request head SHA must be a full Git SHA');
  const git = (args) => execFileSync('git', args, {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  const rawChanges = git(['diff', '--raw', '--no-renames', `${baseSha}...${headSha}`]);
  const changes = rawChanges ? rawChanges.split(/\r?\n/).map((line) => {
    const match = /^:([0-7]{6}) ([0-7]{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])\t(.+)$/.exec(line);
    ensure(match, 'pull request diff contains an unsupported change record');
    return { oldMode: match[1], newMode: match[2], status: match[3], path: match[4] };
  }) : [];
  const parentLine = git(['rev-list', '--parents', '-n', '1', headSha]).split(/\s+/);
  const patch = execFileSync(
    'git',
    ['diff', '--full-index', '--no-ext-diff', `${baseSha}...${headSha}`],
    { cwd: root, encoding: 'buffer', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return {
    baseSha,
    mergeBaseSha: git(['merge-base', baseSha, headSha]),
    directParentSha: parentLine[1],
    commitCount: Number(git(['rev-list', '--count', `${baseSha}..${headSha}`])),
    changedPaths: changes.map(({ path: changedPath }) => changedPath),
    changes,
    patchSha256: createHash('sha256').update(patch).digest('hex'),
  };
}

export function validatePullRequestContract({ contract, pullRequest, evidence, now = new Date() }) {
  ensure(pullRequest?.base?.ref === 'main', 'pull request base must be main');
  ensure(pullRequest?.state === 'open', 'pull request must be open');
  if (contract.schemaVersion === 3) {
    const expected = contract.activationPullRequest;
    ensure(contract.lifecycleState === 'activation-pending-sync', 'schema 3 must be activation-pending-sync');
    ensure(Number.isInteger(expected?.number) && typeof expected.headRef === 'string',
      'pending contract must declare its activation pull request');
    verifySafetyInvariants(contract);
    if (pullRequest.number === expected.number && pullRequest.head?.ref === expected.headRef) {
      return 'activation';
    }
    verifyBootstrapAuthorization({ contract, pullRequest, evidence, now });
    return 'bootstrap-maintenance';
  }
  if (contract.schemaVersion === 1) {
    ensure(/^docs\/auto-sync-\d+$/.test(pullRequest.head?.ref ?? ''),
      'schema 1 is only valid for an automatic documentation promotion pull request');
    ensure(pullRequest.user?.login === 'github-actions[bot]',
      'schema 1 promotion pull request must be created by github-actions[bot]');
    return 'promotion';
  }
  throw new Error('Activation promotion verification failed: pull request handoff contract must use schemaVersion 1 or 3');
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (args['verify-pull-request'] === true) {
    const root = args.root ? path.resolve(args.root) : defaultRepositoryRoot;
    const eventPath = process.env.GITHUB_EVENT_PATH;
    ensure(eventPath, 'GITHUB_EVENT_PATH is required for pull request validation');
    const [contract, event] = await Promise.all([
      readFile(path.join(root, ...contractPath.split('/')), 'utf8').then(JSON.parse),
      readFile(eventPath, 'utf8').then(JSON.parse),
    ]);
    const evidence = bootstrapEvidenceForPullRequest({ root, pullRequest: event.pull_request });
    validatePullRequestContract({ contract, pullRequest: event.pull_request, evidence });
    console.log('Pull request handoff contract verified');
    return;
  }
  ensure(args['await-promotion'] === true, 'expected --verify-pull-request or --await-promotion');
  const promotion = await awaitActivationPromotion({
    repository: process.env.GITHUB_REPOSITORY,
    sourceSha: args['source-sha'],
    token: process.env.GITHUB_TOKEN,
    timeoutSeconds: Number(args['timeout-seconds'] ?? 900),
  });
  console.log(`Activation promotion PR #${promotion.number} verified`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
