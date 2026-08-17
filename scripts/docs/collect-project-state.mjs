import path from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  deriveNextAction,
  fromRoot,
  git,
  listFiles,
  parseArguments,
  pathExists,
  readJson,
  writeJson,
} from './shared.mjs';

const allowedVerification = new Set(['passed', 'failed', 'skipped', 'not_run']);

function verificationValue(value) {
  return allowedVerification.has(value) ? value : 'not_run';
}

async function readSourceFiles(files) {
  const entries = await Promise.all(files.map(async (file) => [
    file,
    await readFile(fromRoot(file), 'utf8'),
  ]));
  return new Map(entries);
}

function countTestCases(sourceTexts, matcher) {
  let count = 0;
  for (const [file, text] of sourceTexts) {
    if (!matcher(file)) continue;
    count += [...text.matchAll(/\b(?:it|test)\s*\(/g)].length;
  }
  return count;
}

async function resolvedTestCount(explicitValue, resultsPath, fallback) {
  if (explicitValue !== undefined) {
    const value = Number(explicitValue);
    if (Number.isInteger(value) && value >= 0) return value;
  }

  if (resultsPath) {
    const absolute = path.isAbsolute(resultsPath) ? resultsPath : fromRoot(resultsPath);
    try {
      const results = JSON.parse(await readFile(absolute, 'utf8'));
      if (Number.isInteger(results.numTotalTests)) return results.numTotalTests;
    } catch {
      // Static discovery remains available when a local results file is absent.
    }
  }

  return fallback;
}

function evaluateEvidence(evidence, sourceFiles, sourceTexts) {
  const checks = [];
  const combinedSource = [...sourceTexts.values()].join('\n');

  if (evidence.requiredPaths) {
    checks.push(evidence.requiredPaths.every((required) => sourceFiles.includes(required)));
  }
  if (evidence.contentAny) {
    checks.push(evidence.contentAny.some((needle) => combinedSource.includes(needle)));
  }
  if (evidence.fileNameAny) {
    checks.push(evidence.fileNameAny.some((name) => (
      sourceFiles.some((file) => path.basename(file) === name)
    )));
  }
  if (evidence.pathContentAllAny) {
    checks.push(evidence.pathContentAllAny.some((candidate) => {
      const source = sourceTexts.get(candidate.path);
      const normalizedSource = source?.toLowerCase();
      return Boolean(
        normalizedSource
        && candidate.contentAll?.length > 0
        && candidate.contentAll.every((needle) => (
          normalizedSource.includes(needle.toLowerCase())
        )),
      );
    }));
  }
  if (evidence.pathContentAll) {
    checks.push(evidence.pathContentAll.length > 0 && evidence.pathContentAll.every((candidate) => {
      const source = sourceTexts.get(candidate.path);
      const normalizedSource = source?.toLowerCase();
      return Boolean(
        normalizedSource
        && candidate.contentAll?.length > 0
        && candidate.contentAll.every((needle) => (
          normalizedSource.includes(needle.toLowerCase())
        )),
      );
    }));
  }

  return checks.length > 0 && checks.every(Boolean);
}

function findDefaultGeminiModel(sourceTexts) {
  for (const text of sourceTexts.values()) {
    const match = text.match(/DEFAULT_GEMINI_MODEL\s*=\s*['"]([^'"]+)['"]/);
    if (match) return match[1];
  }
  return null;
}

function findModules(sourceTexts) {
  const modules = [];
  for (const [file, text] of sourceTexts) {
    for (const match of text.matchAll(/export class ([A-Za-z0-9]+Module)\b/g)) {
      modules.push({ name: match[1], path: file });
    }
  }
  return modules.sort((left, right) => left.name.localeCompare(right.name));
}

async function associatedPullRequest(repository, sha, subject) {
  const token = process.env.GITHUB_TOKEN;
  if (repository && token) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository}/commits/${sha}/pulls`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );

      if (response.ok) {
        const pullRequests = await response.json();
        const selected = pullRequests.find((item) => item.merged_at) ?? pullRequests[0];
        if (selected) {
          return {
            number: selected.number,
            title: selected.title,
            url: selected.html_url,
            state: selected.state,
            mergedAt: selected.merged_at,
            source: 'github-api',
          };
        }
      }
    } catch {
      // The commit subject fallback below keeps local generation deterministic.
    }
  }

  const inferred = subject.match(/\(#(\d+)\)\s*$/);
  if (!inferred) return null;
  const number = Number(inferred[1]);
  return {
    number,
    title: subject,
    url: repository ? `https://github.com/${repository}/pull/${number}` : null,
    state: 'closed',
    mergedAt: null,
    source: 'commit-subject',
  };
}

