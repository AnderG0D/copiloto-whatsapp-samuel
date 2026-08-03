import { readFile, writeFile } from 'node:fs/promises';
import {
  fromRoot,
  markdownStatus,
  parseArguments,
  readJson,
  replaceAutoBlock,
} from './shared.mjs';

const args = parseArguments(process.argv.slice(2));
const inputPath = args.input || 'docs/_generated/project-state.json';
const state = await readJson(inputPath);
const projectRoot = 'docs/obsidian/Copiloto WhatsApp Samuel';

function generatedDocument(type, title, blockName, body) {
  return `---
type: ${type}
project: Copiloto WhatsApp Samuel
generated: true
updated: ${state.observedDate}
---

# ${title}

<!-- AUTO:BEGIN ${blockName} -->
${body.trim()}
<!-- AUTO:END ${blockName} -->
`;
}

function sourceDescription() {
  const pullRequest = state.source.pullRequest;
  const pr = pullRequest
    ? `, asociado al [PR #${pullRequest.number}](${pullRequest.url})`
    : '';
  return `\`${state.source.branch}\` en \`${state.source.shortSha}\`${pr}`;
}

function renderMilestones() {
  const rows = state.milestones.map((milestone) => {
    let status = milestone.status.toUpperCase();
    let evidence = milestone.status === 'done' ? 'Configurado como cerrado' : 'En ejecución';

    if (milestone.id === state.milestone.id) {
      const complete = state.milestone.checkpoints.filter((item) => item.complete).length;
      status = state.milestone.checkpoints.every((item) => item.complete)
        ? 'READY_TO_CLOSE'
        : 'ACTIVE';
      evidence = `${complete}/${state.milestone.checkpoints.length} checkpoints observados`;
    }

    return `| ${milestone.id} | ${milestone.title} | \`${status}\` | ${evidence} |`;
  });

  return [
    '| Hito | Resultado | Estado | Evidencia |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function implementedComponents() {
  const definitions = [
    ['evolutionWebhook', 'Webhook de Evolution'],
    ['supabase', 'Persistencia en Supabase'],
    ['leadScoring', 'Scoring de leads'],
    ['aiProviderContract', 'Contrato neutral `AiProvider`'],
    ['geminiProvider', '`GeminiProvider` aislado y probado'],
    ['conversationContext', 'Constructor de contexto seguro'],
    ['responseDraft', 'Servicio de borradores'],
    ['inventory', 'Módulo de inventario'],
    ['reports', 'Módulo de reportes'],
    ['media', 'Módulo de medios'],
    ['sender', 'Componente de envío'],
  ];

  return definitions
    .filter(([key]) => state.architecture.components[key])
    .map(([, label]) => `- ${label}.`)
    .join('\n');
}

function pendingComponents() {
  const pending = [];
  const components = state.architecture.components;
  if (!components.geminiRegistered) pending.push('`GeminiProvider` no está registrado en un módulo.');
  if (!components.aiConnectedToWebhook) pending.push('La IA no está conectada al webhook.');
  if (!components.conversationContext) pending.push('El constructor de contexto seguro aún no existe.');
  if (!components.responseDraft) pending.push('El servicio de borradores aún no existe.');
  if (!components.inventory) pending.push('Inventario aún no implementado.');
  if (!components.reports) pending.push('Reportes aún no implementados.');
  if (!components.media) pending.push('Medios aún no implementados.');
  if (!components.sender) pending.push('Envío automático aún no implementado.');
  return pending.map((item) => `- ${item}`).join('\n');
}

function verificationLines() {
  const discovered = state.verification.discoveredTests;
  const cases = (count) => `${count} ${count === 1 ? 'caso' : 'casos'} ejecutados`;
  const values = [
    ['Unitarias', state.verification.unit, cases(discovered.unit)],
    ['E2E', state.verification.e2e, cases(discovered.e2e)],
    ['Build', state.verification.build, 'compilación del backend'],
  ];
  return values.map(([label, status, detail]) => (
    `- **${label}:** \`${markdownStatus(status)}\` — ${detail}.`
  )).join('\n');
}

function architectureDiagram() {
  const components = state.architecture.components;
  const lines = [
    '```mermaid',
    'flowchart TD',
    '    A["AppModule"] --> B["EvolutionWebhookModule"]',
    '    B --> C["SupabaseModule"]',
    '    B --> D["LeadsModule"]',
    '    E["AiProvider contract"] -. "implemented by" .-> F["GeminiProvider"]',
  ];

  if (components.responseDraft) lines.push('    G["ResponseDraftService"] --> E');
  if (components.responseDraftConnectedToWebhook) lines.push('    B --> G');
  if (components.aiConnectedToWebhook && !components.responseDraftConnectedToWebhook) {
    lines.push('    B --> E');
  }
  lines.push('```');
  return lines.join('\n');
}

const progress = state.milestone.checkpoints.map((checkpoint) => (
  `- [${checkpoint.complete ? 'x' : ' '}] ${checkpoint.id} — ${checkpoint.title}.`
)).join('\n');
const blockers = Object.entries({
  unit: state.verification.unit,
  e2e: state.verification.e2e,
  build: state.verification.build,
})
  .filter(([, value]) => value === 'failed')
  .map(([name]) => `- Falló la validación \`${name}\`; atenderla antes del siguiente checkpoint.`);

if (blockers.length === 0) {
  const pending = state.milestone.checkpoints.find((item) => !item.complete);
  blockers.push(pending
    ? `- El primer checkpoint pendiente es **${pending.id}: ${pending.title}**.`
    : `- No hay checkpoints técnicos pendientes; falta comprobar el cierre del Hito ${state.milestone.id}.`);
}

const currentStateBody = `> [!info] Fuente
> Estado observado en ${sourceDescription()}. Generado desde el código, Git y GitHub; no sustituye decisiones humanas.

## Hito actual

**Hito ${state.milestone.id} — ${state.milestone.title}**.

## Hitos confirmados

${renderMilestones()}

## Componentes confirmados

${implementedComponents()}

## Todavía fuera del runtime

${pendingComponents()}

## Modelo predeterminado observado

\`${state.runtime.defaultGeminiModel ?? 'no detectado'}\``;

const evidenceBody = `## Revisión observada

- Fuente: ${sourceDescription()}.
- Commit completo: \`${state.source.sha}\`.
- Mensaje: ${state.source.subject}.
${state.source.ciUrl ? `- Ejecución de CI: [abrir evidencia](${state.source.ciUrl}).\n` : ''}
## Validación

${verificationLines()}

## Backend

- Node.js: ${state.runtime.node}.
- NestJS: \`${state.runtime.framework.version}\`.
- \`@google/genai\`: \`${state.runtime.dependencies.googleGenAi}\`.
- \`@supabase/supabase-js\`: \`${state.runtime.dependencies.supabaseJs}\`.

## Módulos detectados

${state.architecture.modules.map((item) => `- \`${item.name}\` — \`${item.path}\`.`).join('\n')}

