import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { generateMilestoneHandoff } from './generate-milestone-handoff.mjs';
import { deriveNextAction } from './shared.mjs';

const docsRoot = 'docs/obsidian/Copiloto WhatsApp Samuel';
const contractPath = 'docs/control/handoff-state.json';
const milestonesPath = 'docs/control/milestones.json';
const statePath = 'docs/_generated/project-state.json';
const canonicalActionPath = `${docsRoot}/_state/Siguiente accion.md`;
const requiredEvidencePath = 'evidence/required-closing-file.txt';

const outputPaths = {
  masterPrompt: `${docsRoot}/_generated/Prompt Maestro - Hito actual.md`,
  portablePrompt: `${docsRoot}/_generated/Prompt Portatil - Hito actual.md`,
  historicalHandoff: `${docsRoot}/04 Handoffs/Hito 04.3 a 04.4.md`,
};

function milestoneFileId(id) {
  const [major, ...rest] = id.split('.');
  return [major.padStart(2, '0'), ...rest].join('.');
}

function transitionPaths(lastClosedMilestone, activeMilestone) {
  return {
    previousNotePath: `${docsRoot}/02 Hitos/Hito ${lastClosedMilestone} DONE.md`,
    activeNotePath: `${docsRoot}/02 Hitos/Hito ${activeMilestone} ACTIVE.md`,
    outputPaths: {
      masterPrompt: `${docsRoot}/_generated/Prompt Maestro - Hito actual.md`,
      portablePrompt: `${docsRoot}/_generated/Prompt Portatil - Hito actual.md`,
      historicalHandoff: `${docsRoot}/04 Handoffs/Hito ${milestoneFileId(lastClosedMilestone)} a ${milestoneFileId(activeMilestone)}.md`,
    },
  };
}

function absolute(root, relativePath) {
  return path.join(root, ...relativePath.split('/'));
}

async function writeFixtureFile(root, relativePath, content) {
  const target = absolute(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content.replace(/\r\n?/g, '\n'), 'utf8');
}

