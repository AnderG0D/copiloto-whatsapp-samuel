---
type: generated-milestone-handoff-portable-prompt
project: Copiloto WhatsApp Samuel
generated: true
handoff: 4.4-to-4.5
source-revision: d2a261a2e5666f1e1b7426f3b6ce6e15b0b96b1f
observed-revision: 87551063e42888a71e29f57f568806da6719f562
updated: 2026-08-22
---

# Prompt portátil — Hito 4.5

Continúa **Copiloto WhatsApp Samuel** en la transición `4.4-to-4.5`: el Hito 4.4 está cerrado y el Hito 4.5 está activo.

Antes de editar, lee `AGENTS.md`, `docs/control/handoff-state.json`, `docs/control/milestones.json`, `docs/_generated/project-state.json`, las notas de ambos hitos y `docs/obsidian/Copiloto WhatsApp Samuel/_generated/Siguiente accion.md`. Valida que `87551063e42888a71e29f57f568806da6719f562` sea la revisión observada, que su sucesor congelado sea `d2a261a2e5666f1e1b7426f3b6ce6e15b0b96b1f`, que exista exactamente un hito activo y que la evidencia obligatoria del cierre siga presente.

## Gate de transición y progreso funcional

- Gate de transición actual: validar y fusionar el relevo documental 4.4 → 4.5.
- Progreso funcional actual del Hito 4.5: **0/2**.
- Primera acción funcional: **4.5-A — Preparar el piloto local aislado**.
- 4.5-A solo puede comenzar después de que el relevo documental post-merge haya sido validado y fusionado.

Mientras este gate siga abierto, la acción actual es validar y fusionar el relevo documental 4.4 → 4.5; no avances a 4.5-A.

## Primera acción funcional condicionada

Esta acción permanece bloqueada hasta que se cumpla el gate de transición.

- [ ] En la rama `feature/hito-4-5-shadow-whatsapp-first`, implementar únicamente el checkpoint **4.5-A: Preparar el piloto local aislado** y sus pruebas, sin ampliar el alcance.

**Commit sugerido:** `feat: configure isolated shadow pilot allowlists`

**Termina cuando:** La evidencia configurada existe, las pruebas relevantes pasan y el diff no conecta envíos ni servicios externos.

## Invariantes de ausencia de envío

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- `noLeadSend=true`.
- Aprobar un borrador no envía mensajes.
- No existe envío automático dentro de este alcance.

Respeta el alcance y las reglas de seguridad de `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.5 - Piloto UX en sombra WhatsApp-first.md`. No inventes información, no uses servicios externos ni credenciales y no avances a la primera acción funcional mientras el gate permanezca abierto.