## Migraciones detectadas

${state.architecture.migrations.map((item) => `- \`${item}\``).join('\n')}`;

const nextAction = state.nextAction;
const nextActionBody = `- [ ] ${nextAction.text}
${nextAction.commitHint ? `\n**Commit sugerido:** \`${nextAction.commitHint}\`\n` : ''}
**Termina cuando:** ${nextAction.doneWhen}`;

const architectureBody = `${architectureDiagram()}

${state.architecture.components.geminiRegistered
  ? '`GeminiProvider` está registrado en el runtime.'
  : '`GeminiProvider` existe y está probado, pero todavía no está registrado en un módulo.'}

${state.architecture.components.responseDraftConnectedToWebhook
  && state.architecture.components.aiConnectedToWebhook
  ? '`EvolutionWebhookService` llama a `ResponseDraftService`, que usa `AI_PROVIDER` para generar borradores. El flujo los persiste como `PROPOSED`; no envía mensajes a WhatsApp.'
  : state.architecture.components.aiConnectedToWebhook
    ? 'El contrato de IA participa directamente en el flujo del webhook.'
    : 'El contrato de IA no está conectado al webhook; no puede generar respuestas desde ese flujo.'}`;

const generatedFiles = {
  [`${projectRoot}/_generated/Estado actual.md`]: generatedDocument(
    'generated-project-state', 'Estado actual', 'project-state', currentStateBody,
  ),
  [`${projectRoot}/_generated/Evidencia tecnica.md`]: generatedDocument(
    'generated-technical-evidence', 'Evidencia técnica', 'technical-evidence', evidenceBody,
  ),
  [`${projectRoot}/_generated/Siguiente accion.md`]: generatedDocument(
    'generated-next-action', 'Siguiente acción — Copiloto WhatsApp Samuel', 'next-action', nextActionBody,
  ),
  [`${projectRoot}/_generated/Arquitectura actual.md`]: generatedDocument(
    'generated-architecture', 'Arquitectura actual observada', 'architecture', architectureBody,
  ),
};

for (const [relativePath, content] of Object.entries(generatedFiles)) {
  await writeFile(fromRoot(relativePath), content, 'utf8');
}

const mixedBlocks = [
  {
    path: `${projectRoot}/00 Copiloto WhatsApp Samuel - MOC.md`,
    name: 'operational-links',
    body: '- [[Estado actual]]\n- [[Evidencia tecnica]]\n- [[Siguiente accion]]',
  },
  {
    path: `${projectRoot}/01 Panel de Proyecto - Copiloto WhatsApp Samuel.md`,
    name: 'dashboard-state',
    body: '![[Estado actual]]\n\n![[Evidencia tecnica]]',
  },
  {
    path: `${projectRoot}/01 Panel de Proyecto - Copiloto WhatsApp Samuel.md`,
    name: 'blockers',
    body: blockers.join('\n'),
  },
  {
    path: state.milestone.document,
    name: 'milestone-progress',
    body: progress,
  },
  {
    path: `${projectRoot}/04 Docs/Arquitectura y Flujo Principal.md`,
    name: 'architecture-state',
    body: '![[Arquitectura actual]]',
  },
  {
    path: `${projectRoot}/04 Docs/Mapa del Codigo - agent-core.md`,
    name: 'code-map-evidence',
    body: '![[Evidencia tecnica]]',
  },
  {
    path: `${projectRoot}/04 Docs/Setup Local - Como levantar el proyecto.md`,
    name: 'setup-runtime',
    body: '![[Evidencia tecnica]]',
  },
  {
    path: `${projectRoot}/05 Diagramas/Diagrama - Arquitectura Codigo agent-core.md`,
    name: 'code-architecture',
    body: '![[Arquitectura actual]]',
  },
];

const grouped = new Map();
for (const block of mixedBlocks) {
  const entries = grouped.get(block.path) ?? [];
  entries.push(block);
  grouped.set(block.path, entries);
}

for (const [relativePath, blocks] of grouped) {
  let text = await readFile(fromRoot(relativePath), 'utf8');
  for (const block of blocks) {
    text = replaceAutoBlock(text, block.name, block.body);
  }
  await writeFile(fromRoot(relativePath), text, 'utf8');
}

console.log(`Rendered ${Object.keys(generatedFiles).length} generated notes and ${mixedBlocks.length} AUTO blocks`);