async function writeFixtureJson(root, relativePath, value) {
  await writeFixtureFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readFixtureJson(root, relativePath) {
  return JSON.parse(await readFile(absolute(root, relativePath), 'utf8'));
}

function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function commitAll(root, message) {
  git(root, ['add', '.']);
  git(root, ['commit', '-m', message]);
  return git(root, ['rev-parse', 'HEAD']);
}

function canonicalActionDocument(state) {
  return `---
type: generated-next-action
project: Copiloto WhatsApp Samuel
generated: true
updated: ${state.observedDate}
---

# Siguiente acción — Copiloto WhatsApp Samuel

<!-- AUTO:BEGIN next-action -->
- [ ] ${state.nextAction.text}

**Commit sugerido:** \`${state.nextAction.commitHint}\`

**Termina cuando:** ${state.nextAction.doneWhen}
<!-- AUTO:END next-action -->
`;
}

async function createFixture(t, {
  lastClosedMilestone = '4.3',
  activeMilestoneId = '4.4',
} = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'milestone-handoff-'));
  t.after(async () => rm(root, { recursive: true, force: true }));
  const {
    previousNotePath: fixturePreviousNotePath,
    activeNotePath: fixtureActiveNotePath,
    outputPaths: fixtureOutputPaths,
  } = transitionPaths(lastClosedMilestone, activeMilestoneId);

  git(root, ['init', '--quiet']);
  git(root, ['config', 'user.name', 'Documentation Test']);
  git(root, ['config', 'user.email', 'docs-test@example.invalid']);

  await writeFixtureFile(root, requiredEvidencePath, 'verified\n');
  const mergeCommit = commitAll(root, 'feat: close functional work');

  const activeMilestone = {
    id: activeMilestoneId,
    title: 'Revisión y aprobación humana',
    status: 'active',
    workingBranch: `feature/hito-${activeMilestoneId.replaceAll('.', '-')}-human-review`,
    document: fixtureActiveNotePath,
    checkpoints: [
      {
        id: `${activeMilestoneId}-A`,
        title: 'Persistencia auditable de decisiones humanas',
        commitHint: 'feat: persist auditable response draft decisions',
        evidence: {
          pathContentAllAny: [
            {
              path: 'agent-core/example.spec.ts',
              contentAll: ['approve', 'reject', 'operator'],
            },
          ],
        },
      },
      {
        id: `${activeMilestoneId}-B`,
        title: 'Servicio de revisión humana',
        commitHint: 'feat: add human response draft review service',
        evidence: {
          pathContentAllAny: [
            {
              path: 'agent-core/example.spec.ts',
              contentAll: ['service'],
            },
          ],
        },
      },
      {
        id: `${activeMilestoneId}-C`,
        title: 'Interfaz administrativa autenticada',
        commitHint: 'feat: expose authenticated response draft review API',
        evidence: {
          pathContentAllAny: [
            {
              path: 'agent-core/example.spec.ts',
              contentAll: ['unauthorized', 'operator', 'approve'],
            },
          ],
        },
      },
      {
        id: `${activeMilestoneId}-D`,
        title: 'Pruebas, idempotencia y ausencia de envío',
        commitHint: 'test: cover human review without sending',
        evidence: {
          pathContentAllAny: [
            {
              path: 'agent-core/example.spec.ts',
              contentAll: ['approve', 'send', 'not.toHaveBeenCalled'],
            },
          ],
        },
      },
    ],
    completionRequires: ['unit', 'e2e', 'build', 'mergedPullRequest'],
  };
  const previousMilestone = {
    id: lastClosedMilestone,
    title: 'Persistencia e integración de borradores sin envío',
    status: 'done',
    document: fixturePreviousNotePath,
    evidence: {
      pullRequests: [15, 16],
      mergeCommit,
      requiredPaths: [requiredEvidencePath],
    },
  };
  const milestones = {
    version: 1,
    activeMilestone: activeMilestoneId,
    milestones: [previousMilestone, activeMilestone],
  };
  const policy = {
    version: 1,
    repositoryDocsRoot: docsRoot,
    classes: {
      generated: [
        `${docsRoot}/_generated/**`,
        fixtureOutputPaths.historicalHandoff,
      ],
      mixed: [],
      protected: [],
      human: [`${docsRoot}/**`],
    },
    automationRules: {
      allowGeneratedFileReplacement: true,
    },
    canonicalNextAction: canonicalActionPath,
  };

  await writeFixtureFile(root, 'AGENTS.md', `# Fixture project

## Project scope

- Documentation fixture only.

## Architecture

- Providers produce candidates only.

## Safety and privacy

- Keep AUTO_SEND_MESSAGES=false.

## Engineering workflow

- Inspect the working tree before editing.

## Documentation governance

- Generated files must declare generated: true.

## Validation

- Run the documented checks.
`);
  await writeFixtureJson(root, milestonesPath, milestones);
  await writeFixtureJson(root, 'docs/control/documentation-policy.json', policy);
  await writeFixtureFile(root, fixturePreviousNotePath, `---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
hito: ${lastClosedMilestone}
---

# Hito ${lastClosedMilestone}

## Objetivo alcanzado

Persistencia integrada sin envío.

## Evidencia GitHub

- PR #15.
- PR #16.
- Merge \`${mergeCommit.slice(0, 7)}\`.

## Validación final

- Unitarias, e2e y build aprobados.
`);
  await writeFixtureFile(root, fixtureActiveNotePath, `---
type: milestone
project: Copiloto WhatsApp Samuel
status: active
hito: ${activeMilestoneId}
---

# Hito ${activeMilestoneId}

## Objetivo

Registrar decisiones humanas sin enviar mensajes.

## Gate técnico previo

Generar el relevo determinista antes de ${activeMilestoneId}-A.

## Alcance aprobado

- Aprobar, editar o rechazar de manera auditable.

## Reglas de seguridad

- Aprobar no envía.
- Mantener AUTO_SEND_MESSAGES=false.
- No se permite ningún envío a leads.
`);

  const placeholderState = {
    schemaVersion: 1,
    observedDate: '2026-08-04',
    repository: 'example/project',
    source: {
      ref: 'HEAD',
      branch: 'main',
      sha: '0000000000000000000000000000000000000000',
      shortSha: '0000000',
      subject: `docs: close milestone ${lastClosedMilestone} and activate ${activeMilestoneId}`,
      committedAt: '2026-08-04T19:24:29-06:00',
      pullRequest: {
        number: 20,
        title: `Close milestone ${lastClosedMilestone}`,
        url: 'https://example.invalid/pull/20',
        state: 'closed',
        mergedAt: '2026-08-05T01:24:30Z',
        source: 'fixture',
      },
      ciUrl: 'https://example.invalid/actions/1',
    },
    verification: {
      unit: 'passed',
      e2e: 'passed',
      build: 'passed',
      discoveredTests: { unit: 10, e2e: 1 },
    },
    architecture: {
      components: {
        sender: false,
      },
    },
    milestones: milestones.milestones.map(({ id, title, status, document }) => ({
      id,
      title,
      status,
      document,
    })),
    milestone: {
      ...activeMilestone,
      checkpoints: activeMilestone.checkpoints.map((checkpoint) => ({
        ...checkpoint,
        complete: false,
      })),
    },
  };
  placeholderState.nextAction = deriveNextAction({
    verification: placeholderState.verification,
    activeMilestone: placeholderState.milestone,
    pullRequest: placeholderState.source.pullRequest,
  });
  await writeFixtureJson(root, statePath, placeholderState);
  await writeFixtureFile(root, canonicalActionPath, canonicalActionDocument(placeholderState));
  const observedRevision = commitAll(
    root,
    `docs: close milestone ${lastClosedMilestone} and activate ${activeMilestoneId}`,
  );

  const observedState = {
    ...placeholderState,
    source: {
      ...placeholderState.source,
      sha: observedRevision,
      shortSha: observedRevision.slice(0, 7),
    },
  };
  observedState.nextAction = deriveNextAction({
    verification: observedState.verification,
    activeMilestone: observedState.milestone,
    pullRequest: observedState.source.pullRequest,
  });
  await writeFixtureJson(root, statePath, observedState);
  await writeFixtureFile(root, canonicalActionPath, canonicalActionDocument(observedState));
  const frozenRevision = commitAll(root, 'docs: sync project state');

  const contract = {
    schemaVersion: 1,
    handoffId: `${lastClosedMilestone}-to-${activeMilestoneId}`,
    lastClosedMilestone,
    activeMilestone: activeMilestoneId,
    transitionGate: {
      description: 'integrar y validar el generador determinista',
      conditionedCheckpoint: `${activeMilestoneId}-A`,
      completionCondition: 'el gate del generador haya sido validado y fusionado',
    },
    safetyInvariants: {
      sender: false,
      autoSendMessages: false,
    },
    frozenRevision,
    observedRevision,
    outputs: fixtureOutputPaths,
  };
  await writeFixtureJson(root, contractPath, contract);

  return {
    root,
    mergeCommit,
    observedRevision,
    frozenRevision,
    previousNotePath: fixturePreviousNotePath,
    activeNotePath: fixtureActiveNotePath,
    outputPaths: fixtureOutputPaths,
  };
}