const args = parseArguments(process.argv.slice(2));
const sourceRef = args['source-ref'] || 'HEAD';
const sourceBranch = args['source-branch'] || process.env.GITHUB_REF_NAME || git(['branch', '--show-current']);
const outputPath = args.output || 'docs/_generated/project-state.json';
const milestoneConfigPath = args['milestones-config'] || 'docs/control/milestones.json';
const repository = args.repository || process.env.GITHUB_REPOSITORY || 'AnderG0D/copiloto-whatsapp-samuel';
const [sha, shortSha, subject, committedAt] = git([
  'show', '-s', '--format=%H%x00%h%x00%s%x00%cI', sourceRef,
]).split('\0');

const sourceFiles = await listFiles('agent-core', (file) => (
  file.endsWith('.ts') || file.endsWith('.json')
));
const sourceTexts = await readSourceFiles(sourceFiles.filter((file) => file.endsWith('.ts')));
const packageJson = await readJson('agent-core/package.json');
const milestoneConfig = await readJson(milestoneConfigPath);
const configuredActive = milestoneConfig.milestones.filter(
  (item) => item.status === 'active',
);
const waitingForApproval = milestoneConfig.activeMilestone === null;

if (waitingForApproval) {
  if (milestoneConfig.lifecycleState !== 'awaiting-next-milestone-approval') {
    throw new Error('A null activeMilestone requires lifecycleState awaiting-next-milestone-approval');
  }
  if (configuredActive.length !== 0) {
    throw new Error('A null activeMilestone cannot coexist with an active milestone');
  }
  const lastClosed = milestoneConfig.milestones.find(
    (item) => item.id === milestoneConfig.lastClosedMilestone,
  );
  if (!lastClosed || lastClosed.status !== 'done') {
    throw new Error('A waiting lifecycle requires lastClosedMilestone to be configured as done');
  }
} else if (
  typeof milestoneConfig.activeMilestone !== 'string'
  || configuredActive.length !== 1
  || configuredActive[0].id !== milestoneConfig.activeMilestone
) {
  throw new Error('Active milestone configuration must identify exactly one active milestone');
}

const activeConfig = waitingForApproval ? null : configuredActive[0];
const activeMilestone = activeConfig && {
  ...activeConfig,
  checkpoints: activeConfig.checkpoints.map((checkpoint) => ({
    ...checkpoint,
    complete: evaluateEvidence(checkpoint.evidence, sourceFiles, sourceTexts),
  })),
};
const verification = {
  unit: verificationValue(args['unit-status']),
  e2e: verificationValue(args['e2e-status']),
  build: verificationValue(args['build-status']),
};
const pullRequest = await associatedPullRequest(repository, sha, subject);
const staticUnitCount = countTestCases(sourceTexts, (file) => file.endsWith('.spec.ts'));
const staticE2eCount = countTestCases(
  sourceTexts,
  (file) => file.includes('/test/') && file.endsWith('.ts'),
);
const unitCount = await resolvedTestCount(
  args['unit-count'], args['unit-results'], staticUnitCount,
);
const e2eCount = await resolvedTestCount(
  args['e2e-count'], args['e2e-results'], staticE2eCount,
);

const moduleFiles = [...sourceTexts]
  .filter(([file]) => file.endsWith('.module.ts'))
  .map(([, text]) => text)
  .join('\n');
