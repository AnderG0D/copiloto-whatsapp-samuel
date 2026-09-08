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
- `docs/control/hito-4.6-runtime-evidence.json`.
- `docs/control/hito-4.6-admin-read-contract-evidence.json`.

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

> Ejecutar un piloto operativo controlado con Edgar como operador de prueba y,
> después, recorrer la secuencia controlada Edgar → Samuel. El objetivo es
> obtener evidencia de conexión, recepción, persistencia, scoring, contexto,
> generación de borradores y experiencia operativa sin enviar mensajes a leads ni
> afirmar que la operación comercial real ya fue exitosa.

### Gate técnico documentado

> La implementación del piloto ya está mergeada en `main`. PR #76 y PR #78, con el commit de implementación mergeada `4e6803f`, respaldan la configuración aislada de Edgar, Compose, el webhook receive-only y las pruebas automatizadas. La validación operativa con Edgar y Samuel sigue pendiente y debe ocurrir sólo después de revisar la documentación activa, el alcance aprobado y los invariantes de seguridad.

### Alcance aprobado

> - Preparar y ejecutar una prueba controlada de Edgar con la instancia y cuenta de prueba dedicadas.
> - Confirmar el estado de Docker y Compose, la instancia Evolution, el QR, la conexión, el webhook y la recepción de mensajes de prueba.
> - Confirmar que el flujo permanece receive-only respecto a los mensajes salientes
>   a leads. La validación técnica aislada puede persistir el mensaje entrante,
>   scoring, contexto y `response_drafts.PROPOSED`; no puede enviar respuestas a
>   leads.
> - Confirmar que la generación con Gemini y la persistencia del borrador ocurren
>   únicamente dentro del backend autorizado y con contexto seguro.
> - Confirmar que el preview opcional, si se habilita, se dirige únicamente al
>   canal autorizado del operador y no a la lead.
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
> - Codex is the executor for repository work; the active prompt defines the concrete checkpoint and its allowed scope.
> - Do not touch files outside that checkpoint without explicit authorization.
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
> - `NO_LEAD_SEND=true`: cero envío a leads.
> - Edgar y Samuel son operadores de prueba; no son leads ni destinatarios de mensajes.
> - Las cuentas, sesiones, instancias, identificadores y espacios de datos de Edgar y Samuel permanecen aislados.
> - El runtime puede persistir mensajes de prueba, scoring, contexto y borradores
>   `PROPOSED` de forma aislada; no debe producir persistencia ni efectos
>   operativos hacia leads o contactos externos.
> - No usar credenciales reales en pruebas automatizadas ni registrar secretos, QR, números completos o payloads reales.
> - La generación con Gemini forma parte del pipeline técnico autorizado y debe
>   permanecer limitada a contexto seguro, persistencia de `PROPOSED` y ausencia
>   de efectos de envío. No conectar proveedores ni efectos adicionales sin
>   autorización explícita.
> - Detenerse ante cualquier identidad no allowlisted, instancia inesperada, conflicto, dato real no autorizado o estado ambiguo.
>
> No se permite ningún envío a leads.

## Invariantes de ausencia de envío

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- `noLeadSend=true`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.

## Panel administrativo same-origin

Fuente FD-EVIDENCIA-01: `docs/control/hito-4.6-runtime-evidence.json`.

| Dato | Resultado |
| --- | --- |
| Panel | `/admin/panel` |
| Estado | `PASS_WITH_WARNINGS` |
| Autenticación | ADMIN_WEB_PASSWORD_HASH mediante node:crypto/scrypt |
| Sesión | Sesión firmada en cookie HttpOnly |
| Cookie | Secure y SameSite=Strict |
| CSRF | Obligatorio |
| Autorización | Autorización por negocio preservada |
| CORS | Restringido al ADMIN_WEB_ORIGIN HTTPS exacto |
| ADMIN_REVIEW_TOKEN | No aceptado por los endpoints administrativos |

### Capacidades verificadas

- login/logout.
- Listado paginado de drafts PROPOSED.
- Detalle con máximo 10 mensajes de contexto.
- Aprobar, editar/aprobar y rechazar.
- Cliente: `credentials: 'include'`.
- Seguridad del navegador: Ausencia de Bearer, secretos y almacenamiento web; renderizado seguro con textContent.

### Observaciones