async function createWaitingFixture(t) {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  const historicalBytes = await readFile(
    absolute(fixture.root, fixture.outputPaths.historicalHandoff),
  );
  const milestones = await readFixtureJson(fixture.root, milestonesPath);
  milestones.milestones.find((milestone) => milestone.id === '4.4').status = 'done';
  milestones.activeMilestone = null;
  milestones.lifecycleState = 'awaiting-next-milestone-approval';
  milestones.lastClosedMilestone = '4.4';
  await writeFixtureJson(fixture.root, milestonesPath, milestones);

  const state = await readFixtureJson(fixture.root, statePath);
  state.schemaVersion = 2;
  state.lifecycleState = 'awaiting-next-milestone-approval';
  state.lastClosedMilestone = '4.4';
  state.activeMilestone = null;
  state.milestone = null;
  state.milestones = milestones.milestones.map(({ id, title, status, document }) => ({
    id,
    title,
    status,
    document,
  }));
  state.nextAction = deriveNextAction({
    verification: state.verification,
    activeMilestone: null,
    pullRequest: state.source.pullRequest,
  });
  await writeFixtureJson(fixture.root, statePath, state);
  await writeFixtureFile(
    fixture.root,
    canonicalActionPath,
    canonicalActionDocument(state),
  );

  const waitingOutputPaths = {
    masterPrompt: fixture.outputPaths.masterPrompt,
    portablePrompt: fixture.outputPaths.portablePrompt,
  };
  await writeFixtureJson(fixture.root, contractPath, {
    schemaVersion: 2,
    lifecycleState: 'awaiting-next-milestone-approval',
    lastClosedMilestone: '4.4',
    activeMilestone: null,
    safetyInvariants: {
      sender: false,
      autoSendMessages: false,
    },
    outputs: waitingOutputPaths,
    historicalHandoff: {
      path: fixture.outputPaths.historicalHandoff,
      sha256: createHash('sha256').update(historicalBytes).digest('hex'),
    },
  });

  return { ...fixture, historicalBytes, waitingOutputPaths };
}

async function createActivationPendingFixture(t) {
  const fixture = await createFixture(t);
  await writeFixtureJson(fixture.root, contractPath, {
    schemaVersion: 3,
    lifecycleState: 'activation-pending-sync',
    lastClosedMilestone: '4.3',
    activeMilestone: '4.4',
    safetyInvariants: {
      sender: false,
      autoSendMessages: false,
      noLeadSend: true,
    },
  });
  return fixture;
}

