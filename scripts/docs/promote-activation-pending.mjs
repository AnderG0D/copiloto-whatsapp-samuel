import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArguments } from './shared.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '../..');
const contractPath = 'docs/control/handoff-state.json';
const milestonesPath = 'docs/control/milestones.json';
const statePath = 'docs/_generated/project-state.json';
const maintenanceRepairPaths = new Set([
  'docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first.md',
  'scripts/docs/verify-activation-promotion.mjs',
  'scripts/docs/activation-promotion.spec.mjs',
  'scripts/docs/generate-milestone-handoff.spec.mjs',
  'scripts/docs/promote-activation-pending.mjs',
]);
const historicalRepairPullRequest49 = Object.freeze({
  number: 49,
  baseRef: 'main',
  headRef: 'fix/docs-auto-marker-escaping',
  headSha: '4654041e02746dad0b85c7bc4ef35c071429362a',
  directParentSha: '2b3e90123306e0b54ab066ddea13528d613a2976',
  repairBaseSha: '2b3e90123306e0b54ab066ddea13528d613a2976',
  paths: [
    'scripts/docs/generate-milestone-handoff.mjs',
    'scripts/docs/generate-milestone-handoff.spec.mjs',
  ],
  patchSha256: 'd81e0b3615e05924537d06d2447d3a5e2c2b4e195063a46beda31f7b3be54a3e',
});

function ensure(condition, message) {
  if (!condition) throw new Error(`Activation promotion failed: ${message}`);
}

function git(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    throw new Error(`Activation promotion failed: git ${args.join(' ')} failed: ${String(error.stderr ?? '').trim()}`);
  }
}

function gitBytes(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    throw new Error(`Activation promotion failed: git ${args.join(' ')} failed: ${String(error.stderr ?? '').trim()}`);
  }
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function readJson(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, ...relativePath.split('/')), 'utf8'));
}

async function writeJson(root, relativePath, value) {
  await writeFile(
    path.join(root, ...relativePath.split('/')),
    `${JSON.stringify(value, null, 2)}\n`,
    'utf8',
  );
}

function requireSha(name, value) {
  ensure(/^[0-9a-f]{40}$/.test(value ?? ''), `${name} must be a full Git SHA`);
}

function isAncestor(root, ancestor, descendant) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: root,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

