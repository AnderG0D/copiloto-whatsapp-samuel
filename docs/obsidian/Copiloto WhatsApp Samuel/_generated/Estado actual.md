---
type: generated-project-state
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-29
---

# Estado actual

<!-- AUTO:BEGIN project-state -->
> [!info] Fuente
> Estado observado en `fix/hito-4-6-shadow-persistence-and-qr` en `de38920`, asociado al [PR #80](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/80). Generado desde el código, Git y GitHub; no sustituye decisiones humanas.

## Hito actual

**Hito 4.6 — Piloto real controlado de Edgar**.

## Hitos confirmados

| Hito | Resultado | Estado | Evidencia |
| --- | --- | --- | --- |
| 2 | Primer flujo programable | `DONE` | Configurado como cerrado |
| 3 | Score y clasificación básica | `DONE` | Configurado como cerrado |
| 3.2 | Score y clasificación avanzada | `DONE` | Configurado como cerrado |
| 3.3 | E2E real del webhook y CI | `DONE` | Configurado como cerrado |
| 4.1 | Abstracción IA y Gemini | `DONE` | Configurado como cerrado |
| 4.2 | Contexto confiable y borradores seguros de respuesta | `DONE` | Configurado como cerrado |
| 4.3 | Persistencia e integración de borradores sin envío | `DONE` | Configurado como cerrado |
| 4.4 | Revisión y aprobación humana | `DONE` | Configurado como cerrado |
| 4.5 | Piloto UX en sombra WhatsApp-first | `DONE` | Configurado como cerrado |
| 4.6 | Piloto real controlado de Edgar | `ACTIVE` | 0/4 checkpoints observados |

## Regla permanente: documentation-first

Antes de comenzar un hito nuevo deben existir su registro, documento base, alcance, criterios, riesgos, invariantes, evidencia, estado, handoff, siguiente acción y aprobación humana. Después se sincroniza `main`, se crea un worktree exclusivo y el trabajo permanece allí. Durante y al cierre, la documentación, el código y la evidencia deben mantenerse alineados; código mergeado no equivale a validación operativa ni a `DONE`.

## Componentes confirmados

- Webhook de Evolution.
- Persistencia en Supabase.
- Scoring de leads.
- Contrato neutral `AiProvider`.
- `GeminiProvider` aislado y probado.
- Constructor de contexto seguro.
- Servicio de borradores.

## Todavía fuera del runtime

- Inventario aún no implementado.
- Reportes aún no implementados.
- Medios aún no implementados.
- Envío automático aún no implementado.

## Modelo predeterminado observado

`gemini-3.1-flash-lite`
<!-- AUTO:END project-state -->