async function mutateJson(root, relativePath, mutate) {
  const value = await readFixtureJson(root, relativePath);
  mutate(value);
  await writeFixtureJson(root, relativePath, value);
}

async function outputBytes(root, paths = outputPaths) {
  return Object.fromEntries(await Promise.all(
    Object.entries(paths).map(async ([name, relativePath]) => [
      name,
      await readFile(absolute(root, relativePath)),
    ]),
  ));
}

async function snapshotWorkingFiles(root) {
  const result = {};

  async function visit(directory, prefix = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (!prefix && entry.name === '.git') continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(target, relative);
      } else if (entry.isFile()) {
        const metadata = await stat(target);
        const content = await readFile(target);
        result[relative] = {
          size: metadata.size,
          mtimeMs: metadata.mtimeMs,
          sha256: createHash('sha256').update(content).digest('hex'),
        };
      }
    }
  }

  await visit(root);
  return result;
}

async function assertFailureWithoutWrites(root, operation, expectedError) {
  const before = await snapshotWorkingFiles(root);
  await assert.rejects(operation(), expectedError);
  const after = await snapshotWorkingFiles(root);
  assert.deepEqual(after, before);
}

test('generates the valid 4.3 to 4.4 transition', async (t) => {
  const fixture = await createFixture(t);

  await generateMilestoneHandoff({ root: fixture.root });
  const outputs = await outputBytes(fixture.root);

  const semanticRequirements = [
    /Gate de transición actual: integrar y validar el generador determinista\./,
    /Progreso funcional actual del Hito 4\.4: \*\*0\/4\*\*\./,
    /Primera acción funcional: \*\*4\.4-A — Persistencia auditable de decisiones humanas\*\*\./,
    /4\.4-A solo puede comenzar después de que el gate del generador haya sido validado y fusionado\./,
    /`sender=false`\./,
    /`AUTO_SEND_MESSAGES=false`\./,
    /Aprobar un borrador no envía mensajes\./,
    /No existe envío automático dentro de este alcance\./,
  ];
  for (const [name, content] of Object.entries(outputs)) {
    const text = content.toString('utf8');
    for (const requirement of semanticRequirements) {
      assert.match(text, requirement, `${name} is missing ${requirement}`);
    }
    assert.ok(
      text.indexOf('## Gate de transición y progreso funcional')
        < text.indexOf('## Primera acción funcional condicionada'),
      `${name} does not place the gate before the first functional action`,
    );
  }
  assert.match(outputs.masterPrompt.toString('utf8'), /Prompt maestro — Hito 4\.4/);
  assert.match(outputs.historicalHandoff.toString('utf8'), /4\.3-to-4\.4/);
  assert.ok(Object.values(outputs).every((content) => !content.includes('\r')));
});

test('generates a v2 waiting lifecycle without writing the historical handoff', async (t) => {
  const fixture = await createWaitingFixture(t);

  await generateMilestoneHandoff({ root: fixture.root });
  const outputs = await outputBytes(fixture.root, fixture.waitingOutputPaths);
  const historicalAfter = await readFile(
    absolute(fixture.root, fixture.outputPaths.historicalHandoff),
  );

  assert.ok(historicalAfter.equals(fixture.historicalBytes));
  for (const content of Object.values(outputs)) {
    const text = content.toString('utf8');
    assert.match(text, /No hay hito activo/);
    assert.match(text, /awaiting-next-milestone-approval/);
    assert.match(text, /sender=false/);
    assert.match(text, /AUTO_SEND_MESSAGES=false/);
    assert.doesNotMatch(text, /4\.5/);
    assert.doesNotMatch(text, /feature\/hito/i);
  }
});

test('rejects an inconsistent v2 waiting lifecycle without writes', async (t) => {
  const fixture = await createWaitingFixture(t);
  await mutateJson(fixture.root, milestonesPath, (milestones) => {
    milestones.milestones.find((milestone) => milestone.id === '4.4').status = 'active';
  });

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root }),
    /expected zero active milestones/,
  );
});

