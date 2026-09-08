---
type: generated-milestone-handoff-portable-prompt
project: Copiloto WhatsApp Samuel
generated: true
handoff: 4.5-to-4.6
source-revision: f2e64aa0116df32eb5508cbe30adab45c9d6acd3
observed-revision: 03dee83175bc374110b2beef47fb44834a953b07
updated: 2026-08-30
---

# Prompt portátil — Hito 4.6

Continúa **Copiloto WhatsApp Samuel** en la transición `4.5-to-4.6`: el Hito 4.5 está cerrado y el Hito 4.6 está activo.

Antes de editar, lee `AGENTS.md`, `docs/control/handoff-state.json`, `docs/control/milestones.json`, `docs/_generated/project-state.json`, las notas de ambos hitos y `docs/obsidian/Copiloto WhatsApp Samuel/_generated/Siguiente accion.md`. Valida que `03dee83175bc374110b2beef47fb44834a953b07` sea la revisión observada, que su sucesor congelado sea `f2e64aa0116df32eb5508cbe30adab45c9d6acd3`, que exista exactamente un hito activo y que la evidencia obligatoria del cierre siga presente.

## Gate de transición y progreso funcional

- Gate de transición actual: validar y fusionar el relevo documental 4.5 → 4.6.
- Progreso funcional actual del Hito 4.6: **0/4**.
- Primera acción funcional: **4.6-A — Ejecutar la prueba controlada de Edgar**.
- 4.6-A solo puede comenzar después de que el relevo documental post-merge haya sido validado y fusionado.

Mientras este gate siga abierto, la acción actual es validar y fusionar el relevo documental 4.5 → 4.6; no avances a 4.6-A.

## Primera acción funcional condicionada

Esta acción permanece bloqueada hasta que se cumpla el gate de transición.

- [ ] En la rama `feature/hito-4-6-controlled-real-pilot`, implementar únicamente el checkpoint **4.6-A: Ejecutar la prueba controlada de Edgar** y sus pruebas, sin ampliar el alcance.

**Termina cuando:** La evidencia configurada existe, las pruebas relevantes pasan y el diff no conecta envíos ni servicios externos.

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

Respeta el alcance y las reglas de seguridad de `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.6 - Piloto real controlado de Edgar.md`. No inventes información, no uses servicios externos ni credenciales y no avances a la primera acción funcional mientras el gate permanezca abierto.
