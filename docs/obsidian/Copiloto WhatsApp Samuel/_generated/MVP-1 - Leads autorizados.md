---
type: generated-mvp-1-authorized-leads-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-10-08
---

# MVP-1 — Leads autorizados

<!-- AUTO:BEGIN mvp-1-authorized-leads -->
## Estado del checkpoint

- Estado: `PASS_WITH_WARNINGS`; validación exclusivamente local, no operativa.
- Fuente FD-EVIDENCIA-01: `docs/control/mvp-1-authorized-leads-evidence.json`.
- Base observada: rama `feature/mvp-demo-authorized-flow`, commit `697653850247da2737e944b5b5391ab1ad315e46`.

## Contrato de `authorized_leads`

- Propósito: Allowlist de leads entrantes autorizados para persistencia y generación de candidatos IA.
- Aislamiento: Cada consulta exige business_id y la unicidad es (business_id, phone).
- Teléfono: Identidad individual normalizada a dígitos sin sufijo JID; se aceptan únicamente JIDs @s.whatsapp.net o @c.us.
- JIDs rechazados: Se ignoran JIDs ausentes, de grupo y cualquier JID que no represente una identidad individual numérica válida.
- Fail-closed: Fila ausente, inactiva, de otro negocio, error de consulta o excepción devuelve no autorizado.
- Posición del gate: Después de resolver el negocio activo y antes de upsert de leads, persistencia de mensajes, scoring, historial, Gemini y response_drafts.
- Distinción de allowlists: La allowlist de leads autorizados controla remitentes entrantes por negocio. La allowlist shadow controla identidades/instancias del piloto receive-only; no es una allowlist de operadores administrativos individuales.
- Entrega: No existe sender ni envío real en este checkpoint; SENDER=false, AUTO_SEND_MESSAGES=false y NO_LEAD_SEND=true se mantienen.

## Validación declarada

- `authorized-leads.service.spec.ts`: PASS — 6 tests.
- `evolution-webhook.service.spec.ts`: PASS — 10 tests.
- `npm run build`: PASS.
- `git diff --check`: PASS_WITH_WARNINGS — avisos CRLF preexistentes.
- Validación operativa: `NOT_RUN`.

## Invariantes y siguiente checkpoint

- Servicios iniciados: `NO`; servicios externos usados: `NO`.
- Números reales: `NO`; secretos: `NO`; mensajes enviados: `NO`.
- Runtime cambiado por esta actualización documental: `NO`.
- Siguiente checkpoint: Implementar el panel mobile-first; no está implementado en este checkpoint.
- Autorización requerida: Autorización explícita antes de iniciar servicios, aplicar migraciones remotas, conectar Evolution/WhatsApp, habilitar sender, automatización o cualquier envío.
<!-- AUTO:END mvp-1-authorized-leads -->