test('rejects v2 sender or automatic-send violations without writes', async (t) => {
  const senderFixture = await createWaitingFixture(t);
  await mutateJson(senderFixture.root, statePath, (state) => {
    state.architecture.components.sender = true;
  });
  await assertFailureWithoutWrites(
    senderFixture.root,
    () => generateMilestoneHandoff({ root: senderFixture.root }),
    /sender=false \(waiting state\)/,
  );

  const autoSendFixture = await createWaitingFixture(t);
  await mutateJson(autoSendFixture.root, contractPath, (contract) => {
    contract.safetyInvariants.autoSendMessages = true;
  });
  await assertFailureWithoutWrites(
    autoSendFixture.root,
    () => generateMilestoneHandoff({ root: autoSendFixture.root }),
    /AUTO_SEND_MESSAGES=false/,
  );
});

test('validates activation-pending-sync without writing final handoff outputs', async (t) => {
  const fixture = await createActivationPendingFixture(t);
  const before = await snapshotWorkingFiles(fixture.root);

  const outputs = await generateMilestoneHandoff({
    root: fixture.root,
    check: true,
    allowActivationPending: true,
  });

  assert.deepEqual(outputs, {});
  assert.deepEqual(await snapshotWorkingFiles(fixture.root), before);
});

test('rejects activation-pending-sync sender or automatic-send violations without writes', async (t) => {
  const senderFixture = await createActivationPendingFixture(t);
  await mutateJson(senderFixture.root, statePath, (state) => {
    state.architecture.components.sender = true;
  });
  await assertFailureWithoutWrites(
    senderFixture.root,
    () => generateMilestoneHandoff({
      root: senderFixture.root,
      check: true,
      allowActivationPending: true,
    }),
    /sender=false \(pending state\)/,
  );

  const autoSendFixture = await createActivationPendingFixture(t);
  await mutateJson(autoSendFixture.root, contractPath, (contract) => {
    contract.safetyInvariants.autoSendMessages = true;
  });
  await assertFailureWithoutWrites(
    autoSendFixture.root,
    () => generateMilestoneHandoff({
      root: autoSendFixture.root,
      check: true,
      allowActivationPending: true,
    }),
    /AUTO_SEND_MESSAGES=false/,
  );
});

test('rejects activation-pending-sync when B precedes A', async (t) => {
  const fixture = await createActivationPendingFixture(t);
  const milestones = await readFixtureJson(fixture.root, milestonesPath);
  const active = milestones.milestones.find((milestone) => milestone.id === '4.4');
  active.checkpoints = [active.checkpoints[1], active.checkpoints[0], ...active.checkpoints.slice(2)];
  await writeFixtureJson(fixture.root, milestonesPath, milestones);

  const state = await readFixtureJson(fixture.root, statePath);
  state.milestone.checkpoints = [
    state.milestone.checkpoints[1],
    state.milestone.checkpoints[0],
    ...state.milestone.checkpoints.slice(2),
  ];
  state.nextAction = deriveNextAction({
    verification: state.verification,
    activeMilestone: state.milestone,
    pullRequest: state.source.pullRequest,
  });
  await writeFixtureJson(fixture.root, statePath, state);

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({
      root: fixture.root,
      check: true,
      allowActivationPending: true,
    }),
    /pending next action must be the A checkpoint/,
  );
});

test('rejects a final active handoff without a merged pull request', async (t) => {
  const fixture = await createFixture(t);
  git(fixture.root, ['reset', '--soft', fixture.observedRevision]);
  await mutateJson(fixture.root, statePath, (state) => {
    state.source.pullRequest = null;
    state.nextAction = deriveNextAction({
      verification: state.verification,
      activeMilestone: state.milestone,
      pullRequest: null,
    });
  });
  const frozenRevision = commitAll(fixture.root, 'docs: freeze state without merged PR');
  await mutateJson(fixture.root, contractPath, (contract) => {
    contract.frozenRevision = frozenRevision;
  });

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root, check: true }),
    /historical closing pull request is not confirmed as merged/,
  );
});

test('rejects a changed v2 historical handoff without writes', async (t) => {
  const fixture = await createWaitingFixture(t);
  await writeFixtureFile(
    fixture.root,
    fixture.outputPaths.historicalHandoff,
    'changed historical handoff\n',
  );

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root }),
    /historical handoff changed/,
  );
});

test('v2 check mode does not write live prompts or the historical handoff', async (t) => {
  const fixture = await createWaitingFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  const before = await snapshotWorkingFiles(fixture.root);

  await generateMilestoneHandoff({ root: fixture.root, check: true });

  const after = await snapshotWorkingFiles(fixture.root);
  assert.deepEqual(after, before);
});

test('rejects more than one active milestone', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, milestonesPath, (milestones) => {
    milestones.milestones[0].status = 'active';
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /expected exactly one active milestone/,
  );
});

