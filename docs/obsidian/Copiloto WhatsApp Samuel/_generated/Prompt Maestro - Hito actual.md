---
type: generated-milestone-handoff-master-prompt
project: Copiloto WhatsApp Samuel
generated: true
handoff: 4.5-to-4.6
source-revision: f2e64aa0116df32eb5508cbe30adab45c9d6acd3
observed-revision: 03dee83175bc374110b2beef47fb44834a953b07
updated: 2026-08-30
---

# Prompt maestro — Hito 4.6

## Propósito

Continúa el proyecto **Copiloto WhatsApp Samuel** desde el cierre verificable del Hito 4.5 y la activación del Hito 4.6. Trabaja desde las fuentes del repositorio; no sustituyas evidencia por memoria de chat.

## Transición congelada

- Relevo: `4.5-to-4.6`.
- Último hito cerrado: **4.5 — Piloto UX en sombra WhatsApp-first**.
- Hito activo: **4.6 — Piloto real controlado de Edgar**.
- Revisión observada del cierre: `03dee83175bc374110b2beef47fb44834a953b07`.
- Revisión congelada del repositorio: `f2e64aa0116df32eb5508cbe30adab45c9d6acd3`.
- Evidencia configurada del cierre: PR #69, #70, #71, #72, merge `7cdafa081bd307e41a8df558114caa75a082cdf1` y 3 rutas obligatorias.

## Fuentes que debes leer antes de actuar

- `AGENTS.md`.
- `docs/control/milestones.json`.
- `docs/_generated/project-state.json`.
- `docs/control/handoff-state.json`.
- `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first DONE.md`.
- `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.6 - Piloto real controlado de Edgar.md`.
- `docs/control/documentation-policy.json`.
- `docs/obsidian/Copiloto WhatsApp Samuel/_generated/Siguiente accion.md`.

## Cierre documentado del Hito 4.5

> Se validó la experiencia del operador en un piloto WhatsApp-first controlado, con cuentas de prueba dedicadas y aisladas. El piloto no envía mensajes a leads ni reutiliza sesiones, cuentas o datos entre participantes.
>
> ```text
> operador allowlisted
> → cuenta de prueba dedicada enlazada por QR a Evolution aislado
> → datos y leads simulados/controlados
> → revisión humana en sombra
> → cero contacto con leads
> ```
>
> La IA genera candidatos únicamente; NestJS conserva las decisiones y efectos de negocio. El cierre no autoriza el envío a leads.

### Validación final documentada

> - [x] Unitarias exitosas.
> - [x] E2E exitosas.
> - [x] Build exitoso.
> - [x] `test:docs` exitoso.
> - [x] No se introdujeron llamadas a servicios externos, envíos reales ni cambios de infraestructura.

## Alcance activo del Hito 4.6

> Ejecutar un piloto operativo controlado con Edgar como operador de prueba y, después, recorrer la secuencia controlada Edgar → Samuel. El objetivo es obtener evidencia de conexión, recepción y experiencia operativa sin enviar mensajes a leads ni afirmar que la operación real ya fue exitosa.

### Gate técnico documentado

> La implementación del piloto ya está mergeada en `main`. PR #76 y PR #78, con el commit de implementación mergeada `4e6803f`, respaldan la configuración aislada de Edgar, Compose, el webhook receive-only y las pruebas automatizadas. La validación operativa con Edgar y Samuel sigue pendiente y debe ocurrir sólo después de revisar la documentación activa, el alcance aprobado y los invariantes de seguridad.

### Alcance aprobado

> - Preparar y ejecutar una prueba controlada de Edgar con la instancia y cuenta de prueba dedicadas.
> - Confirmar el estado de Docker y Compose, la instancia Evolution, el QR, la conexión, el webhook y la recepción de mensajes de prueba.
> - Confirmar que el flujo permanece receive-only y no persiste mensajes nuevos, actualizaciones, chats, contactos, historial, etiquetas ni leads; tampoco realiza generación de IA ni envío a leads durante la prueba.
> - Repetir la secuencia operativa controlada con Samuel, sin mezclar cuentas, sesiones, espacios de datos o evidencias.
> - Revisar el feedback de Edgar y Samuel y registrar los hallazgos antes de ampliar el alcance.
> - Acordar con Samuel el pago y el alcance posterior antes de tratar el piloto como trabajo comercial ampliado.

## Gate de transición y progreso funcional

- Gate de transición actual: validar y fusionar el relevo documental 4.5 → 4.6.
- Progreso funcional actual del Hito 4.6: **0/4**.
- Primera acción funcional: **4.6-A — Ejecutar la prueba controlada de Edgar**.
- 4.6-A solo puede comenzar después de que el relevo documental post-merge haya sido validado y fusionado.

Mientras este gate siga abierto, la acción actual es validar y fusionar el relevo documental 4.5 → 4.6; no avances a 4.6-A.

## Primera acción funcional condicionada

Esta acción identifica el primer checkpoint funcional, pero permanece bloqueada hasta que se cumpla el gate de transición.

- [ ] En la rama `feature/hito-4-6-controlled-real-pilot`, implementar únicamente el checkpoint **4.6-A: Ejecutar la prueba controlada de Edgar** y sus pruebas, sin ampliar el alcance.

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

## Restricciones específicas del Hito 4.6

> - `sender=false`.
> - `AUTO_SEND_MESSAGES=false`.
> - `noLeadSend=true`: cero envío a leads.
> - Edgar y Samuel son operadores de prueba; no son leads ni destinatarios de mensajes.
> - Las cuentas, sesiones, instancias, identificadores y espacios de datos de Edgar y Samuel permanecen aislados.
> - Evolution no persiste mensajes nuevos, actualizaciones, chats, contactos, historial, etiquetas ni leads; sólo puede persistir estado técnico mínimo de sesión/instancia, aislado y sin payloads operativos.
> - No usar credenciales reales en pruebas automatizadas ni registrar secretos, QR, números completos o payloads reales.
> - No conectar generación de IA ni servicios externos al webhook sin autorización explícita.
> - Detenerse ante cualquier identidad no allowlisted, instancia inesperada, conflicto, dato real no autorizado o estado ambiguo.
>
> No se permite ningún envío a leads.

## Invariantes de ausencia de envío

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- `noLeadSend=true`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.

## Instrucción de arranque

Antes de editar, verifica la rama y el árbol de trabajo, confirma que la revisión congelada pertenece al historial actual y contrasta el primer checkpoint incompleto con el estado observado. Completa primero el gate de transición y no implementes la primera acción funcional hasta que el generador haya sido validado y fusionado. Detente ante cualquier discrepancia de evidencia o alcance.
