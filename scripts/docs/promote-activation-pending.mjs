import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArguments } from './shared.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '../..');
const contractPath = 'docs/control/handoff-state.json';
const milestonesPath = 'docs/control/milestones.json';
const statePath = 'docs/_generated/project-state.json';

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
  ensure(frozenState.source.pullRequest.number === contract.activationPullRequest.number,
    'post-merge snapshot pull request does not match the activation contract');
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