test('rejects a previous milestone that is not closed', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, milestonesPath, (milestones) => {
    milestones.milestones[0].status = 'pending';
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /Hito 4\.3 is not closed/,
  );
});

test('rejects missing mandatory closing evidence', async (t) => {
  const fixture = await createFixture(t);
  await rm(absolute(fixture.root, requiredEvidencePath));

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /required closing evidence is missing/,
  );
});

test('rejects disagreement between contract, configuration and observed state', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, statePath, (state) => {
    state.milestones[1].title = 'Different observed title';
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /milestone configuration and observed milestone list do not match/,
  );
});

test('rejects a handoffId that differs from the derived transition', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, contractPath, (contract) => {
    contract.handoffId = '4.3-to-4.5';
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /handoffId must match the derived transition 4\.3-to-4\.4/,
  );
});

test('rejects a milestone note whose DONE status is wrong', async (t) => {
  const fixture = await createFixture(t);
  const previous = await readFile(
    absolute(fixture.root, fixture.previousNotePath),
    'utf8',
  );
  await writeFixtureFile(
    fixture.root,
    fixture.previousNotePath,
    previous.replace('status: done', 'status: pending'),
  );

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /must declare Hito 4\.3 as DONE/,
  );
});

test('rejects a milestone note whose ACTIVE status is wrong', async (t) => {
  const fixture = await createFixture(t);
  const active = await readFile(
    absolute(fixture.root, fixture.activeNotePath),
    'utf8',
  );
  await writeFixtureFile(
    fixture.root,
    fixture.activeNotePath,
    active.replace('status: active', 'status: pending'),
  );

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /must declare Hito 4\.4 as ACTIVE/,
  );
});

test('rejects sender=true without creating or modifying outputs', async (t) => {
  const absentFixture = await createFixture(t);
  await mutateJson(absentFixture.root, statePath, (state) => {
    state.architecture.components.sender = true;
  });

  await assertFailureWithoutWrites(
    absentFixture.root,
    () => generateMilestoneHandoff({ root: absentFixture.root }),
    /project-state\.json must declare sender=false/,
  );
  for (const outputPath of Object.values(absentFixture.outputPaths)) {
    await assert.rejects(stat(absolute(absentFixture.root, outputPath)), { code: 'ENOENT' });
  }

  const existingFixture = await createFixture(t);
  await generateMilestoneHandoff({ root: existingFixture.root });
  await mutateJson(existingFixture.root, statePath, (state) => {
    state.architecture.components.sender = true;
  });
  const before = await outputBytes(existingFixture.root, existingFixture.outputPaths);

  await assertFailureWithoutWrites(
    existingFixture.root,
    () => generateMilestoneHandoff({ root: existingFixture.root }),
    /project-state\.json must declare sender=false/,
  );
  const after = await outputBytes(existingFixture.root, existingFixture.outputPaths);
  for (const name of Object.keys(before)) {
    assert.ok(before[name].equals(after[name]), `${name} changed after sender=true`);
  }
});

test('rejects an absent authoritative AUTO_SEND_MESSAGES=false rule', async (t) => {
  const fixture = await createFixture(t);
  const agents = await readFile(absolute(fixture.root, 'AGENTS.md'), 'utf8');
  await writeFixtureFile(
    fixture.root,
    'AGENTS.md',
    agents.replace('AUTO_SEND_MESSAGES=false', 'automatic sending disabled'),
  );

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root }),
    /AGENTS\.md must authoritatively require AUTO_SEND_MESSAGES=false/,
  );
});

test('rejects an incompatible authoritative AUTO_SEND_MESSAGES rule', async (t) => {
  const fixture = await createFixture(t);
  const agents = await readFile(absolute(fixture.root, 'AGENTS.md'), 'utf8');
  await writeFixtureFile(
    fixture.root,
    'AGENTS.md',
    agents.replace('AUTO_SEND_MESSAGES=false', 'AUTO_SEND_MESSAGES=true'),
  );

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root }),
    /AGENTS\.md must authoritatively require AUTO_SEND_MESSAGES=false/,
  );
});

test('rejects a transition gate conditioned on a checkpoint other than nextAction', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, contractPath, (contract) => {
    contract.transitionGate.conditionedCheckpoint = '4.4-B';
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /transition gate checkpoint must match nextAction checkpoint 4\.4-A/,
  );
});

test('rejects nextAction that is not the canonical first incomplete checkpoint', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, statePath, (state) => {
    state.nextAction.title = '4.4-B: Servicio de revisión humana';
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /nextAction does not match the canonical nextAction logic/,
  );
});

