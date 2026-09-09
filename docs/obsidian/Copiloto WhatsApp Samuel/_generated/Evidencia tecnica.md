---
type: generated-technical-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-09-08
---

# Evidencia técnica

<!-- AUTO:BEGIN technical-evidence -->
## Revisión observada

- Fuente: `main` en `c4f3a79`, asociado al [PR #96](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/96).
- Commit completo: `c4f3a798cb95f73c5f34a1e3087bf1778891f978`.
- Mensaje: Merge pull request #96 from AnderG0D/feature/mvp-demo-authorized-flow.
- Ejecución de CI: [abrir evidencia](https://github.com/AnderG0D/copiloto-whatsapp-samuel/actions/runs/34305820473).

## Validación

- **Unitarias:** `APROBADO` — 272 casos ejecutados.
- **E2E:** `APROBADO` — 6 casos ejecutados.
- **Build:** `APROBADO` — compilación del backend.

## Backend

- Node.js: 22 (GitHub Actions).
- NestJS: `^11.0.1`.
- `@google/genai`: `^2.15.0`.
- `@supabase/supabase-js`: `^2.108.2`.

## Módulos detectados

- `AppModule` — `agent-core/src/app.module.ts`.
- `EvolutionWebhookModule` — `agent-core/src/webhooks/evolution/evolution-webhook.module.ts`.
- `LeadsModule` — `agent-core/src/leads/leads.module.ts`.
- `ResponseDraftModule` — `agent-core/src/ai/response-drafts/response-draft.module.ts`.
- `ResponseDraftReviewModule` — `agent-core/src/admin/response-drafts/response-draft-review.module.ts`.
- `ShadowOnlyModule` — `agent-core/src/shadow-pilot/shadow-only.module.ts`.
- `ShadowPilotModule` — `agent-core/src/shadow-pilot/shadow-pilot.module.ts`.
- `SupabaseModule` — `agent-core/src/supabase/supabase.module.ts`.

## Migraciones detectadas

- `supabase/migrations/20260713050133_initial_remote_schema.sql`
- `supabase/migrations/20260713052850_add_lead_scoring_columns.sql`
- `supabase/migrations/20260802111346_create_response_drafts.sql`
- `supabase/migrations/20260807020218_create_response_draft_decisions.sql`
- `supabase/migrations/20260903090000_enable_response_draft_review_transitions.sql`
- `supabase/migrations/20260908090000_create_authorized_leads.sql`

## Panel administrativo same-origin

- Fuente FD-EVIDENCIA-01: `docs/control/hito-4.6-runtime-evidence.json`.
- Estado: `PASS_WITH_WARNINGS`.
- Ruta: `/admin/panel`.
- Autenticación: ADMIN_WEB_PASSWORD_HASH mediante node:crypto/scrypt.
- Sesión: Sesión firmada en cookie HttpOnly; cookie Secure y SameSite=Strict.
- CSRF: Obligatorio.
- Autorización por negocio preservada.
- CORS: Restringido al ADMIN_WEB_ORIGIN HTTPS exacto.
- `ADMIN_REVIEW_TOKEN`: no aceptado por los endpoints administrativos.

## Capacidades verificadas

- login/logout.
- Listado paginado de drafts PROPOSED.
- Detalle con máximo 10 mensajes de contexto.
- Aprobar, editar/aprobar y rechazar.
- Cliente: `credentials: 'include'`.
- Seguridad del navegador: Ausencia de Bearer, secretos y almacenamiento web; renderizado seguro con textContent.

## Observaciones

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

- Riesgo pendiente: La comprobación HTTPS fue exclusivamente local y mostró la advertencia Not secure del certificado de desarrollo; no demuestra HTTPS productivo, disponibilidad pública, despliegue ni integración con servicios externos.
- Siguiente checkpoint: Mantener la evidencia local aislada y solicitar autorización explícita antes de cualquier despliegue, validación HTTPS productiva, servicio externo o envío.
- Autorización requerida: Autorización explícita para cualquier despliegue, validación HTTPS productiva, servicios externos o envío de mensajes.
<!-- AUTO:END technical-evidence -->
