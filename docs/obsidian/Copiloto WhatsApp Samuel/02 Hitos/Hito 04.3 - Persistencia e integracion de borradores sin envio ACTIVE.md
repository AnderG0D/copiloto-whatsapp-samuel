---
type: milestone
project: Copiloto WhatsApp Samuel
status: active
fase: Fase 2 — IA de texto segura
hito: 4.3
updated: 2026-08-02
aliases:
  - Hito 4.3 - Persistencia e integracion sin envio
  - Hito 4.3 - Borradores persistentes
---

# Hito 4.3 — Persistencia e integración de borradores sin envío

## Objetivo

Persistir de forma trazable los borradores `PROPOSED` e integrarlos al flujo entrante después del scoring, manteniendo `AUTO_SEND_MESSAGES=false`.

## Resultado esperado

```text
Mensaje guardado y scoreado
→ contexto seguro
→ borrador PROPOSED
→ persistencia trazable
→ sin envío
```

## Alcance aprobado

- Tabla o estado persistente de borradores.
- Integración después del scoring.
- Trazabilidad del borrador generado.
- `AUTO_SEND_MESSAGES=false` durante todo el hito.

Este hito no fija todavía el diseño irreversible del esquema. El checkpoint 4.3-A debe comenzar inspeccionando las migraciones y el esquema actuales antes de proponer la opción mínima compatible.

## Progreso observado

<!-- AUTO:BEGIN milestone-progress -->
- [x] 4.3-A — Persistencia trazable de borradores PROPOSED.
- [x] 4.3-B — Registro de la capa de IA y borradores en NestJS.
- [x] 4.3-C — Integración después del scoring sin envío.
- [x] 4.3-D — Pruebas de persistencia, idempotencia y ausencia de envío.
<!-- AUTO:END milestone-progress -->

## Checkpoints

### 4.3-A — Persistencia trazable de borradores PROPOSED

Inspeccionar primero el esquema actual y después implementar la persistencia mínima que conserve el estado `PROPOSED` y su trazabilidad, sin aplicar migraciones remotas.

### 4.3-B — Registro de la capa de IA y borradores en NestJS

Registrar las piezas ya aisladas de contexto y borradores mediante dependencias de NestJS, conservando el contrato neutral `AiProvider`.

### 4.3-C — Integración después del scoring sin envío

Generar y persistir el borrador solo después de guardar y scorear el mensaje entrante. El flujo termina en persistencia y no llama a ningún emisor de WhatsApp.

### 4.3-D — Pruebas de persistencia, idempotencia y ausencia de envío

Probar con dobles locales que el borrador queda trazable, que un evento repetido no duplica efectos y que ninguna ruta envía mensajes.

## No incluye

- Envío de WhatsApp.
- Aprobación, edición o rechazo humano.
- Inventario, precios o disponibilidad.
- Audio, imágenes, documentos u otra multimedia.
- Activar `AUTO_SEND_MESSAGES=true`.
- Aplicar migraciones o modificar infraestructura remota.

## Reglas de seguridad

- Los proveedores de IA solo generan candidatos; NestJS conserva las reglas y los efectos de negocio.
- Las pruebas usan mocks, fakes o datos ficticios y no llaman servicios externos.
- La persistencia debe respetar el aislamiento existente del negocio y no guardar payloads crudos como contexto de IA.
- `AUTO_SEND_MESSAGES=false` permanece como condición de aceptación.

## DONE cuando

- [ ] Los cuatro checkpoints cuentan con evidencia verificable.
- [ ] La persistencia conserva borradores `PROPOSED` con trazabilidad.
- [ ] La integración ocurre después del scoring y es idempotente.
- [ ] Las pruebas confirman ausencia de envío y de llamadas externas reales.
- [ ] Unitarias, e2e, build y validaciones del repositorio están aprobadas.
- [ ] El hito está fusionado y su documentación de cierre coincide con GitHub.

## Lo que sigue

**Hito 4.4 — Revisión y aprobación humana.**