test('rejects a frozen revision with an unexpected history relationship', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, contractPath, (contract) => {
    contract.frozenRevision = fixture.observedRevision;
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /observedRevision is not the direct first parent of frozenRevision/,
  );
});

test('rejects a logical change in the frozen historical snapshot', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, statePath, (state) => {
    state.milestone.title = 'Logically changed historical title';
  });
  git(fixture.root, ['add', statePath]);
  git(fixture.root, ['commit', '--amend', '--no-edit']);
  const changedFrozenRevision = git(fixture.root, ['rev-parse', 'HEAD']);
  await mutateJson(fixture.root, contractPath, (contract) => {
    contract.frozenRevision = changedFrozenRevision;
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /active milestone details differ between configuration and observed state \(historical state\)/,
  );
});

test('accepts compatible historical evidence semantics but requires exact live evidence', async (t) => {
  const fixture = await createFixture(t);
  const useAllCandidates = (checkpoint) => {
    checkpoint.evidence.pathContentAll = checkpoint.evidence.pathContentAllAny;
    delete checkpoint.evidence.pathContentAllAny;
  };

  await mutateJson(fixture.root, milestonesPath, (milestones) => {
    useAllCandidates(milestones.milestones[1].checkpoints[3]);
  });
  await mutateJson(fixture.root, statePath, (state) => {
    useAllCandidates(state.milestone.checkpoints[3]);
  });

  await assert.doesNotReject(
    generateMilestoneHandoff({ root: fixture.root }),
  );

  await mutateJson(fixture.root, statePath, (state) => {
    const checkpoint = state.milestone.checkpoints[3];
    checkpoint.evidence.pathContentAllAny = checkpoint.evidence.pathContentAll;
    delete checkpoint.evidence.pathContentAll;
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /checkpoint 4\.4-D differs between configuration and observed state \(live state\)/,
  );
});

test('rejects historical evidence when its required file changes', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, milestonesPath, (milestones) => {
    milestones.milestones[1].checkpoints[3].evidence.pathContentAllAny[0].path
      = 'agent-core/other-example.spec.ts';
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /checkpoint 4\.4-D differs between configuration and observed state \(historical state\)/,
  );
});

test('rejects milestones that are not an actual consecutive transition', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, milestonesPath, (milestones) => {
    milestones.milestones.splice(1, 0, {
      id: '4.3.1',
      title: 'Intervening milestone',
      status: 'done',
      document: null,
    });
  });

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root }),
    /Hito 4\.3 must immediately precede Hito 4\.4/,
  );
});

test('generates a coherent future 4.4 to 4.5 transition without generator changes', async (t) => {
  const fixture = await createFixture(t, {
    lastClosedMilestone: '4.4',
    activeMilestoneId: '4.5',
  });

  await generateMilestoneHandoff({ root: fixture.root });
  const outputs = await outputBytes(fixture.root, fixture.outputPaths);

  for (const content of Object.values(outputs)) {
    assert.match(content.toString('utf8'), /4\.4-to-4\.5/);
    assert.match(content.toString('utf8'), /Primera acción funcional: \*\*4\.5-A/);
  }
  assert.equal(
    path.basename(fixture.outputPaths.historicalHandoff),
    'Hito 04.4 a 04.5.md',
  );
});

test('rejects an output path outside the repository root without writes', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, contractPath, (contract) => {
    contract.outputs.masterPrompt = '../outside.md';
  });

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root }),
    /path escapes the repository/,
  );
});

test('rejects duplicate output paths without writes', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, contractPath, (contract) => {
    contract.outputs.portablePrompt = contract.outputs.masterPrompt;
  });

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root }),
    /handoff output paths must be unique/,
  );
});

test('rejects output paths assigned to the wrong classification without writes', async (t) => {
  const fixture = await createFixture(t);
  await mutateJson(fixture.root, contractPath, (contract) => {
    const master = contract.outputs.masterPrompt;
    contract.outputs.masterPrompt = contract.outputs.portablePrompt;
    contract.outputs.portablePrompt = master;
  });

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root }),
    /is not classified as the masterPrompt output/,
  );
});

test('two generations produce byte-identical content', async (t) => {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  const first = await outputBytes(fixture.root);

  await generateMilestoneHandoff({ root: fixture.root });
  const second = await outputBytes(fixture.root);

  for (const name of Object.keys(outputPaths)) {
    assert.ok(first[name].equals(second[name]), `${name} changed between generations`);
  }
});