async function verifyObservedPullRequest({ repository, observedRevision, pullRequest, token, fetchImpl = fetch }) {
  ensure(repository && token, 'GitHub repository and token are required for final promotion verification');
  ensure(pullRequest && typeof pullRequest === 'object', 'post-merge snapshot pull request is missing');
  ensure(pullRequest.source === 'github-api', 'post-merge snapshot pull request must come from the GitHub API');
  ensure(pullRequest.state === 'closed', 'post-merge snapshot pull request is not closed');
  ensure(typeof pullRequest.mergedAt === 'string' && pullRequest.mergedAt.length > 0,
    'post-merge snapshot pull request has no mergedAt');
  const response = await fetchImpl(
    `https://api.github.com/repos/${repository}/commits/${observedRevision}/pulls`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  ensure(response.ok, `GitHub API pull request association lookup failed (${response.status})`);
  const associated = await response.json();
  const verified = associated.find((item) => (
    item.number === pullRequest.number
    && item.state === 'closed'
    && typeof item.merged_at === 'string'
    && item.merged_at.length > 0
  ));
  ensure(verified, 'post-merge snapshot pull request is not associated with observedRevision in GitHub');
  ensure(verified.merged_at === pullRequest.mergedAt,
    'post-merge snapshot mergedAt does not match GitHub');
}

async function requestGitHubJson({ fetchImpl, token, url }) {
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

export async function verifyHistoricalRepairPullRequest49({
  source,
  files,
  root,
  gitFn = git,
  gitBytesFn = gitBytes,
}) {
  const repair = historicalRepairPullRequest49;
  ensure(source.number === repair.number
    && source.state === 'closed'
    && source.merged === true
    && typeof source.merged_at === 'string'
    && source.merged_at.length > 0,
  'historical post-merge snapshot repair must be merged PR #49');
  ensure(source.base?.ref === repair.baseRef,
    'historical post-merge snapshot repair has an unexpected base branch');
  ensure(source.head?.ref === repair.headRef && source.head?.sha === repair.headSha,
    'historical post-merge snapshot repair has an unexpected head');
  ensure(Array.isArray(files) && files.length === repair.paths.length,
    'historical post-merge snapshot repair must modify exactly the authorized paths');
  const filePaths = new Set(files.map(({ filename }) => filename));
  ensure(filePaths.size === repair.paths.length
    && repair.paths.every((file) => filePaths.has(file))
    && files.every((file) => file.status === 'modified' && file.previous_filename === undefined),
  'historical post-merge snapshot repair must contain only ordinary modifications');

  ensure(gitFn(root, ['rev-parse', `${repair.headSha}^{commit}`]) === repair.headSha,
    'historical post-merge snapshot repair head does not resolve to the authorized commit');
  const parents = gitFn(root, ['rev-list', '--parents', '-n', '1', repair.headSha])
    .split(/\s+/).slice(1);
  ensure(parents.length === 1 && parents[0] === repair.directParentSha,
    'historical post-merge snapshot repair has an unexpected direct parent');
  ensure(gitFn(root, ['merge-base', repair.directParentSha, repair.headSha]) === repair.repairBaseSha,
    'historical post-merge snapshot repair has an unexpected merge-base');

  const rawDiff = gitFn(root, [
    'diff-tree', '--no-commit-id', '--raw', '--abbrev=40', '--no-renames', '-r', repair.headSha,
  ]);
  const expectedRawDiff = repair.paths.map((file) => `:100644 100644 [0-9a-f]{40} [0-9a-f]{40} M\\t${file}`);
  const rawLines = rawDiff.split('\n').filter(Boolean);
  ensure(rawLines.length === expectedRawDiff.length
    && rawLines.every((line, index) => new RegExp(`^${expectedRawDiff[index]}$`).test(line)),
  'historical post-merge snapshot repair must use mode 100644 without renames or deletions');

  const patch = gitBytesFn(root, [
    'diff', '--binary', '--full-index', '--no-color', '--no-ext-diff', '--no-textconv',
    '--no-renames', '--diff-algorithm=myers', '--src-prefix=a/', '--dst-prefix=b/',
    repair.directParentSha, repair.headSha, '--', ...repair.paths,
  ]);
  ensure(sha256(patch) === repair.patchSha256,
    'historical post-merge snapshot repair has an unexpected patch hash');
}

async function verifySnapshotPullRequest({
  activationPullRequest,
  observedRevision,
  pullRequest,
  repository,
  token,
  root,
  fetchImpl = fetch,
}) {
  ensure(repository && token, 'GitHub repository and token are required for final promotion verification');
  const baseUrl = `https://api.github.com/repos/${repository}`;
  const [activation, source] = await Promise.all([
    requestGitHubJson({
      fetchImpl,
      token,
      url: `${baseUrl}/pulls/${activationPullRequest.number}`,
    }),
    requestGitHubJson({
      fetchImpl,
      token,
      url: `${baseUrl}/pulls/${pullRequest.number}`,
    }),
  ]);

  ensure(activation.state === 'closed' && typeof activation.merged_at === 'string'
    && activation.merged_at.length > 0,
  'activation pull request must be closed and merged');
  requireSha('activation pull request merge_commit_sha', activation.merge_commit_sha);
  ensure(isAncestor(root, activation.merge_commit_sha, observedRevision),
    'activation pull request merge commit is not an ancestor of observedRevision');

  ensure(source.number === pullRequest.number
    && source.state === 'closed'
    && source.merged_at === pullRequest.mergedAt,
  'post-merge snapshot pull request does not match GitHub');
  if (source.number === activationPullRequest.number) return;

  const files = await requestGitHubJson({
    fetchImpl,
    token,
    url: `${baseUrl}/pulls/${source.number}/files?per_page=100`,
  });
  if (source.number === historicalRepairPullRequest49.number) {
    await verifyHistoricalRepairPullRequest49({ source, files, root });
    return;
  }

  ensure(/^fix\/docs-[a-z0-9][a-z0-9-]*$/.test(source.head?.ref ?? ''),
    'post-merge snapshot repair must use an explicit fix/docs-* branch');
  ensure(Array.isArray(files) && files.length > 0,
    'post-merge snapshot repair must provide a non-empty pull request diff');
  const unauthorized = files.find(({ filename }) => !maintenanceRepairPaths.has(filename));
  if (unauthorized) {
    ensure(false, `post-merge snapshot repair cannot modify ${unauthorized.filename}`);
  }
}

function handoffOutputs(lastClosedMilestone, activeMilestone) {
  const format = (id) => {
    const [major, ...rest] = id.split('.');
    return [major.padStart(2, '0'), ...rest].join('.');
  };
  const docsRoot = 'docs/obsidian/Copiloto WhatsApp Samuel';
  return {
    masterPrompt: `${docsRoot}/_generated/Prompt Maestro - Hito actual.md`,
    portablePrompt: `${docsRoot}/_generated/Prompt Portatil - Hito actual.md`,
    historicalHandoff: `${docsRoot}/04 Handoffs/Hito ${format(lastClosedMilestone)} a ${format(activeMilestone)}.md`,
  };
}

export async function promoteActivationPending({
  root = defaultRepositoryRoot,
  observedRevision,
  frozenRevision,
} = {}) {
  requireSha('observedRevision', observedRevision);
  requireSha('frozenRevision', frozenRevision);
  ensure(git(root, ['rev-parse', `${observedRevision}^{commit}`]) === observedRevision,
    'observedRevision does not resolve to the expected commit');
  ensure(git(root, ['rev-parse', `${frozenRevision}^{commit}`]) === frozenRevision,
    'frozenRevision does not resolve to the expected commit');
  const parents = git(root, ['rev-list', '--parents', '-n', '1', frozenRevision])
    .split(/\s+/).slice(1);
  ensure(parents[0] === observedRevision, 'frozenRevision is not a direct child of observedRevision');

  const [contract, milestones, frozenState] = await Promise.all([
    readJson(root, contractPath),
    readJson(root, milestonesPath),
    Promise.resolve().then(() => JSON.parse(git(root, ['show', `${frozenRevision}:${statePath}`]))),
  ]);
  ensure(contract.schemaVersion === 3 && contract.lifecycleState === 'activation-pending-sync',
    'handoff contract is not activation-pending-sync');
  ensure(contract.safetyInvariants?.sender === false, 'activation contract must require sender=false');
  ensure(contract.safetyInvariants?.autoSendMessages === false,
    'activation contract must require AUTO_SEND_MESSAGES=false');
  ensure(contract.safetyInvariants?.noLeadSend === true,
    'activation contract must require noLeadSend=true');
  ensure(Number.isInteger(contract.activationPullRequest?.number)
    && typeof contract.activationPullRequest.headRef === 'string',
  'activation contract must declare its activation pull request');
  ensure(milestones.activeMilestone === contract.activeMilestone,
    'activation contract and milestone configuration disagree about the active milestone');
  ensure(milestones.lastClosedMilestone === contract.lastClosedMilestone,
    'activation contract and milestone configuration disagree about the last closed milestone');
  ensure(frozenState.schemaVersion === 1, 'post-merge snapshot must be an active observed state');
  ensure(frozenState.source?.sha === observedRevision,
    'post-merge snapshot source.sha does not match observedRevision');
  ensure(frozenState.source?.branch === 'main', 'post-merge snapshot must be collected from main');
  ensure(frozenState.architecture?.components?.sender === false,
    'post-merge snapshot must declare sender=false');
  ensure(frozenState.source?.pullRequest?.source === 'github-api',
    'post-merge snapshot pull request must come from the GitHub API');
  ensure(frozenState.source.pullRequest.state === 'closed',
    'post-merge snapshot pull request is not closed');
  ensure(typeof frozenState.source.pullRequest.mergedAt === 'string'
    && frozenState.source.pullRequest.mergedAt.length > 0,
  'post-merge snapshot pull request has no mergedAt');

  const active = milestones.milestones.find((milestone) => milestone.id === contract.activeMilestone);
  const firstCheckpoint = active?.checkpoints?.[0];
  ensure(firstCheckpoint?.id === `${active.id}-A`, 'active milestone has no valid A checkpoint');
  const finalContract = {
    schemaVersion: 1,
    handoffId: `${contract.lastClosedMilestone}-to-${contract.activeMilestone}`,
    lastClosedMilestone: contract.lastClosedMilestone,
    activeMilestone: contract.activeMilestone,
    activationPullRequest: contract.activationPullRequest,
    transitionGate: {
      description: `validar y fusionar el relevo documental ${contract.lastClosedMilestone} → ${contract.activeMilestone}`,
      conditionedCheckpoint: firstCheckpoint.id,
      completionCondition: 'el relevo documental post-merge haya sido validado y fusionado',
    },
    safetyInvariants: {
      sender: false,
      autoSendMessages: false,
      noLeadSend: true,
    },
    observedRevision,
    frozenRevision,
    outputs: handoffOutputs(contract.lastClosedMilestone, contract.activeMilestone),
  };
  await writeJson(root, contractPath, finalContract);
  return finalContract;
}

export async function verifyFinalPromotionMerge({
  root = defaultRepositoryRoot,
  mainRef = 'HEAD',
  githubToken = process.env.GITHUB_TOKEN,
  fetchImpl = fetch,
} = {}) {
  const contract = await readJson(root, contractPath);
  ensure(contract.schemaVersion === 1, 'final merge verification requires schemaVersion 1');
  ensure(Number.isInteger(contract.activationPullRequest?.number)
    && typeof contract.activationPullRequest.headRef === 'string',
  'final merge verification requires the activation pull request anchor');
  requireSha('observedRevision', contract.observedRevision);
  requireSha('frozenRevision', contract.frozenRevision);
  ensure(git(root, ['rev-parse', `${contract.observedRevision}^{commit}`]) === contract.observedRevision,
    'observedRevision does not resolve to the expected commit');
  ensure(git(root, ['rev-parse', `${contract.frozenRevision}^{commit}`]) === contract.frozenRevision,
    'frozenRevision does not resolve to the expected commit');
  const frozenParents = git(root, ['rev-list', '--parents', '-n', '1', contract.frozenRevision])
    .split(/\s+/).slice(1);
  ensure(frozenParents[0] === contract.observedRevision,
    'frozenRevision is not a direct child of observedRevision');
  const mainRevision = git(root, ['rev-parse', `${mainRef}^{commit}`]);
  ensure(isAncestor(root, contract.frozenRevision, mainRevision),
    'frozenRevision is not an ancestor of main; squash and rebase merges are not accepted');

  const mergeCandidates = git(root, ['rev-list', '--merges', `${contract.frozenRevision}..${mainRevision}`])
    .split(/\s+/).filter(Boolean);
  const preservedByMergeCommit = mergeCandidates.some((mergeCommit) => {
    const parents = git(root, ['rev-list', '--parents', '-n', '1', mergeCommit])
      .split(/\s+/).slice(1);
    return parents.length >= 2 && isAncestor(root, contract.frozenRevision, parents[1]);
  });
  ensure(preservedByMergeCommit,
    'promotion was not preserved by a merge commit; squash and rebase merges are not accepted');
  const frozenState = JSON.parse(git(root, ['show', `${contract.frozenRevision}:${statePath}`]));
  ensure(frozenState.source?.sha === contract.observedRevision,
    'post-merge snapshot source.sha does not match observedRevision');
  ensure(frozenState.source?.pullRequest, 'post-merge snapshot pull request is missing');
  ensure(frozenState.source.pullRequest.source === 'github-api',
    'post-merge snapshot pull request must come from the GitHub API');
  ensure(frozenState.source.pullRequest.state === 'closed',
    'post-merge snapshot pull request is not closed');
  ensure(typeof frozenState.source.pullRequest.mergedAt === 'string'
    && frozenState.source.pullRequest.mergedAt.length > 0,
  'post-merge snapshot pull request has no mergedAt');
  await verifyObservedPullRequest({
    repository: frozenState.repository,
    observedRevision: contract.observedRevision,
    pullRequest: frozenState.source.pullRequest,
    token: githubToken,
    fetchImpl,
  });
  await verifySnapshotPullRequest({
    activationPullRequest: contract.activationPullRequest,
    observedRevision: contract.observedRevision,
    pullRequest: frozenState.source.pullRequest,
    repository: frozenState.repository,
    token: githubToken,
    root,
    fetchImpl,
  });
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const root = args.root ? path.resolve(args.root) : defaultRepositoryRoot;
  if (args['verify-final'] === true) {
    await verifyFinalPromotionMerge({
      root,
      mainRef: args['main-ref'] ?? 'HEAD',
    });
    console.log('Activation promotion merge verified');
  } else {
    const contract = await promoteActivationPending({
      root,
      observedRevision: args['observed-revision'],
      frozenRevision: args['frozen-revision'],
    });
    console.log(`Activation promotion prepared: ${contract.handoffId}`);
  }
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