- 65 pruebas administrativas PASS.
- 2 pruebas de lectura de response drafts PASS.
- 261 pruebas unitarias PASS.
- 6 pruebas e2e PASS.
- npm run build PASS.
- git diff --check PASS.
- Verificación local mediante pruebas Nest.
- Uso productivo en navegador pendiente de HTTPS productivo; la verificación local se realizó mediante el proxy HTTPS de desarrollo https://localhost:3443 y el login local funcionó.
- No hubo cambios en .env.
- No hubo migraciones remotas, Evolution, servicios externos, mensajes WhatsApp ni envíos a leads; Supabase local de QA sí se levantó mediante Docker y fue detenido después de las pruebas.
- Las migraciones 20260807020218_create_response_draft_decisions.sql y 20260903090000_enable_response_draft_review_transitions.sql se aplicaron únicamente a Supabase local de QA.
- No se modificó receive-only.

- Riesgo pendiente: La comprobación HTTPS fue exclusivamente local y mostró la advertencia Not secure del certificado de desarrollo; no demuestra HTTPS productivo, disponibilidad pública, despliegue ni integración con servicios externos.
- Siguiente checkpoint: Mantener la evidencia local aislada y solicitar autorización explícita antes de cualquier despliegue, validación HTTPS productiva, servicio externo o envío.
- Autorización requerida: Autorización explícita para cualquier despliegue, validación HTTPS productiva, servicios externos o envío de mensajes.

## Checkpoint manual de verificación HTTPS local del panel

- Identificador: `manual-admin-panel-https-local`.
- Estado: `PASS_WITH_WARNINGS`.

### Clasificación

| Área | Estado |
| --- | --- |
| Bandeja del panel | `PASS` |
| Detalle del panel | `PASS` |
| Acciones de revisión | `NOT_RUN` |
| Envíos a leads | `NOT_RUN` (prohibidos en este alcance) |
| Producción y servicios externos | `NOT_RUN` |
| HTTPS productivo | `NOT_RUN` |

### Entorno local aislado

- Supabase: Instancia local usada únicamente para QA.
- Migraciones aplicadas solo localmente: `20260807020218_create_response_draft_decisions.sql`, `20260903090000_enable_response_draft_review_transitions.sql`.
- Producción o base remota tocada: `NO`.
- Arranque de `agent-core` contra Supabase local: `PASS`.
- Rutas administrativas registradas: `YES`.
- Proxy HTTPS local: https://localhost:3443 hacia http://localhost:3000.

### Fixture sintético aislado

- Archivos: `scripts/qa/fixtures/local-panel-fixture.sql` y `scripts/qa/fixtures/local-panel-fixture.cleanup.sql`.
- UUIDs sintéticos: negocio `00000000-0000-4000-8000-000000000001`, lead `00000000-0000-4000-8000-000000000002`, mensajes `00000000-0000-4000-8000-000000000003` y `00000000-0000-4000-8000-000000000004`, draft `00000000-0000-4000-8000-000000000005`.
- Draft observado: `PROPOSED`; decisiones existentes: `0`.
- Verificado en base local: `YES`; fixture limpiado: `YES`.
- Limpieza: `1` draft, `2` mensajes, `1` lead y `1` negocio sintéticos.

### Hechos comprobados

- /admin/panel cargó mediante https://localhost:3443 a través del proxy HTTPS local hacia http://localhost:3000.
- El login con sesión web local funcionó.
- La bandeja mostró el draft sintético PROPOSED.
- El detalle mostró el texto del borrador, el mensaje de origen, contexto de 2 mensajes, fechas y estado.
- Las acciones Aprobar, Editar y aprobar y Rechazar fueron visibles y no se ejecutó ninguna.
- El fixture se verificó en la base local y se limpió correctamente: 1 draft, 2 mensajes, 1 lead y 1 negocio sintéticos.
- No se enviaron mensajes a leads, WhatsApp ni Evolution.

### Advertencias

- La validación fue únicamente local; no hubo despliegue, disponibilidad pública ni prueba en un dominio HTTPS productivo.
- El aviso Not secure corresponde al certificado local del proxy y no debe presentarse como HTTPS productivo.
- Se mantuvieron SENDER=false, AUTO_SEND_MESSAGES=false y NO_LEAD_SEND=true.
- No se enviaron mensajes de WhatsApp ni a leads.
- Las únicas migraciones aplicadas fueron las dos indicadas, exclusivamente en Supabase local de QA; no se tocó producción ni una base remota.
- No se modificó .env.
- No se conectó Evolution ni otro servicio externo; Supabase local de QA sí se levantó mediante Docker y luego se detuvo.
- Se mantuvieron SENDER=false, AUTO_SEND_MESSAGES=false, NO_LEAD_SEND=true y receive-only; no hubo envíos automáticos ni manuales.

## Checkpoint local de acciones de revisión

