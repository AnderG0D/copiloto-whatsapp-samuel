---
type: generated-milestone-handoff-master-prompt
project: Copiloto WhatsApp Samuel
generated: true
handoff: 4.3-to-4.4
source-revision: cfbde5fbf7a8db27c3b595cb2e17bdc11529d6e8
observed-revision: e56348e7a590a12ceb937eda7783122fb22d1f91
updated: 2026-08-04
---

# Prompt maestro — Hito 4.4

## Propósito

Continúa el proyecto **Copiloto WhatsApp Samuel** desde el cierre verificable del Hito 4.3 y la activación del Hito 4.4. Trabaja desde las fuentes del repositorio; no sustituyas evidencia por memoria de chat.

## Transición congelada

- Relevo: `4.3-to-4.4`.
- Último hito cerrado: **4.3 — Persistencia e integración de borradores sin envío**.
- Hito activo: **4.4 — Revisión y aprobación humana**.
- Revisión observada del cierre: `e56348e7a590a12ceb937eda7783122fb22d1f91`.
- Revisión congelada del repositorio: `cfbde5fbf7a8db27c3b595cb2e17bdc11529d6e8`.
- Evidencia configurada del cierre: PR #15, #16, #18, #19, merge `a6c5ab4ea594af7a1e097090d22495ef71bc6b32` y 6 rutas obligatorias.

## Fuentes que debes leer antes de actuar

- `AGENTS.md`.
- `docs/control/milestones.json`.
- `docs/_generated/project-state.json`.
- `docs/control/handoff-state.json`.
- `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.3 - Persistencia e integracion de borradores sin envio DONE.md`.
- `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.4 - Revision y aprobacion humana ACTIVE.md`.
- `docs/control/documentation-policy.json`.
- `docs/obsidian/Copiloto WhatsApp Samuel/_generated/Siguiente accion.md`.

## Cierre documentado del Hito 4.3

> Persistir de forma trazable los borradores `PROPOSED` e integrarlos al flujo entrante después del scoring, manteniendo `AUTO_SEND_MESSAGES=false`.

### Validación final documentada

> - **Unitarias:** 82/82 aprobadas.
> - **E2E:** 1/1 aprobada.
> - **Build:** aprobado.
> - **Documentación automática:** aprobada.
> - **Envío automático:** desactivado.
> - **`AUTO_SEND_MESSAGES`:** `false`.
> - **`sender`:** `false`.

## Alcance activo del Hito 4.4

> Permitir que un operador autenticado revise un borrador `PROPOSED`, lo apruebe sin cambios, lo edite y apruebe, o lo rechace; registrar la decisión de manera auditable y mantener completamente desactivado el envío a WhatsApp.

### Gate técnico documentado

> Antes de comenzar técnicamente 4.4-A se implementará, en un PR independiente, el sistema determinista de relevo automático entre hitos.
>
> Este gate:
>
> - no forma parte de los checkpoints funcionales 4.4-A a 4.4-D;
> - no modifica `agent-core/`;
> - no implementa revisión humana;
> - debe quedar fusionado y demostrar idempotencia antes de iniciar 4.4-A.

### Alcance aprobado

> - Persistencia auditable de decisiones humanas.
> - Consulta y revisión de borradores pendientes.
> - Aprobar sin cambios.
> - Editar y aprobar.
> - Rechazar.
> - Identidad del operador derivada de autenticación confiable.
> - API administrativa interna en NestJS.
> - Pruebas de transiciones, idempotencia y ausencia de envío.
> - `AUTO_SEND_MESSAGES=false` durante todo el hito.
>
> El diseño exacto de persistencia para 4.4-A todavía no está fijado. Primero se inspeccionará el esquema real y se comparará extender `response_drafts` contra una entidad separada de revisiones o decisiones.

## Gate de transición y progreso funcional

- Gate de transición actual: integrar y validar el generador determinista.
- Progreso funcional actual del Hito 4.4: **0/4**.
- Primera acción funcional: **4.4-A — Persistencia auditable de decisiones humanas**.
- 4.4-A solo puede comenzar después de que el gate del generador haya sido validado y fusionado.

Mientras este gate siga abierto, la acción actual es integrar y validar el generador determinista; no avances a 4.4-A.

## Primera acción funcional condicionada

Esta acción identifica el primer checkpoint funcional, pero permanece bloqueada hasta que se cumpla el gate de transición.

- [ ] En la rama `feature/hito-4-4-human-review`, implementar únicamente el checkpoint **4.4-A: Persistencia auditable de decisiones humanas** y sus pruebas, sin ampliar el alcance.

**Commit sugerido:** `feat: persist auditable response draft decisions`

**Termina cuando:** La evidencia configurada existe, las pruebas relevantes pasan y el diff no conecta envíos ni servicios externos.

## Reglas vigentes extraídas de AGENTS.md

### Arquitectura

