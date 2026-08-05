---
type: generated-milestone-handoff-portable-prompt
project: Copiloto WhatsApp Samuel
generated: true
handoff: 4.3-to-4.4
source-revision: cfbde5fbf7a8db27c3b595cb2e17bdc11529d6e8
observed-revision: e56348e7a590a12ceb937eda7783122fb22d1f91
updated: 2026-08-04
---

# Prompt portátil — Hito 4.4

Continúa **Copiloto WhatsApp Samuel** en la transición `4.3-to-4.4`: el Hito 4.3 está cerrado y el Hito 4.4 está activo.

Antes de editar, lee `AGENTS.md`, `docs/control/handoff-state.json`, `docs/control/milestones.json`, `docs/_generated/project-state.json`, las notas de ambos hitos y `docs/obsidian/Copiloto WhatsApp Samuel/_generated/Siguiente accion.md`. Valida que `e56348e7a590a12ceb937eda7783122fb22d1f91` sea la revisión observada, que su sucesor congelado sea `cfbde5fbf7a8db27c3b595cb2e17bdc11529d6e8`, que exista exactamente un hito activo y que la evidencia obligatoria del cierre siga presente.

## Gate de transición y progreso funcional

- Gate de transición actual: integrar y validar el generador determinista.
- Progreso funcional actual del Hito 4.4: **0/4**.
- Primera acción funcional: **4.4-A — Persistencia auditable de decisiones humanas**.
- 4.4-A solo puede comenzar después de que el gate del generador haya sido validado y fusionado.

Mientras este gate siga abierto, la acción actual es integrar y validar el generador determinista; no avances a 4.4-A.

## Primera acción funcional condicionada

Esta acción permanece bloqueada hasta que se cumpla el gate de transición.

- [ ] En la rama `feature/hito-4-4-human-review`, implementar únicamente el checkpoint **4.4-A: Persistencia auditable de decisiones humanas** y sus pruebas, sin ampliar el alcance.

**Commit sugerido:** `feat: persist auditable response draft decisions`

**Termina cuando:** La evidencia configurada existe, las pruebas relevantes pasan y el diff no conecta envíos ni servicios externos.

## Invariantes de ausencia de envío

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.

Respeta el alcance y las reglas de seguridad de `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.4 - Revision y aprobacion humana ACTIVE.md`. No inventes información, no uses servicios externos ni credenciales y no avances a la primera acción funcional mientras el gate permanezca abierto.
