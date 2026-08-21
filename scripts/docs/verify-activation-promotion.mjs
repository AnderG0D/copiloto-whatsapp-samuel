import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArguments } from './shared.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '../..');
const contractPath = 'docs/control/handoff-state.json';
const maintenanceRepairPaths = new Set([
  'docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first.md',
  'scripts/docs/verify-activation-promotion.mjs',
  'scripts/docs/activation-promotion.spec.mjs',
]);

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

function verifyMaintenanceRepair({ pullRequest, changedPaths }) {
  ensure(/^fix\/docs-[a-z0-9][a-z0-9-]*$/.test(pullRequest.head?.ref ?? ''),
    'schema 3 maintenance must use an explicit fix/docs-* repair branch');
  ensure(Array.isArray(changedPaths) && changedPaths.length > 0,
    'schema 3 maintenance must provide a non-empty pull request diff');
  const unauthorizedPath = changedPaths.find((changedPath) => (
    !maintenanceRepairPaths.has(changedPath)
  ));
  ensure(!unauthorizedPath,
    `schema 3 maintenance repair cannot modify ${unauthorizedPath}`);
}

export function changedPathsForPullRequest({ pullRequest, root = defaultRepositoryRoot }) {
  const baseSha = pullRequest?.base?.sha;
  const headSha = pullRequest?.head?.sha;
  ensure(/^[0-9a-f]{40}$/.test(baseSha ?? ''), 'pull request base SHA must be a full Git SHA');
  ensure(/^[0-9a-f]{40}$/.test(headSha ?? ''), 'pull request head SHA must be a full Git SHA');
  const output = execFileSync(
    'git',
    ['diff', '--name-only', '--no-renames', `${baseSha}...${headSha}`],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return output.split(/\r?\n/).filter(Boolean);
}

export function validatePullRequestContract({ contract, pullRequest, changedPaths }) {
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
    verifyMaintenanceRepair({ pullRequest, changedPaths });
    return 'maintenance-repair';
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
    const changedPaths = changedPathsForPullRequest({ root, pullRequest: event.pull_request });
    validatePullRequestContract({ contract, pullRequest: event.pull_request, changedPaths });
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