test('keeps frozen outputs stable when live state advances from e56348e to 168f58a', async (t) => {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  const frozenOutputs = await outputBytes(fixture.root, fixture.outputPaths);

  // Production regression: the handoff was frozen at e56348e, then main and
  // docs/_generated/project-state.json legitimately advanced to 168f58a.
  await writeFixtureFile(fixture.root, 'evidence/later-live-change.txt', 'merged\n');
  const laterRevision = commitAll(
    fixture.root,
    'docs: publish deterministic handoff',
  );
  const liveState = await readFixtureJson(fixture.root, statePath);
  liveState.observedDate = '2026-08-06';
  liveState.source = {
    ...liveState.source,
    sha: laterRevision,
    shortSha: laterRevision.slice(0, 7),
    subject: 'docs: publish deterministic handoff',
    committedAt: '2026-08-06T10:00:00-06:00',
    pullRequest: {
      ...liveState.source.pullRequest,
      number: 22,
      title: 'Publish deterministic documentation handoff',
      url: 'https://example.invalid/pull/22',
      mergedAt: '2026-08-06T16:00:00Z',
    },
  };
  liveState.nextAction = deriveNextAction({
    verification: liveState.verification,
    activeMilestone: liveState.milestone,
    pullRequest: liveState.source.pullRequest,
  });
  await writeFixtureJson(fixture.root, statePath, liveState);
  await writeFixtureFile(
    fixture.root,
    canonicalActionPath,
    canonicalActionDocument(liveState),
  );

  await generateMilestoneHandoff({ root: fixture.root, check: true });
  const afterAdvance = await outputBytes(fixture.root, fixture.outputPaths);
  for (const name of Object.keys(frozenOutputs)) {
    assert.ok(
      frozenOutputs[name].equals(afterAdvance[name]),
      `${name} changed after live state advanced`,
    );
  }
});

test('a second generation does not create another historical handoff', async (t) => {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  await generateMilestoneHandoff({ root: fixture.root });

  const handoffs = await readdir(absolute(fixture.root, `${docsRoot}/04 Handoffs`));
  assert.deepEqual(handoffs, ['Hito 04.3 a 04.4.md']);
});

test('check mode accepts LF outputs without writes', async (t) => {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  const before = await snapshotWorkingFiles(fixture.root);

  await generateMilestoneHandoff({ root: fixture.root, check: true });
  const after = await snapshotWorkingFiles(fixture.root);

  assert.deepEqual(after, before);
});

test('check mode accepts CRLF outputs without writes', async (t) => {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  for (const outputPath of Object.values(fixture.outputPaths)) {
    const target = absolute(fixture.root, outputPath);
    const content = await readFile(target, 'utf8');
    await writeFile(target, content.replace(/\n/g, '\r\n'), 'utf8');
  }
  const before = await snapshotWorkingFiles(fixture.root);

  await generateMilestoneHandoff({ root: fixture.root, check: true });
  const after = await snapshotWorkingFiles(fixture.root);

  assert.deepEqual(after, before);
});

test('check mode rejects logical drift after EOL canonicalization without writes', async (t) => {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });
  const target = absolute(fixture.root, fixture.outputPaths.masterPrompt);
  const content = await readFile(target, 'utf8');
  await writeFile(
    target,
    content.replace('Prompt maestro', 'Prompt logically changed').replace(/\n/g, '\r\n'),
    'utf8',
  );

  await assertFailureWithoutWrites(
    fixture.root,
    () => generateMilestoneHandoff({ root: fixture.root, check: true }),
    /generated output is out of date/,
  );
});

test('check mode does not create completely absent output directories', async (t) => {
  const fixture = await createFixture(t);
  const outputDirectories = [...new Set(
    Object.values(fixture.outputPaths).map(
      (outputPath) => path.dirname(absolute(fixture.root, outputPath)),
    ),
  )];

  for (const directory of outputDirectories) {
    await assert.rejects(stat(directory), { code: 'ENOENT' });
  }

  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root, check: true }),
    /generated output is missing/,
  );

  for (const directory of outputDirectories) {
    await assert.rejects(stat(directory), { code: 'ENOENT' });
  }
});

test('check mode detects missing and outdated outputs', async (t) => {
  const fixture = await createFixture(t);
  await generateMilestoneHandoff({ root: fixture.root });

  await rm(absolute(fixture.root, outputPaths.masterPrompt));
  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root, check: true }),
    /generated output is missing/,
  );

  await generateMilestoneHandoff({ root: fixture.root });
  await writeFixtureFile(fixture.root, outputPaths.masterPrompt, 'outdated\n');
  await assert.rejects(
    generateMilestoneHandoff({ root: fixture.root, check: true }),
    /generated output is out of date/,
  );
});
