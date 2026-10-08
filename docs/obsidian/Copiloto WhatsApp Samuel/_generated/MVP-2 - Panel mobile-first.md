---
type: generated-mvp-2-mobile-first-panel-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-10-07
---

# MVP-2 — Panel mobile-first

<!-- AUTO:BEGIN mvp-2-mobile-first-panel -->
## Estado del checkpoint

- Estado: `PASS_WITH_WARNINGS`; validación exclusivamente local, no operativa.
- Fuente FD-EVIDENCIA-01: `docs/control/mvp-2-mobile-first-panel-evidence.json`.
- Base observada: rama `feature/mvp-demo-authorized-flow`, commit `697653850247da2737e944b5b5391ab1ad315e46`.

## Diseño mobile-first

| Área | Observación |
| --- | --- |
| defaultLayout | Una columna por defecto. |
| mobileDetail | Detalle móvil apilado con navegación Volver. |
| touchTargets | Botones, inputs y select con mínimo de 46 px. |
| safeArea | safe-area-inset-bottom en scroll, barra de acciones y confirmación. |
| stickyActions | Barra de acciones sticky al fondo del detalle. |
| wideLayout | Layout de dos columnas desde @media(min-width:780px). |
| horizontalOverflow | body con overflow-x:hidden y contenido con overflow-wrap:anywhere. |
| keyboardEditor | Textarea adaptable: altura automática y scrollIntoView para acompañar el teclado. |
| states | Estados de carga, vacío, éxito y error explícitos. |
| rejectConfirmation | REJECT requiere confirmación visible antes de ejecutar. |
| httpErrors | Mensajes específicos para 400, 401, 403 y 409. |

## Comportamiento y seguridad del panel

- **reviewRoutes:** APPROVE, EDIT_AND_APPROVE y REJECT publican únicamente en /admin/businesses/{businessId}/response-drafts/{draftId}/reviews.
- **pagination:** La paginación usa cursor, acumula páginas y deduplica por id con appendUnique.
- **safeRendering:** Los valores externos se crean y renderizan con APIs seguras como textContent; no se usa innerHTML.
- **browserCredentials:** No hay Bearer tokens, localStorage ni sessionStorage.
- **session:** Se preservan sesión autenticada mediante cookies HttpOnly, credentials: include y protección CSRF.

## Fix de preservación de texto

- **pageFunction:** preserveEditorText() captura el valor actual del textarea o del estado en memoria.
- **helper:** preserveDraftEditorText() devuelve { draftId, text } cuando existe un draft activo.
- **sameDraftRestoration:** resolveDraftEditorText() restaura el texto preservado únicamente cuando preservedText.draftId coincide con el draft solicitado.
- **draftIsolation:** El texto de un draft no se reutiliza en otro draft.
- **unauthorizedResponse:** El texto editado se preserva antes de mostrar login cuando la revisión devuelve 401.
- **successfulReviewCleanup:** Después de una revisión exitosa se limpia el estado preservado con clearPreservedDraftEditorText().

## Validación separada

### Base MVP-2

- Suites focalizadas: PASS — 7 suites focalizadas, 97 tests.
- Suites unitarias: PASS — 24 suites unitarias, 269 tests.
- E2E: PASS — 1 suite E2E, 6 tests.
- Build: PASS.

### Validación posterior al fix

- Suite focalizada: PASS — 1 suite focalizada, 6 tests.
- Build: PASS.
- `git diff --check`: PASS_WITH_WARNINGS — avisos CRLF preexistentes.
- Suite completa repetida después del fix: `NOT_RUN — no se afirma que la suite completa haya sido repetida después del último fix`.

Las pruebas dinámicas posteriores cubren el helper y el contrato de preservación: asociación por draftId, restauración del mismo draft, aislamiento entre drafts, preservación ante 401 y limpieza después del éxito.

- Navegador real: `NOT_RUN — no existe todavía una prueba real de navegador.`.
- Viewport móvil, teclado, sticky scrolling y clicks: `NOT_RUN — viewport móvil, teclado, sticky scrolling y clicks no fueron validados con navegador real.`.
- CSP antes de producción: `UNKNOWN — CSP queda pendiente de verificación antes de producción.`.

## Límites e invariantes

- No existe sender.
- No existe outbox.
- No existe envío real.
- No existe automatización.
- No existe allowlist administrativa individual.
- No se probaron números reales.
- MVP-1 y sus cambios de allowlist de leads autorizados son trabajo separado y permanecen documentados en MVP-1 — Leads autorizados.

- `SENDER=false`.
- `AUTO_SEND_MESSAGES=false`.
- `NO_LEAD_SEND=true`.
- Servicios/runtime iniciados: `NO`; servicios externos usados: `NO`.
- Números reales: `NO`; secretos: `NO`; mensajes enviados: `NO`.
- Runtime cambiado por esta actualización documental: `NO`.

## Decisión y siguiente checkpoint

- Mantener el panel same-origin, receive-only y sin credenciales en el navegador; conservar el texto únicamente en memoria y ligado al draft, y solicitar autorización humana antes de commit, despliegue, servicios externos o cualquier envío.
- Siguiente checkpoint: Revisar y autorizar el commit documental/implementación de MVP-2; después, si se aprueba por separado, planificar validación de navegador real y verificación de CSP antes de producción.
- Autorización requerida: Autorización explícita para commit, despliegue, navegador contra servicios reales, verificación productiva de CSP, activación de sender, automatización o cualquier envío.

## Hallazgos y riesgos

La validación posterior al fix fue focalizada y no repitió la suite completa de MVP-2. No existe prueba real de navegador: viewport móvil, teclado, sticky scrolling y clicks no fueron validados en un navegador real. CSP sigue pendiente de verificación antes de producción. La evidencia es local y no operativa.
<!-- AUTO:END mvp-2-mobile-first-panel -->
