import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import {
  classifyPath,
  deriveNextAction,
  parseArguments,
} from './shared.mjs';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepositoryRoot = path.resolve(scriptDirectory, '../..');
const contractPath = 'docs/control/handoff-state.json';
const milestonesPath = 'docs/control/milestones.json';
const policyPath = 'docs/control/documentation-policy.json';
const observedStatePath = 'docs/_generated/project-state.json';
const agentsPath = 'AGENTS.md';

function validationError(message) {
  return new Error(`Milestone handoff validation failed: ${message}`);
}

function ensure(condition, message) {
  if (!condition) throw validationError(message);
}

function normalizeLf(value) {
  return value.replace(/\r\n?/g, '\n');
}

function resolveRepositoryPath(root, relativePath) {
  ensure(
    typeof relativePath === 'string'
      && relativePath.length > 0
      && !path.isAbsolute(relativePath)
      && !relativePath.includes('\\'),
    `invalid repository-relative path: ${String(relativePath)}`,
  );

  const absolute = path.resolve(root, ...relativePath.split('/'));
  const relative = path.relative(root, absolute);
  ensure(
    relative !== '..'
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative),
    `path escapes the repository: ${relativePath}`,
  );
  return absolute;
}

async function readText(root, relativePath) {
  try {
    return normalizeLf(await readFile(resolveRepositoryPath(root, relativePath), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw validationError(`required source is missing: ${relativePath}`);
    }
    throw error;
  }
}

async function readJson(root, relativePath) {
  const text = await readText(root, relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw validationError(`invalid JSON in ${relativePath}: ${error.message}`);
  }
}

async function pathExists(root, relativePath) {
  try {
    await access(resolveRepositoryPath(root, relativePath));
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
}

function git(root, args) {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const details = normalizeLf(String(error?.stderr ?? '')).trim();
    throw validationError(
      `git ${args.join(' ')} failed${details ? `: ${details}` : ''}`,
    );
  }
}

function isAncestor(root, ancestor, descendant) {
  const result = spawnSync(
    'git',
    ['merge-base', '--is-ancestor', ancestor, descendant],
    { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  if (result.status === 0) return true;
  if (result.status === 1) return false;
  throw validationError(
    `could not validate Git ancestry: ${normalizeLf(result.stderr ?? '').trim()}`,
  );
}

function parseFrontmatter(relativePath, text) {
  ensure(text.startsWith('---\n'), `${relativePath} has no YAML frontmatter`);
  const end = text.indexOf('\n---\n', 4);
  ensure(end !== -1, `${relativePath} has invalid YAML frontmatter`);

  const values = {};
  for (const line of text.slice(4, end).split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (
      value.length >= 2
      && ((value.startsWith('"') && value.endsWith('"'))
        || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function markdownSection(relativePath, text, title) {
  const lines = text.split('\n');
  const heading = `## ${title}`;
  const start = lines.findIndex((line) => line.trim() === heading);
  ensure(start !== -1, `${relativePath} is missing section "${title}"`);

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^#{1,2}\s+/.test(lines[index])) {
      end = index;
      break;
    }
  }
  const body = lines.slice(start + 1, end).join('\n').trim();
  ensure(body.length > 0, `${relativePath} has an empty section "${title}"`);
  return body;
}

function quoteMarkdown(text) {
  return text.replaceAll('<!--', '&lt;!--')
    .split('\n').map((line) => (line ? `> ${line}` : '>')).join('\n');
}

function escapeTable(value) {
  return String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function milestoneFileId(id) {
  ensure(/^\d+(?:\.\d+)*$/.test(id ?? ''), `invalid milestone id: ${String(id)}`);
  const [major, ...rest] = id.split('.');
  return [major.padStart(2, '0'), ...rest].join('.');
}

function validateOutputPaths(root, contract, policy) {
  const outputNames = ['masterPrompt', 'portablePrompt', 'historicalHandoff'];
  ensure(
    contract.outputs && typeof contract.outputs === 'object',
    'handoff contract has no output paths',
  );
  ensure(
    isDeepStrictEqual(Object.keys(contract.outputs).sort(), [...outputNames].sort()),
    'handoff contract must declare exactly the three supported outputs',
  );

  const outputs = Object.fromEntries(
    outputNames.map((name) => [name, contract.outputs[name]]),
  );
  ensure(
    new Set(Object.values(outputs)).size === outputNames.length,
    'handoff output paths must be unique',
  );

  const docsRoot = policy.repositoryDocsRoot;
  const roleConventions = {
    masterPrompt: {
      directory: `${docsRoot}/_generated`,
      filename: 'Prompt Maestro - Hito actual.md',
    },
    portablePrompt: {
      directory: `${docsRoot}/_generated`,
      filename: 'Prompt Portatil - Hito actual.md',
    },
    historicalHandoff: {
      directory: `${docsRoot}/04 Handoffs`,
      filename: `Hito ${milestoneFileId(contract.lastClosedMilestone)} a ${milestoneFileId(contract.activeMilestone)}.md`,
    },
  };

  for (const [name, outputPath] of Object.entries(outputs)) {
    const absolute = resolveRepositoryPath(root, outputPath);
    ensure(path.extname(outputPath) === '.md', `${outputPath} is not a Markdown output`);
    ensure(
      path.dirname(outputPath).replaceAll('\\', '/') === roleConventions[name].directory
        && path.basename(absolute) === roleConventions[name].filename,
      `${outputPath} is not classified as the ${name} output`,
    );
    ensure(
      classifyPath(outputPath, policy) === 'generated',
      `${outputPath} is not classified as generated by ${policyPath}`,
    );
  }

  return outputs;
}

function generatedFrontmatter(type, project, handoff, state) {
  return `---
type: ${type}
project: ${project}
generated: true
handoff: ${handoff.handoffId}
source-revision: ${handoff.frozenRevision}
observed-revision: ${handoff.observedRevision}
updated: ${state.observedDate}
---`;
}

function canonicalActionText(nextAction) {
  return `- [ ] ${nextAction.text}
${nextAction.commitHint ? `\n**Commit sugerido:** \`${nextAction.commitHint}\`\n` : ''}
**Termina cuando:** ${nextAction.doneWhen}`;
}

function validateWaitingOutputPaths(root, contract, policy) {
  const outputNames = ['masterPrompt', 'portablePrompt'];
  ensure(
    contract.outputs && typeof contract.outputs === 'object',
    'waiting contract has no output paths',
  );
  ensure(
    isDeepStrictEqual(Object.keys(contract.outputs).sort(), [...outputNames].sort()),
    'waiting contract must declare exactly the two live prompt outputs',
  );

  const outputs = Object.fromEntries(
    outputNames.map((name) => [name, contract.outputs[name]]),
  );
  ensure(
    new Set(Object.values(outputs)).size === outputNames.length,
    'waiting output paths must be unique',
  );

  const directory = `${policy.repositoryDocsRoot}/_generated`;
  const filenames = {
    masterPrompt: 'Prompt Maestro - Hito actual.md',
    portablePrompt: 'Prompt Portatil - Hito actual.md',
  };
  for (const [name, outputPath] of Object.entries(outputs)) {
    const absolute = resolveRepositoryPath(root, outputPath);
    ensure(path.extname(outputPath) === '.md', `${outputPath} is not a Markdown output`);
    ensure(
      path.dirname(outputPath).replaceAll('\\', '/') === directory
        && path.basename(absolute) === filenames[name],
      `${outputPath} is not classified as the ${name} output`,
    );
    ensure(
      classifyPath(outputPath, policy) === 'generated',
      `${outputPath} is not classified as generated by ${policyPath}`,
    );
  }
  return outputs;
}

async function validateHistoricalHandoff(root, contract, policy) {
  const historical = contract.historicalHandoff;
  ensure(historical && typeof historical === 'object', 'waiting contract has no historical handoff');
  ensure(typeof historical.path === 'string', 'historical handoff has no path');
  ensure(/^[0-9a-f]{64}$/.test(historical.sha256 ?? ''), 'historical handoff has no SHA-256');
  ensure(
    classifyPath(historical.path, policy) === 'generated',
    'historical handoff is not classified as generated',
  );
  const content = await readFile(resolveRepositoryPath(root, historical.path));
  const digest = createHash('sha256').update(content).digest('hex');
  ensure(digest === historical.sha256, `historical handoff changed: ${historical.path}`);
}

function renderWaitingPrompt(type, title, contract, state) {
  const action = canonicalActionText(state.nextAction);
  return `---
type: ${type}
project: Copiloto WhatsApp Samuel
generated: true
lifecycle-state: ${contract.lifecycleState}
updated: ${state.observedDate}
---

# ${title}

No hay hito activo. El último hito cerrado es **${contract.lastClosedMilestone}**.

## Estado operativo

- Estado: \`${contract.lifecycleState}\`.
- Esperar aprobación humana explícita antes de definir o activar el siguiente hito.
- No hay rama activa, checkpoint operativo ni destino de relevo.

## Siguiente acción canónica

${action}

## Invariantes de ausencia de envío

- \`sender=${contract.safetyInvariants.sender}\`.
- \`AUTO_SEND_MESSAGES=${contract.safetyInvariants.autoSendMessages}\`.
- \`noLeadSend=${contract.safetyInvariants.noLeadSend}\`.
- Aprobar un borrador no envía mensajes.
`;
}

function transitionStatusText(context) {
  const {
    active,
    contract,
    firstIncomplete,
    progress,
  } = context;

  return `- Gate de transición actual: ${contract.transitionGate.description}.
- Progreso funcional actual del Hito ${active.id}: **${progress.complete}/${progress.total}**.
- Primera acción funcional: **${firstIncomplete.id} — ${firstIncomplete.title}**.
- ${firstIncomplete.id} solo puede comenzar después de que ${contract.transitionGate.completionCondition}.

Mientras este gate siga abierto, la acción actual es ${contract.transitionGate.description}; no avances a ${firstIncomplete.id}.`;
}

function safetyInvariantText(context) {
  return `- \`sender=${context.contract.safetyInvariants.sender}\`.
- \`AUTO_SEND_MESSAGES=${context.contract.safetyInvariants.autoSendMessages}\`.
- \`noLeadSend=${context.contract.safetyInvariants.noLeadSend}\`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.`;
}

function renderMasterPrompt(context) {
  const {
    active,
    activeNote,
    agents,
    contract,
    lastClosed,
    lastClosedNote,
    project,
    sources,
    state,
  } = context;

  const sourceLines = sources.map((source) => `- \`${source}\`.`).join('\n');
  const closureEvidence = lastClosed.evidence;

  return `${generatedFrontmatter(
    'generated-milestone-handoff-master-prompt', project, contract, state,
  )}

# Prompt maestro — Hito ${active.id}

## Propósito

Continúa el proyecto **${project}** desde el cierre verificable del Hito ${lastClosed.id} y la activación del Hito ${active.id}. Trabaja desde las fuentes del repositorio; no sustituyas evidencia por memoria de chat.

## Transición congelada

- Relevo: \`${contract.handoffId}\`.
- Último hito cerrado: **${lastClosed.id} — ${lastClosed.title}**.
- Hito activo: **${active.id} — ${active.title}**.
- Revisión observada del cierre: \`${contract.observedRevision}\`.
- Revisión congelada del repositorio: \`${contract.frozenRevision}\`.
- Evidencia configurada del cierre: PR ${closureEvidence.pullRequests.map((number) => `#${number}`).join(', ')}, merge \`${closureEvidence.mergeCommit}\` y ${closureEvidence.requiredPaths.length} rutas obligatorias.

## Fuentes que debes leer antes de actuar

${sourceLines}

## Cierre documentado del Hito ${lastClosed.id}

${quoteMarkdown(markdownSection(lastClosed.document, lastClosedNote, 'Objetivo alcanzado'))}

### Validación final documentada

${quoteMarkdown(markdownSection(lastClosed.document, lastClosedNote, 'Validación final'))}

## Alcance activo del Hito ${active.id}

${quoteMarkdown(markdownSection(active.document, activeNote, 'Objetivo'))}

### Gate técnico documentado

${quoteMarkdown(markdownSection(active.document, activeNote, 'Gate técnico previo'))}

### Alcance aprobado

${quoteMarkdown(markdownSection(active.document, activeNote, 'Alcance aprobado'))}

## Gate de transición y progreso funcional

${transitionStatusText(context)}

## Primera acción funcional condicionada

Esta acción identifica el primer checkpoint funcional, pero permanece bloqueada hasta que se cumpla el gate de transición.

${canonicalActionText(state.nextAction)}

## Reglas vigentes extraídas de AGENTS.md

### Arquitectura

${quoteMarkdown(markdownSection(agentsPath, agents, 'Architecture'))}

### Seguridad y privacidad

${quoteMarkdown(markdownSection(agentsPath, agents, 'Safety and privacy'))}

### Flujo de ingeniería

${quoteMarkdown(markdownSection(agentsPath, agents, 'Engineering workflow'))}

### Gobierno documental

${quoteMarkdown(markdownSection(agentsPath, agents, 'Documentation governance'))}

### Validación

${quoteMarkdown(markdownSection(agentsPath, agents, 'Validation'))}

## Restricciones específicas del Hito ${active.id}

${quoteMarkdown(markdownSection(active.document, activeNote, 'Reglas de seguridad'))}

## Invariantes de ausencia de envío

${safetyInvariantText(context)}

## Instrucción de arranque

Antes de editar, verifica la rama y el árbol de trabajo, confirma que la revisión congelada pertenece al historial actual y contrasta el primer checkpoint incompleto con el estado observado. Completa primero el gate de transición y no implementes la primera acción funcional hasta que el generador haya sido validado y fusionado. Detente ante cualquier discrepancia de evidencia o alcance.
`;
}

function renderPortablePrompt(context) {
  const {
    active,
    contract,
    lastClosed,
    policy,
    project,
    state,
  } = context;

  return `${generatedFrontmatter(
    'generated-milestone-handoff-portable-prompt', project, contract, state,
  )}

# Prompt portátil — Hito ${active.id}

Continúa **${project}** en la transición \`${contract.handoffId}\`: el Hito ${lastClosed.id} está cerrado y el Hito ${active.id} está activo.

Antes de editar, lee \`AGENTS.md\`, \`${contractPath}\`, \`${milestonesPath}\`, \`${observedStatePath}\`, las notas de ambos hitos y \`${policy.canonicalNextAction}\`. Valida que \`${contract.observedRevision}\` sea la revisión observada, que su sucesor congelado sea \`${contract.frozenRevision}\`, que exista exactamente un hito activo y que la evidencia obligatoria del cierre siga presente.

## Gate de transición y progreso funcional

${transitionStatusText(context)}

## Primera acción funcional condicionada

Esta acción permanece bloqueada hasta que se cumpla el gate de transición.

${canonicalActionText(state.nextAction)}

## Invariantes de ausencia de envío

${safetyInvariantText(context)}

Respeta el alcance y las reglas de seguridad de \`${active.document}\`. No inventes información, no uses servicios externos ni credenciales y no avances a la primera acción funcional mientras el gate permanezca abierto.
`;
}

function renderHistoricalHandoff(context) {
  const {
    active,
    contract,
    lastClosed,
    policy,
    project,
    state,
  } = context;
  const evidence = lastClosed.evidence;
  const checks = ['unit', 'e2e', 'build'].map((name) => (
    `| ${name} | \`${state.verification[name]}\` |`
  )).join('\n');
  const checkpoints = state.milestone.checkpoints.map((checkpoint) => (
    `| ${checkpoint.id} | ${escapeTable(checkpoint.title)} | ${checkpoint.complete ? 'completo' : 'pendiente'} |`
  )).join('\n');
  const outputRows = Object.entries(contract.outputs).map(([name, outputPath]) => (
    `| ${name} | \`${outputPath}\` |`
  )).join('\n');

  return `${generatedFrontmatter(
    'generated-milestone-handoff', project, contract, state,
  )}

# Relevo del Hito ${lastClosed.id} al Hito ${active.id}

## Estado congelado

| Dato | Valor |
| --- | --- |
| Relevo | \`${contract.handoffId}\` |
| Último hito cerrado | ${lastClosed.id} — ${escapeTable(lastClosed.title)} |
| Hito activo | ${active.id} — ${escapeTable(active.title)} |
| Revisión observada | \`${contract.observedRevision}\` |
| Revisión congelada | \`${contract.frozenRevision}\` |
| Fecha observada | ${state.observedDate} |

La revisión observada es el padre directo de la revisión congelada. La revisión congelada pertenece al historial actual al generar o comprobar este relevo.

## Evidencia obligatoria del cierre

- Pull requests configurados: ${evidence.pullRequests.map((number) => `#${number}`).join(', ')}.
- Merge funcional configurado: \`${evidence.mergeCommit}\`.
- Pull request de cierre observado: #${state.source.pullRequest.number}, fusionado en \`${state.source.pullRequest.mergedAt}\`.
- Rutas obligatorias:
${evidence.requiredPaths.map((requiredPath) => `  - \`${requiredPath}\`.`).join('\n')}

## Verificaciones observadas

| Verificación | Resultado |
| --- | --- |
${checks}

## Gate de transición y progreso funcional

${transitionStatusText(context)}

## Checkpoints del Hito ${active.id}

| Checkpoint | Resultado | Estado observado |
| --- | --- | --- |
${checkpoints}

## Primera acción funcional condicionada

Fuente canónica: \`${policy.canonicalNextAction}\`.

Esta acción permanece bloqueada hasta que se cumpla el gate de transición.

${canonicalActionText(state.nextAction)}

## Invariantes de ausencia de envío

${safetyInvariantText(context)}

## Salidas de este relevo

| Salida | Ruta |
| --- | --- |
${outputRows}

Este archivo es una salida determinista del contrato \`${contractPath}\`; no debe editarse manualmente.
`;
}

function readHistoricalState(root, frozenRevision) {
  try {
    return JSON.parse(git(
      root, ['show', `${frozenRevision}:${observedStatePath}`],
    ));
  } catch {
    throw validationError(
      `frozenRevision does not contain valid ${observedStatePath}`,
    );
  }
}

function normalizedEvidenceCandidates(evidence) {
  if (!evidence || typeof evidence !== 'object') return null;

  const candidates = evidence.pathContentAll ?? evidence.pathContentAllAny;
  const hasPathContentAll = Array.isArray(evidence.pathContentAll);
  const hasPathContentAllAny = Array.isArray(evidence.pathContentAllAny);

  if (
    !Array.isArray(candidates)
    || hasPathContentAll === hasPathContentAllAny
  ) {
    return null;
  }

  return candidates.map((candidate) => ({
    path: candidate?.path,
    contentAll: Array.isArray(candidate?.contentAll)
      ? [...candidate.contentAll].sort()
      : candidate?.contentAll,
  })).sort((left, right) => (
    JSON.stringify(left).localeCompare(JSON.stringify(right))
  ));
}

const historicalEvidenceMigration45A = Object.freeze({
  frozenRevision: 'd2a261a2e5666f1e1b7426f3b6ce6e15b0b96b1f',
  checkpointId: '4.5-A',
  historicalEvidence: {
    pathContentAll: [{
      path: 'agent-core/src/pilot/shadow-pilot.config.ts',
      contentAll: ['shadow-hiram', 'shadow-samuel', 'allowlist'],
    }],
  },
  canonicalEvidence: {
    requiredPaths: [
      'agent-core/src/shadow-pilot/shadow-edgar.compose.json',
      'agent-core/src/shadow-pilot/shadow-samuel.compose.json',
      'agent-core/src/shadow-pilot/shadow-pilot-isolation.spec.ts',
    ],
    pathContentAll: [{
      path: 'agent-core/src/shadow-pilot/shadow-pilot.config.ts',
      contentAll: ['shadow-edgar', 'shadow-samuel', 'allowlist'],
    }],
  },
});

export function migrateHistoricalEvidence45A({
  contract,
  checkpointId,
  observedEvidence,
  configuredEvidence,
}) {
  const migration = historicalEvidenceMigration45A;
  if (
    contract?.frozenRevision === migration.frozenRevision
    && checkpointId === migration.checkpointId
    && isDeepStrictEqual(observedEvidence, migration.historicalEvidence)
    && isDeepStrictEqual(configuredEvidence, migration.canonicalEvidence)
  ) {
    return configuredEvidence;
  }
  return observedEvidence;
}

function hasCompatibleHistoricalEvidence(observed, configured) {
  const observedCandidates = normalizedEvidenceCandidates(observed);
  const configuredCandidates = normalizedEvidenceCandidates(configured);

  return Boolean(
    observedCandidates
    && configuredCandidates
    && observedCandidates.length === configuredCandidates.length
    && observedCandidates.every((candidate, index) => (
      typeof candidate.path === 'string'
      && candidate.path.length > 0
      && Array.isArray(candidate.contentAll)
      && candidate.contentAll.length > 0
      && candidate.contentAll.every((needle) => (
        typeof needle === 'string' && needle.length > 0
      ))
      && candidate.path === configuredCandidates[index].path
      && Array.isArray(configuredCandidates[index].contentAll)
      && configuredCandidates[index].contentAll.length > 0
      && configuredCandidates[index].contentAll.every((needle) => (
        typeof needle === 'string' && needle.length > 0
      ))
      && isDeepStrictEqual(candidate.contentAll, configuredCandidates[index].contentAll)
    )),
  );
}

export function evidenceMatchesForComparison({
  contract,
  checkpointId,
  observedEvidence,
  configuredEvidence,
  evidenceComparison,
}) {
  if (evidenceComparison === 'historical-compatible') {
    return hasCompatibleHistoricalEvidence(
      migrateHistoricalEvidence45A({
        contract,
        checkpointId,
        observedEvidence,
        configuredEvidence,
      }),
      configuredEvidence,
    );
  }
  return isDeepStrictEqual(observedEvidence, configuredEvidence);
}

function validateStateAgainstConfiguration({
  active,
  configuredProjection,
  contract,
  evidenceComparison,
  label,
  lastClosed,
  state,
}) {
  ensure(
    Array.isArray(state.milestones),
    `${observedStatePath} has no milestones (${label})`,
  );
  const observedActive = state.milestones.filter(
    (milestone) => milestone.status === 'active',
  );
  ensure(
    observedActive.length === 1,
    `expected exactly one active milestone in ${observedStatePath} (${label}); found ${observedActive.length}`,
  );
  ensure(
    observedActive[0].id === contract.activeMilestone,
    `contract, milestone configuration and observed state disagree about the active milestone (${label})`,
  );
  const observedLastClosed = state.milestones.find(
    (milestone) => milestone.id === contract.lastClosedMilestone,
  );
  ensure(
    observedLastClosed?.status === 'done',
    `observed state does not mark Hito ${lastClosed.id} as closed (${label})`,
  );
  ensure(
    state.milestone?.id === active.id && state.milestone?.status === 'active',
    `observed active milestone does not match the contract and milestone configuration (${label})`,
  );
  ensure(
    isDeepStrictEqual(state.milestones, configuredProjection),
    `milestone configuration and observed milestone list do not match (${label})`,
  );
  ensure(
    state.milestone.title === active.title
      && state.milestone.workingBranch === active.workingBranch
      && state.milestone.document === active.document,
    `active milestone details differ between configuration and observed state (${label})`,
  );
  ensure(
    Array.isArray(active.checkpoints)
      && Array.isArray(state.milestone.checkpoints)
      && active.checkpoints.length === state.milestone.checkpoints.length,
    `active milestone checkpoints differ between configuration and observed state (${label})`,
  );
  for (let index = 0; index < active.checkpoints.length; index += 1) {
    const configured = active.checkpoints[index];
    const observed = state.milestone.checkpoints[index];
    const evidenceMatches = evidenceMatchesForComparison({
      contract,
      checkpointId: configured.id,
      observedEvidence: observed.evidence,
      configuredEvidence: configured.evidence,
      evidenceComparison,
    });
    ensure(
      observed.id === configured.id
        && observed.title === configured.title
        && observed.commitHint === configured.commitHint
        && evidenceMatches,
      `checkpoint ${configured.id} differs between configuration and observed state (${label})`,
    );
  }
}

async function validateWaitingContract({
  agents,
  contract,
  liveState,
  milestones,
  policy,
  root,
}) {
  ensure(
    contract.schemaVersion === 2,
    'waiting handoff schemaVersion must be 2',
  );
  ensure(
    contract.lifecycleState === 'awaiting-next-milestone-approval',
    'waiting contract must declare lifecycleState awaiting-next-milestone-approval',
  );
  ensure(contract.activeMilestone === null, 'waiting contract activeMilestone must be null');
  ensure(
    typeof contract.lastClosedMilestone === 'string',
    'waiting contract must declare lastClosedMilestone',
  );
  ensure(
    contract.safetyInvariants?.sender === false,
    'handoff contract must require sender=false',
  );
  ensure(
    contract.safetyInvariants?.autoSendMessages === false,
    'handoff contract must require AUTO_SEND_MESSAGES=false',
  );
  const safetyAndPrivacy = markdownSection(agentsPath, agents, 'Safety and privacy');
  ensure(
    /(?:^|[^A-Z0-9_])AUTO_SEND_MESSAGES=false(?:[^A-Z0-9_]|$)/.test(safetyAndPrivacy),
    `${agentsPath} must authoritatively require AUTO_SEND_MESSAGES=false`,
  );
  ensure(Array.isArray(milestones.milestones), `${milestonesPath} has no milestones`);
  ensure(
    milestones.lifecycleState === contract.lifecycleState,
    'contract and milestone configuration disagree about lifecycleState',
  );
  ensure(milestones.activeMilestone === null, `${milestonesPath} activeMilestone must be null`);
  ensure(
    milestones.milestones.filter((milestone) => milestone.status === 'active').length === 0,
    `expected zero active milestones in ${milestonesPath}`,
  );
  const lastClosed = milestones.milestones.find(
    (milestone) => milestone.id === contract.lastClosedMilestone,
  );
  ensure(lastClosed?.status === 'done', `Hito ${contract.lastClosedMilestone} is not closed`);

  ensure(liveState.schemaVersion === 2, `${observedStatePath} schemaVersion must be 2`);
  ensure(
    liveState.lifecycleState === contract.lifecycleState
      && liveState.lastClosedMilestone === contract.lastClosedMilestone
      && liveState.activeMilestone === null,
    'observed state does not match the waiting lifecycle',
  );
  ensure(liveState.milestone === null, 'observed waiting state milestone must be null');
  ensure(
    liveState.milestones.filter((milestone) => milestone.status === 'active').length === 0,
    `expected zero active milestones in ${observedStatePath}`,
  );
  const configuredProjection = milestones.milestones.map(
    ({ id, title, status, document }) => ({ id, title, status, document }),
  );
  ensure(
    isDeepStrictEqual(liveState.milestones, configuredProjection),
    'milestone configuration and observed milestone list do not match (waiting state)',
  );
  ensure(
    liveState.architecture?.components?.sender === false,
    `${observedStatePath} must declare sender=false (waiting state)`,
  );
  const expectedAction = deriveNextAction({
    verification: liveState.verification,
    activeMilestone: null,
    pullRequest: liveState.source?.pullRequest,
  });
  ensure(
    expectedAction.kind === 'await-next-milestone-approval'
      && expectedAction.commitHint === null
      && isDeepStrictEqual(liveState.nextAction, expectedAction),
    'waiting nextAction does not match the canonical waiting action',
  );

  const outputs = validateWaitingOutputPaths(root, contract, policy);
  await validateHistoricalHandoff(root, contract, policy);
  const canonicalNextAction = await readText(root, policy.canonicalNextAction);
  for (const fragment of [
    liveState.nextAction.text,
    liveState.nextAction.doneWhen,
  ]) {
    ensure(
      canonicalNextAction.includes(fragment),
      `${policy.canonicalNextAction} does not match observed nextAction`,
    );
  }

  return {
    outputs,
    contents: {
      masterPrompt: renderWaitingPrompt(
        'generated-milestone-waiting-master-prompt',
        'Prompt maestro — sin hito activo',
        contract,
        liveState,
      ),
      portablePrompt: renderWaitingPrompt(
        'generated-milestone-waiting-portable-prompt',
        'Prompt portátil — sin hito activo',
        contract,
        liveState,
      ),
    },
  };
}

async function validateActivationPendingContract({
  agents,
  contract,
  liveState,
  milestones,
  root,
}) {
  ensure(contract.schemaVersion === 3, 'activation-pending-sync handoff schemaVersion must be 3');
  ensure(
    contract.lifecycleState === 'activation-pending-sync',
    'pending contract must declare lifecycleState activation-pending-sync',
  );
  ensure(
    typeof contract.lastClosedMilestone === 'string'
      && typeof contract.activeMilestone === 'string',
    'pending contract must declare both milestone ids',
  );
  ensure(contract.safetyInvariants?.sender === false, 'pending contract must require sender=false');
  ensure(
    contract.safetyInvariants?.autoSendMessages === false,
    'pending contract must require AUTO_SEND_MESSAGES=false',
  );
  ensure(contract.safetyInvariants?.noLeadSend === true, 'pending contract must require zero lead sends');
  ensure(Number.isInteger(contract.activationPullRequest?.number)
    && typeof contract.activationPullRequest.headRef === 'string',
  'pending contract must declare its activation pull request');
  const safetyAndPrivacy = markdownSection(agentsPath, agents, 'Safety and privacy');
  ensure(
    /(?:^|[^A-Z0-9_])AUTO_SEND_MESSAGES=false(?:[^A-Z0-9_]|$)/.test(safetyAndPrivacy),
    `${agentsPath} must authoritatively require AUTO_SEND_MESSAGES=false`,
  );
  ensure(
    !Object.hasOwn(contract, 'observedRevision') && !Object.hasOwn(contract, 'frozenRevision'),
    'pending contract must not declare final revisions',
  );
  ensure(
    !Object.hasOwn(contract, 'outputs') && !Object.hasOwn(contract, 'historicalHandoff'),
    'pending contract must not declare final handoff outputs',
  );

  const configuredActive = milestones.milestones.filter((milestone) => milestone.status === 'active');
  ensure(configuredActive.length === 1, `expected exactly one active milestone in ${milestonesPath}; found ${configuredActive.length}`);
  const lastClosed = milestones.milestones.find((milestone) => (
    milestone.id === contract.lastClosedMilestone
  ));
  const active = configuredActive[0];
  ensure(lastClosed?.status === 'done', `Hito ${contract.lastClosedMilestone} is not closed`);
  ensure(milestones.activeMilestone === active.id, `${milestonesPath} activeMilestone does not identify its only active milestone`);
  ensure(active.id === contract.activeMilestone, 'pending contract and milestone configuration disagree about the active milestone');
  ensure(liveState.schemaVersion === 1, `${observedStatePath} must declare an active observed state`);
  ensure(liveState.architecture?.components?.sender === false, `${observedStatePath} must declare sender=false (pending state)`);
  const configuredProjection = milestones.milestones.map(({ id, title, status, document }) => ({
    id, title, status, document,
  }));
  validateStateAgainstConfiguration({
    active,
    configuredProjection,
    contract,
    evidenceComparison: 'exact',
    label: 'pending state',
    lastClosed,
    state: liveState,
  });

  const activeNote = await readText(root, active.document);
  const activeFrontmatter = parseFrontmatter(active.document, activeNote);
  ensure(
    activeFrontmatter.status === 'active' && activeFrontmatter.hito === active.id,
    `${active.document} must declare Hito ${active.id} as ACTIVE`,
  );
  ensure(
    /No se permite ningún envío a leads\./.test(activeNote),
    `${active.document} must prohibit sends to leads`,
  );
  const firstIncomplete = liveState.milestone.checkpoints.find((checkpoint) => !checkpoint.complete);
  ensure(firstIncomplete, `Hito ${active.id} has no incomplete checkpoint`);
  ensure(firstIncomplete.id === `${active.id}-A`, 'pending next action must be the A checkpoint');
  ensure(active.checkpoints[1]?.id === `${active.id}-B`, 'pending B checkpoint must follow the A checkpoint');
  const expectedAction = deriveNextAction({
    verification: liveState.verification,
    activeMilestone: liveState.milestone,
    pullRequest: liveState.source?.pullRequest,
  });
  ensure(
    expectedAction.kind === 'implement-checkpoint'
      && expectedAction.title === `${firstIncomplete.id}: ${firstIncomplete.title}`
      && isDeepStrictEqual(liveState.nextAction, expectedAction),
    'pending nextAction does not match the canonical first incomplete checkpoint',
  );

  return { outputs: {}, contents: {} };
}

async function validateAndBuild(root, statePath = observedStatePath) {
  const [contract, milestones, policy, liveState, agents] = await Promise.all([
    readJson(root, contractPath),
    readJson(root, milestonesPath),
    readJson(root, policyPath),
    readJson(root, statePath),
    readText(root, agentsPath),
  ]);

  if (contract.schemaVersion === 2) {
    return validateWaitingContract({ agents, contract, liveState, milestones, policy, root });
  }

  if (contract.schemaVersion === 3) {
    return validateActivationPendingContract({ agents, contract, liveState, milestones, root });
  }

  ensure(contract.schemaVersion === 1, 'handoff schemaVersion must be 1');
  ensure(
    typeof contract.lastClosedMilestone === 'string'
      && typeof contract.activeMilestone === 'string',
    'handoff contract must declare both milestone ids',
  );
  const derivedHandoffId = `${contract.lastClosedMilestone}-to-${contract.activeMilestone}`;
  ensure(
    contract.handoffId === derivedHandoffId,
    `handoffId must match the derived transition ${derivedHandoffId}`,
  );
  ensure(
    contract.safetyInvariants?.sender === false,
    'handoff contract must require sender=false',
  );
  ensure(
    contract.safetyInvariants?.autoSendMessages === false,
    'handoff contract must require AUTO_SEND_MESSAGES=false',
  );
  ensure(
    contract.safetyInvariants?.noLeadSend === true,
    'handoff contract must require noLeadSend=true',
  );
  const safetyAndPrivacy = markdownSection(agentsPath, agents, 'Safety and privacy');
  ensure(
    /(?:^|[^A-Z0-9_])AUTO_SEND_MESSAGES=false(?:[^A-Z0-9_]|$)/.test(safetyAndPrivacy),
    `${agentsPath} must authoritatively require AUTO_SEND_MESSAGES=false`,
  );

  for (const [name, revision] of [
    ['frozenRevision', contract.frozenRevision],
    ['observedRevision', contract.observedRevision],
  ]) {
    ensure(/^[0-9a-f]{40}$/.test(revision ?? ''), `${name} must be a full Git SHA`);
  }

  ensure(
    git(root, ['rev-parse', `${contract.observedRevision}^{commit}`])
      === contract.observedRevision,
    'observedRevision does not resolve to the expected commit',
  );
  ensure(
    git(root, ['rev-parse', `${contract.frozenRevision}^{commit}`])
      === contract.frozenRevision,
    'frozenRevision does not resolve to the expected commit',
  );
  const frozenParents = git(
    root, ['rev-list', '--parents', '-n', '1', contract.frozenRevision],
  ).split(/\s+/).slice(1);
  ensure(
    frozenParents[0] === contract.observedRevision,
    'observedRevision is not the direct first parent of frozenRevision',
  );
  ensure(
    isAncestor(root, contract.frozenRevision, 'HEAD'),
    'frozenRevision is not in the current HEAD history',
  );

  const historicalState = readHistoricalState(root, contract.frozenRevision);
  ensure(
    historicalState.architecture?.components?.sender === false,
    `${observedStatePath} must declare sender=false (historical state)`,
  );
  ensure(
    liveState.architecture?.components?.sender === false,
    `${observedStatePath} must declare sender=false (live state)`,
  );
  ensure(
    historicalState.source?.sha === contract.observedRevision,
    'contract observedRevision does not match the historical project state',
  );
  ensure(
    /^\d{4}-\d{2}-\d{2}$/.test(historicalState.observedDate ?? ''),
    'historical project state has no stable observedDate',
  );
  ensure(
    /^\d{4}-\d{2}-\d{2}$/.test(liveState.observedDate ?? ''),
    'live project state has no stable observedDate',
  );
  ensure(
    /^[0-9a-f]{40}$/.test(liveState.source?.sha ?? ''),
    'live project state source.sha must be a full Git SHA',
  );
  ensure(
    git(root, ['rev-parse', `${liveState.source.sha}^{commit}`])
      === liveState.source.sha,
    'live project state source.sha does not resolve to the expected commit',
  );
  ensure(
    isAncestor(root, liveState.source.sha, 'HEAD'),
    'live project state source.sha is not in the current HEAD history',
  );

  ensure(Array.isArray(milestones.milestones), `${milestonesPath} has no milestones`);
  const configuredActive = milestones.milestones.filter(
    (milestone) => milestone.status === 'active',
  );
  ensure(
    configuredActive.length === 1,
    `expected exactly one active milestone in ${milestonesPath}; found ${configuredActive.length}`,
  );
  ensure(
    milestones.activeMilestone === configuredActive[0].id,
    `${milestonesPath} activeMilestone does not identify its only active milestone`,
  );
  ensure(
    milestones.activeMilestone === contract.activeMilestone,
    'contract and milestone configuration disagree about the active milestone',
  );

  const lastClosed = milestones.milestones.find(
    (milestone) => milestone.id === contract.lastClosedMilestone,
  );
  const active = configuredActive[0];
  ensure(lastClosed, `Hito ${contract.lastClosedMilestone} is not configured`);
  ensure(lastClosed.status === 'done', `Hito ${lastClosed.id} is not closed`);
  ensure(active.id === contract.activeMilestone, `Hito ${contract.activeMilestone} is not active`);
  const lastClosedIndex = milestones.milestones.indexOf(lastClosed);
  const activeIndex = milestones.milestones.indexOf(active);
  ensure(
    activeIndex === lastClosedIndex + 1,
    `Hito ${lastClosed.id} must immediately precede Hito ${active.id}`,
  );
  ensure(typeof lastClosed.document === 'string', `Hito ${lastClosed.id} has no note`);
  ensure(typeof active.document === 'string', `Hito ${active.id} has no note`);

  const configuredProjection = milestones.milestones.map(
    ({ id, title, status, document }) => ({ id, title, status, document }),
  );
  validateStateAgainstConfiguration({
    active,
    configuredProjection,
    contract,
    evidenceComparison: 'historical-compatible',
    label: 'historical state',
    lastClosed,
    state: historicalState,
  });
  validateStateAgainstConfiguration({
    active,
    configuredProjection,
    contract,
    evidenceComparison: 'exact',
    label: 'live state',
    lastClosed,
    state: liveState,
  });

  const [lastClosedNote, activeNote] = await Promise.all([
    readText(root, lastClosed.document),
    readText(root, active.document),
  ]);
  const lastClosedFrontmatter = parseFrontmatter(lastClosed.document, lastClosedNote);
  const activeFrontmatter = parseFrontmatter(active.document, activeNote);
  ensure(
    lastClosedFrontmatter.status === 'done'
      && lastClosedFrontmatter.hito === lastClosed.id,
    `${lastClosed.document} must declare Hito ${lastClosed.id} as DONE`,
  );
  ensure(
    activeFrontmatter.status === 'active' && activeFrontmatter.hito === active.id,
    `${active.document} must declare Hito ${active.id} as ACTIVE`,
  );
  ensure(
    lastClosedFrontmatter.project
      && lastClosedFrontmatter.project === activeFrontmatter.project,
    'milestone notes do not identify the same project',
  );

  const evidence = lastClosed.evidence;
  ensure(evidence && typeof evidence === 'object', `Hito ${lastClosed.id} has no evidence`);
  ensure(
    Array.isArray(evidence.pullRequests)
      && evidence.pullRequests.length > 0
      && evidence.pullRequests.every((number) => Number.isInteger(number) && number > 0),
    `Hito ${lastClosed.id} is missing required pull request evidence`,
  );
  ensure(
    /^[0-9a-f]{40}$/.test(evidence.mergeCommit ?? ''),
    `Hito ${lastClosed.id} is missing a full mergeCommit`,
  );
  ensure(
    Array.isArray(evidence.requiredPaths) && evidence.requiredPaths.length > 0,
    `Hito ${lastClosed.id} is missing required path evidence`,
  );
  for (const requiredPath of evidence.requiredPaths) {
    ensure(
      await pathExists(root, requiredPath),
      `required closing evidence is missing: ${requiredPath}`,
    );
  }
  for (const pullRequest of evidence.pullRequests) {
    ensure(
      lastClosedNote.includes(`#${pullRequest}`),
      `${lastClosed.document} is missing evidence for PR #${pullRequest}`,
    );
  }
  ensure(
    lastClosedNote.includes(evidence.mergeCommit.slice(0, 7)),
    `${lastClosed.document} is missing merge evidence ${evidence.mergeCommit.slice(0, 7)}`,
  );
  for (const verification of ['unit', 'e2e', 'build']) {
    ensure(
      historicalState.verification?.[verification] === 'passed',
      `closing verification ${verification} is not passed in historical state`,
    );
  }
  ensure(
    historicalState.source?.pullRequest?.source === 'github-api'
      && historicalState.source.pullRequest.state === 'closed'
      && typeof historicalState.source.pullRequest.mergedAt === 'string'
      && historicalState.source.pullRequest.mergedAt.length > 0,
    'historical closing pull request is not confirmed as merged',
  );

  const expectedHistoricalNextAction = deriveNextAction({
    verification: historicalState.verification,
    activeMilestone: historicalState.milestone,
    pullRequest: historicalState.source.pullRequest,
  });
  ensure(
    isDeepStrictEqual(
      historicalState.nextAction,
      expectedHistoricalNextAction,
    ),
    'historical nextAction does not match the canonical nextAction logic',
  );
  const expectedLiveNextAction = deriveNextAction({
    verification: liveState.verification,
    activeMilestone: liveState.milestone,
    pullRequest: liveState.source.pullRequest,
  });
  ensure(
    isDeepStrictEqual(liveState.nextAction, expectedLiveNextAction),
    'live nextAction does not match the canonical nextAction logic',
  );
  const firstIncomplete = historicalState.milestone.checkpoints.find(
    (checkpoint) => !checkpoint.complete,
  );
  ensure(firstIncomplete, `Hito ${active.id} has no incomplete checkpoint`);
  ensure(
    expectedHistoricalNextAction.kind === 'implement-checkpoint'
      && expectedHistoricalNextAction.title
        === `${firstIncomplete.id}: ${firstIncomplete.title}`,
    `nextAction does not correspond to the first incomplete checkpoint ${firstIncomplete.id}`,
  );
  ensure(
    contract.transitionGate
      && typeof contract.transitionGate.description === 'string'
      && contract.transitionGate.description.trim().length > 0,
    'handoff contract has no transition gate description',
  );
  ensure(
    contract.transitionGate.conditionedCheckpoint === firstIncomplete.id,
    `transition gate checkpoint must match nextAction checkpoint ${firstIncomplete.id}`,
  );
  ensure(
    typeof contract.transitionGate.completionCondition === 'string'
      && contract.transitionGate.completionCondition.trim().length > 0,
    'handoff contract has no transition gate completion condition',
  );
  const progress = {
    complete: historicalState.milestone.checkpoints.filter(
      (checkpoint) => checkpoint.complete === true,
    ).length,
    total: historicalState.milestone.checkpoints.length,
  };

  ensure(
    typeof policy.repositoryDocsRoot === 'string'
      && policy.automationRules?.allowGeneratedFileReplacement === true,
    'documentation policy does not allow generated file replacement',
  );
  const outputs = validateOutputPaths(root, contract, policy);
  ensure(
    typeof policy.canonicalNextAction === 'string',
    `${policyPath} has no canonicalNextAction`,
  );
  const canonicalNextAction = await readText(root, policy.canonicalNextAction);
  for (const expectedFragment of [
    liveState.nextAction.text,
    liveState.nextAction.commitHint,
    liveState.nextAction.doneWhen,
  ].filter(Boolean)) {
    ensure(
      canonicalNextAction.includes(expectedFragment),
      `${policy.canonicalNextAction} does not match observed nextAction`,
    );
  }

  ensure(
    git(root, ['rev-parse', `${evidence.mergeCommit}^{commit}`])
      === evidence.mergeCommit,
    `closing mergeCommit ${evidence.mergeCommit} is not in Git history`,
  );
  ensure(
    isAncestor(root, evidence.mergeCommit, contract.observedRevision),
    'closing mergeCommit is not an ancestor of observedRevision',
  );
  const sources = [
    agentsPath,
    milestonesPath,
    observedStatePath,
    contractPath,
    lastClosed.document,
    active.document,
    policyPath,
    policy.canonicalNextAction,
  ];
  const context = {
    active,
    activeNote,
    agents,
    contract,
    firstIncomplete,
    lastClosed,
    lastClosedNote,
    policy,
    progress,
    project: activeFrontmatter.project,
    sources,
    state: historicalState,
  };

  return {
    outputs,
    contents: {
      masterPrompt: renderMasterPrompt(context),
      portablePrompt: renderPortablePrompt(context),
      historicalHandoff: renderHistoricalHandoff(context),
    },
  };
}

export async function generateMilestoneHandoff({
  root = defaultRepositoryRoot,
  check = false,
  allowActivationPending = false,
  observedState = observedStatePath,
} = {}) {
  const repositoryRoot = path.resolve(root);
  const result = await validateAndBuild(repositoryRoot, observedState);

  if (Object.keys(result.outputs).length === 0) {
    ensure(
      allowActivationPending,
      'activation-pending-sync is valid only with explicit --allow-activation-pending validation',
    );
    return result.outputs;
  }

  for (const [name, outputPath] of Object.entries(result.outputs)) {
    const expected = Buffer.from(result.contents[name], 'utf8');
    const absolute = resolveRepositoryPath(repositoryRoot, outputPath);

    if (check) {
      let actual;
      try {
        actual = await readFile(absolute);
      } catch (error) {
        if (error?.code === 'ENOENT') {
          throw validationError(`generated output is missing: ${outputPath}`);
        }
        throw error;
      }
      const canonicalActual = Buffer.from(
        normalizeLf(actual.toString('utf8')),
        'utf8',
      );
      ensure(
        canonicalActual.equals(expected),
        `generated output is out of date: ${outputPath}`,
      );
      continue;
    }

    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, expected);
  }

  return result.outputs;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const root = args.root ? path.resolve(args.root) : defaultRepositoryRoot;
  const check = args.check === true;
  const outputs = await generateMilestoneHandoff({
    root,
    check,
    allowActivationPending: args['allow-activation-pending'] === true,
    observedState: args['observed-state'] ?? observedStatePath,
  });
  const action = check ? 'verified' : 'generated';
  console.log(`Milestone handoff ${action}: ${Object.values(outputs).join(', ')}`);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