- Identificador: `manual-admin-review-actions-local`.
- Estado general: `PASS_WITH_WARNINGS`.
- Alcance: Prueba exclusivamente local con datos sintéticos y UUID v4; sin producción, servicios externos, Evolution, WhatsApp, envíos a leads ni acciones sobre leads reales.
- Entorno: Supabase local y navegador mediante panel web local; Supabase local fue detenido después de la prueba.

### Clasificación

| Área | Estado |
| --- | --- |
| Acciones administrativas locales | `PASS` |
| Persistencia de APPROVE | `PASS` |
| Persistencia de EDIT_AND_APPROVE | `PASS` |
| Persistencia de REJECT | `PASS` |
| Envíos a leads | `NOT_RUN` |
| Producción | `NOT_RUN` |
| HTTPS productivo | `NOT_RUN` |
| Integración real con WhatsApp/Evolution | `NOT_RUN` |

### Invariantes de seguridad

- `SENDER=false`.
- `AUTO_SEND_MESSAGES=false`.
- `NO_LEAD_SEND=true`.
- No hubo envíos a leads ni acciones sobre leads reales.

### Acciones confirmadas

| Draft | Estado final | Decisión | final_text persistido | Longitud observada |
| --- | --- | --- | --- | --- |
| `00000000-0000-4000-8000-000000000005` | `APPROVED` | `APPROVE` | no | — |
| `00000000-0000-4000-8000-000000000008` | `APPROVED` | `EDIT_AND_APPROVE` | sí | 136 |
| `00000000-0000-4000-8000-000000000009` | `REJECTED` | `REJECT` | no | — |

### Fixtures y cleanup

- Fixtures usados: `scripts/qa/fixtures/local-panel-fixture.sql`, `scripts/qa/fixtures/local-panel-fixture.cleanup.sql`, `scripts/qa/fixtures/local-review-actions-fixture.sql`, `scripts/qa/fixtures/local-review-actions-fixture.cleanup.sql`.
- Cleanup del fixture de revisión: `NOT_RUN`; El script aborta de forma segura porque existen decisiones y no debe borrar historial.
- Supabase local detenido después de la prueba: `YES`.
- No se afirma que el volumen local haya sido eliminado.

### Observaciones manuales

- Login web local exitoso.
- La bandeja y el detalle cargaron correctamente.
- Se probó aprobar, editar y aprobar con texto sintético y rechazar.
- Las tarjetas procesadas dejaron de aparecer en la bandeja PROPOSED.
- No se ejecutaron envíos ni acciones sobre leads reales.

### Advertencias

- La validación fue local y manual.
- El proxy HTTPS local mostró advertencia de certificado/no seguridad del navegador.
- Esto no es validación de HTTPS productivo, despliegue ni producción.
- No documentar contraseñas, hashes, claves, URLs de conexión ni valores de variables.

## Contrato administrativo de lectura aprobado

Fuente FD-EVIDENCIA-01: `docs/control/hito-4.6-admin-read-contract-evidence.json`.

| Dato | Resultado |
| --- | --- |
| Evidencia documental | `PASS_WITH_WARNINGS` |
| Diseño aprobado | sí |
| Implementación autorizada | no |
| Frontend | `NOT_CREATED` |
| Endpoints GET | `NOT_IMPLEMENTED` |
| Autenticación web | `NOT_IMPLEMENTED` |
| Migración local de transición | `NOT_VERIFIED` |

- Contrato canónico: `docs/obsidian/Copiloto WhatsApp Samuel/04 Docs/Contrato administrativo de lectura y autenticacion del panel interno.md`.
- El contrato administrativo de lectura y el modelo provisional de autenticación fueron aprobados documentalmente. No se creó frontend, rutas GET, autenticación web, CORS, BFF/proxy, migraciones ni cambios runtime.
- Advertencias: La migración local de transición permanece NOT_VERIFIED. La identidad real, membresías y SSO siguen fuera de alcance. La implementación requiere un checkpoint posterior con autorización explícita.
- Runtime: receive-only=`true`, envíos a leads=`0`, cambios runtime=`false`.
- Siguiente checkpoint: Implementar únicamente después de revisar nuevamente este diseño documentado y obtener autorización explícita.

## Instrucción de arranque

Antes de editar, verifica la rama y el árbol de trabajo, confirma que la revisión congelada pertenece al historial actual y contrasta el primer checkpoint incompleto con el estado observado. Completa primero el gate de transición y no implementes la primera acción funcional hasta que el generador haya sido validado y fusionado. Detente ante cualquier discrepancia de evidencia o alcance.