> - The main flow is WhatsApp -> Evolution API -> NestJS -> Supabase.
> - AI providers must implement the provider-neutral `AiProvider` contract.
> - Gemini is the initial primary provider. Groq is complementary or may be used as a fallback.
> - Provider implementations must remain independently testable and replaceable.
> - AI providers generate candidate output only. They must not perform business side effects.
> - NestJS controls inventory, prices, files, permissions, business rules, conversation state and human handoff.
> - Never invent inventory, prices, vehicle details, files, permissions or business information that is not provided by a trusted application source.

### Seguridad y privacidad

> - Never open, print, edit or commit the contents of `.env`.
> - Never expose or commit credentials, API keys, tokens, personal data, customer data or raw customer payloads.
> - `.env.example` may be updated only with safe placeholders when configuration documentation is required.
> - Keep `AUTO_SEND_MESSAGES=false` during development.
> - Never send real WhatsApp messages unless the task explicitly authorizes the exact action.
> - Do not connect AI generation to the Evolution webhook without explicit approval.
> - Unit and e2e tests must use mocks, fakes or documented dummy values.
> - Tests must not call Gemini, Groq, Supabase, Evolution API or other external services with real credentials.
> - Do not run destructive Git, Docker or Supabase commands without explicit authorization.
> - Do not apply database migrations or modify remote infrastructure unless the task explicitly requires it.

### Flujo de ingeniería

> - Before editing, inspect the current branch and working tree with:
>   - `git branch --show-current`
>   - `git status --short --branch`
> - Read the relevant files and the closest applicable `AGENTS.md` before making changes.
> - Keep each change scoped to one small, reviewable result.
> - Do not refactor unrelated modules.
> - Preserve existing architecture unless the task explicitly authorizes an architectural change.
> - Add or update tests for behavior changes.
> - Mock AI SDK clients in unit tests. Do not make real model requests during automated tests.
> - Before adding a dependency, confirm why it is needed and limit changes to the relevant manifest and lockfile.
> - Review the complete diff before declaring the task complete.
> - Do not commit, push, open a pull request or merge unless the task explicitly requests it.
> - The `npm run lint` script applies automatic fixes. If it is used, inspect every resulting change before keeping it.

### Gobierno documental

> - The repository copy under `docs/obsidian/Copiloto WhatsApp Samuel/` is the source of truth for project documentation.
> - Follow `docs/control/documentation-policy.json` when changing project notes.
> - Treat `03 Decisions/` as human-owned. Never create, accept, supersede or rewrite an ADR automatically.
> - Treat `90 Archive/` as immutable history. Do not modernize old examples, model names, branches or conversations there.
> - Do not change product vision, milestone scope, acceptance criteria or roadmap order unless Hiram explicitly approves that decision.
> - Automated documentation may replace only complete files classified as `generated` or content inside matching `<!-- AUTO:BEGIN name -->` and `<!-- AUTO:END name -->` markers in `mixed` files.
> - Never perform a global search-and-replace for providers, models, milestone states or PR numbers.
> - Derive code, dependency, module, model, commit, PR and CI facts from the repository and GitHub. Do not infer them from chat memory.
> - Do not mark a milestone `DONE` unless its configured acceptance evidence, merge state and required checks are verifiably complete.
> - Technology reviews create recommendations only. They must not change dependencies, model defaults, ADRs or roadmap items automatically.
> - Keep exactly one canonical next action in `_generated/Siguiente accion.md`; other Obsidian panels must transclude it instead of copying it.

### Validación

> For backend code or dependency changes, run from `agent-core/`:
>
> ```bash
> npm test -- --runInBand
> npm run test:e2e -- --runInBand
> npm run build
> ```
>
> - Use only documented dummy environment values when the e2e baseline requires configuration.
> - Never load real credentials merely to make a test pass.
> - Do not claim a validation passed unless the command was actually executed successfully.
> - If a command cannot run, report the exact command, failure and remaining unverified risk.
> - For documentation-only changes, tests and build may be skipped when clearly reported as not applicable.
> - For documentation automation changes, run `npm run docs:check` from the repository root once that script is available.

## Restricciones específicas del Hito 4.4

> - La IA propone; NestJS controla; el humano decide.
> - Aprobar todavía no envía.
> - No confiar en `operatorId`, correo, rol o identidad enviada por el body.
> - No enviar WhatsApps reales.
> - No agregar ni activar rutas de envío.
> - No aplicar migraciones remotas sin autorización explícita.
> - Las pruebas deben usar mocks, fakes o datos ficticios.
> - No realizar llamadas reales a Gemini, Supabase, Evolution API u otros servicios.
> - Conservar aislamiento por negocio.
> - Mantener `AUTO_SEND_MESSAGES=false`.
> - Mantener `sender=false` hasta que exista un hito futuro que autorice envío.

## Invariantes de ausencia de envío

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.

## Instrucción de arranque

Antes de editar, verifica la rama y el árbol de trabajo, confirma que la revisión congelada pertenece al historial actual y contrasta el primer checkpoint incompleto con el estado observado. Completa primero el gate de transición y no implementes la primera acción funcional hasta que el generador haya sido validado y fusionado. Detente ante cualquier discrepancia de evidencia o alcance.
