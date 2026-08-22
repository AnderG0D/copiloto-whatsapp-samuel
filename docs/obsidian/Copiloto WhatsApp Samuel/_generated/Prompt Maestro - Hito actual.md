---
type: generated-milestone-handoff-master-prompt
project: Copiloto WhatsApp Samuel
generated: true
handoff: 4.4-to-4.5
source-revision: d2a261a2e5666f1e1b7426f3b6ce6e15b0b96b1f
observed-revision: 87551063e42888a71e29f57f568806da6719f562
updated: 2026-08-22
---

# Prompt maestro — Hito 4.5

## Propósito

Continúa el proyecto **Copiloto WhatsApp Samuel** desde el cierre verificable del Hito 4.4 y la activación del Hito 4.5. Trabaja desde las fuentes del repositorio; no sustituyas evidencia por memoria de chat.

## Transición congelada

- Relevo: `4.4-to-4.5`.
- Último hito cerrado: **4.4 — Revisión y aprobación humana**.
- Hito activo: **4.5 — Piloto UX en sombra WhatsApp-first**.
- Revisión observada del cierre: `87551063e42888a71e29f57f568806da6719f562`.
- Revisión congelada del repositorio: `d2a261a2e5666f1e1b7426f3b6ce6e15b0b96b1f`.
- Evidencia configurada del cierre: PR #26, #29, #32, #34, merge `a84206b483830bf84b5af055fe4f3a815143352f` y 3 rutas obligatorias.

## Fuentes que debes leer antes de actuar

- `AGENTS.md`.
- `docs/control/milestones.json`.
- `docs/_generated/project-state.json`.
- `docs/control/handoff-state.json`.
- `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.4 - Revision y aprobacion humana DONE.md`.
- `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first.md`.
- `docs/control/documentation-policy.json`.
- `docs/obsidian/Copiloto WhatsApp Samuel/_generated/Siguiente accion.md`.

## Cierre documentado del Hito 4.4

> Permitir que un operador autenticado revise un borrador `PROPOSED`, lo apruebe sin cambios, lo edite y apruebe, o lo rechace; registrar la decisión de manera auditable y mantener completamente desactivado el envío a WhatsApp.

### Validación final documentada

> - **Unitarias:** 163 casos aprobados.
> - **E2E:** 6 casos aprobados.
> - **Build:** aprobado.
> - **`AUTO_SEND_MESSAGES`:** `false`.
> - **`sender`:** `false`.
> - No se realizaron envíos reales ni llamadas externas reales desde las pruebas.

## Alcance activo del Hito 4.5

> Validar la experiencia del operador en un piloto WhatsApp-first controlado, con cuentas de prueba dedicadas y aisladas, sin enviar mensajes a leads ni reutilizar sesiones, cuentas o datos entre participantes.

### Gate técnico documentado

> Antes de iniciar 4.5-A debe completarse y fusionarse la promoción documental 4.4 → 4.5. La promoción debe conservar `observedRevision` y `frozenRevision`, y fusionarse mediante **Create a merge commit**.
>
> - `sender=false` y `AUTO_SEND_MESSAGES=false` deben conservarse.
> - No se permite ningún envío a leads.
> - Este gate no implementa todavía el piloto funcional ni modifica `agent-core`.
> &lt;!-- AUTO:END technical-gate -->

### Alcance aprobado

> ### 4.5-A — Configuración local del piloto
>
> - Configuración local de piloto, sin migración de base de datos.
> - Instancias de Evolution aisladas para cada piloto.
> - Allowlist explícita de operadores.
> - Cuentas de WhatsApp de prueba dedicadas, enlazadas mediante QR.
> - Datos y leads simulados o controlados por piloto.
>
> ### 4.5-B — Canal de WhatsApp limitado a operadores
>
> Solo después de 4.5-A podrá implementarse un canal de WhatsApp estrictamente limitado a los operadores allowlisted. Este canal no autoriza mensajes a leads ni reutilización de sesiones, cuentas o datos fuera del piloto correspondiente.

## Gate de transición y progreso funcional

- Gate de transición actual: validar y fusionar el relevo documental 4.4 → 4.5.
- Progreso funcional actual del Hito 4.5: **0/2**.
- Primera acción funcional: **4.5-A — Preparar el piloto local aislado**.
- 4.5-A solo puede comenzar después de que el relevo documental post-merge haya sido validado y fusionado.

Mientras este gate siga abierto, la acción actual es validar y fusionar el relevo documental 4.4 → 4.5; no avances a 4.5-A.

## Primera acción funcional condicionada

Esta acción identifica el primer checkpoint funcional, pero permanece bloqueada hasta que se cumpla el gate de transición.

- [ ] En la rama `feature/hito-4-5-shadow-whatsapp-first`, implementar únicamente el checkpoint **4.5-A: Preparar el piloto local aislado** y sus pruebas, sin ampliar el alcance.

**Commit sugerido:** `feat: configure isolated shadow pilot allowlists`

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
> - Automated documentation may replace only complete files classified as `generated` or content inside matching `&lt;!-- AUTO:BEGIN name -->` and `&lt;!-- AUTO:END name -->` markers in `mixed` files.
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

## Restricciones específicas del Hito 4.5

> - No se permite ningún envío a leads.
> - No se conectan cuentas, sesiones, datos ni leads reales entre pilotos.
> - La allowlist debe evaluarse antes de procesar el canal de operador.
> - Los proveedores de IA solo generan candidatos; no ejecutan efectos de negocio.
> - NestJS conserva el control de permisos, estado, reglas de negocio y corte de seguridad.
> - Las pruebas no usan credenciales reales ni contactan Evolution, WhatsApp, Gemini, Groq o Supabase.
> - No se aplican migraciones ni cambios de infraestructura remota dentro de este hito sin autorización explícita.

## Invariantes de ausencia de envío

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- `noLeadSend=true`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.

## Instrucción de arranque

Antes de editar, verifica la rama y el árbol de trabajo, confirma que la revisión congelada pertenece al historial actual y contrasta el primer checkpoint incompleto con el estado observado. Completa primero el gate de transición y no implementes la primera acción funcional hasta que el generador haya sido validado y fusionado. Detente ante cualquier discrepancia de evidencia o alcance.
