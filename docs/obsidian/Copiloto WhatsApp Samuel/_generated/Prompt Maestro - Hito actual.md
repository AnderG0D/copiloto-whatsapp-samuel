---
type: generated-active-milestone-prompt
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-29
---

# Prompt maestro — Hito actual

<!-- AUTO:BEGIN active-milestone-prompt -->
El Hito 4.6 está activo y su validación operativa sigue pendiente.

## Alcance actual

- Hito: **4.6 — Piloto real controlado de Edgar**.
- Rama documental/de referencia: `feature/hito-4-6-controlled-real-pilot`.
- Último hito cerrado: **4.5**.
- Implementación observada: `4e6803f`; no equivale a validación operativa completada.

## Siguiente acción

- [ ] En la rama `feature/hito-4-6-controlled-real-pilot`, implementar únicamente el checkpoint **4.6-A: Ejecutar la prueba controlada de Edgar** y sus pruebas, sin ampliar el alcance.

**Termina cuando:** La evidencia configurada existe, las pruebas relevantes pasan y el diff no conecta envíos ni servicios externos.

## Regla documentation-first

Antes de iniciar otro hito deben existir su registro, documento base, alcance, criterios, riesgos, invariantes, evidencia, estado, handoff, siguiente acción y aprobación humana; después se sincroniza `main` y se crea un worktree exclusivo. Mantén documentación, código y evidencia alineados y no declares `DONE` sólo por terminar el código.

## Invariantes

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- `noLeadSend=true`.
- No enviar mensajes a leads ni usar secretos o datos reales.
<!-- AUTO:END active-milestone-prompt -->