const webhookServiceText = sourceTexts.get(
  'agent-core/src/webhooks/evolution/evolution-webhook.service.ts',
) ?? '';
const webhookModuleText = sourceTexts.get(
  'agent-core/src/webhooks/evolution/evolution-webhook.module.ts',
) ?? '';
const conversationContextText = sourceTexts.get(
  'agent-core/src/ai/response-drafts/conversation-context.builder.ts',
) ?? '';
const responseDraftText = sourceTexts.get(
  'agent-core/src/ai/response-drafts/response-draft.service.ts',
) ?? '';
const has = async (file) => pathExists(file);

const responseDraftConnectedToWebhook = (
  /\bResponseDraftModule\b/.test(webhookModuleText)
  && /\bResponseDraftService\b/.test(webhookServiceText)
  && /\bresponseDraftService\.generate\s*\(/.test(webhookServiceText)
);
const responseDraftUsesAiProvider = (
  /\bAI_PROVIDER\b/.test(responseDraftText)
  && /\baiProvider\.generateText\s*\(/.test(responseDraftText)
);
const aiDirectlyConnectedToWebhook = (
  /\b(?:GeminiProvider|AI_PROVIDER|AiProvider)\b/.test(webhookServiceText)
);

const components = {
  evolutionWebhook: await has('agent-core/src/webhooks/evolution/evolution-webhook.service.ts'),
  supabase: await has('agent-core/src/supabase/supabase.service.ts'),
  leadScoring: await has('agent-core/src/leads/lead-scoring.service.ts'),
  aiProviderContract: await has('agent-core/src/ai/ai-provider.interface.ts'),
  geminiProvider: await has('agent-core/src/ai/gemini.provider.ts'),
  geminiRegistered: /\b(?:GeminiProvider|AI_PROVIDER)\b/.test(moduleFiles),
  aiConnectedToWebhook: (
    aiDirectlyConnectedToWebhook
    || (responseDraftConnectedToWebhook && responseDraftUsesAiProvider)
  ),
  conversationContext: /\bexport class ConversationContextBuilder\b/.test(
    conversationContextText,
  ),
  responseDraft: /\bexport class ResponseDraftService\b/.test(responseDraftText),
  responseDraftConnectedToWebhook,
  inventory: sourceFiles.some((file) => /\/inventory\//.test(file)),
  reports: sourceFiles.some((file) => /\/reports?\//.test(file)),
  media: sourceFiles.some((file) => /\/media\//.test(file)),
  sender: sourceFiles.some((file) => /sender/i.test(path.basename(file))),
};

const state = {
  schemaVersion: waitingForApproval ? 2 : 1,
  observedDate: committedAt.slice(0, 10),
  repository,
  source: {
    ref: sourceRef,
    branch: sourceBranch,
    sha,
    shortSha,
    subject,
    committedAt,
    pullRequest,
    ciUrl: args['ci-url'] || process.env.DOCS_CI_URL || null,
  },
  runtime: {
    node: packageJson.engines?.node ?? '22 (GitHub Actions)',
    framework: {
      name: 'NestJS',
      version: packageJson.dependencies?.['@nestjs/common'] ?? null,
    },
    dependencies: {
      googleGenAi: packageJson.dependencies?.['@google/genai'] ?? null,
      supabaseJs: packageJson.dependencies?.['@supabase/supabase-js'] ?? null,
      axios: packageJson.dependencies?.axios ?? null,
    },
    defaultGeminiModel: findDefaultGeminiModel(sourceTexts),
  },
  verification: {
    ...verification,
    discoveredTests: {
      unit: unitCount,
      e2e: e2eCount,
    },
  },
  architecture: {
    modules: findModules(sourceTexts),
    components,
    migrations: await listFiles('supabase/migrations', (file) => file.endsWith('.sql')),
  },
  milestones: milestoneConfig.milestones.map(({ id, title, status, document }) => ({
    id,
    title,
    status,
    document,
  })),
  milestone: activeMilestone,
};

if (waitingForApproval) {
  state.lifecycleState = milestoneConfig.lifecycleState;
  state.lastClosedMilestone = milestoneConfig.lastClosedMilestone;
  state.activeMilestone = null;
}

state.nextAction = deriveNextAction({
  verification,
  activeMilestone,
  pullRequest,
});

await writeJson(outputPath, state);
console.log(`Project state written to ${outputPath}`);
