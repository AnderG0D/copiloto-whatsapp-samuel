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

Respeta el alcance y las reglas de seguridad de `docs/obsidian/Copiloto WhatsApp Samuel/02 Hitos/Hito 04.6 - Piloto real controlado de Edgar.md`. No inventes información, no uses servicios externos ni credenciales y no avances a la primera acción funcional mientras el gate permanezca abierto.
