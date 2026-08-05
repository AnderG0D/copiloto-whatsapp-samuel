---
type: milestone
project: Copiloto WhatsApp Samuel
status: active
fase: Fase 2 — IA de texto segura
hito: 4.4
updated: 2026-08-04
aliases:
  - Hito 4.4 - Revision y aprobacion humana
  - Hito 4.4 - Human review
---

# Hito 4.4 — Revisión y aprobación humana

## Objetivo

Permitir que un operador autenticado revise un borrador `PROPOSED`, lo apruebe sin cambios, lo edite y apruebe, o lo rechace; registrar la decisión de manera auditable y mantener completamente desactivado el envío a WhatsApp.

## Resultado esperado

```text
borrador PROPOSED
→ operador autenticado
→ aprobar | editar y aprobar | rechazar
→ texto original preservado
→ decisión auditable
→ sin envío
```

Aprobar un borrador no significa enviarlo. El envío a WhatsApp permanece fuera del alcance de este hito.

## Gate técnico previo

Antes de comenzar técnicamente 4.4-A se implementará, en un PR independiente, el sistema determinista de relevo automático entre hitos.

Este gate:

- no forma parte de los checkpoints funcionales 4.4-A a 4.4-D;
- no modifica `agent-core/`;
- no implementa revisión humana;
- debe quedar fusionado y demostrar idempotencia antes de iniciar 4.4-A.

## Alcance aprobado

- Persistencia auditable de decisiones humanas.
- Consulta y revisión de borradores pendientes.
- Aprobar sin cambios.
- Editar y aprobar.
- Rechazar.
- Identidad del operador derivada de autenticación confiable.
- API administrativa interna en NestJS.
- Pruebas de transiciones, idempotencia y ausencia de envío.
- `AUTO_SEND_MESSAGES=false` durante todo el hito.

El diseño exacto de persistencia para 4.4-A todavía no está fijado. Primero se inspeccionará el esquema real y se comparará extender `response_drafts` contra una entidad separada de revisiones o decisiones.

## Progreso observado

<!-- AUTO:BEGIN milestone-progress -->
- [ ] 4.4-A — Persistencia auditable de decisiones humanas.
- [ ] 4.4-B — Servicio de revisión humana.
- [ ] 4.4-C — Interfaz administrativa autenticada.
- [ ] 4.4-D — Pruebas, idempotencia y ausencia de envío.
<!-- AUTO:END milestone-progress -->

## Checkpoints

### 4.4-A — Persistencia auditable de decisiones humanas

Diseñar y, después de aprobación explícita, implementar la persistencia mínima que permita:

- conservar el texto original generado;
- registrar la decisión humana;
- registrar texto final cuando exista;
- registrar operador autenticado y fecha;
- distinguir aprobar, editar y aprobar, o rechazar;
- impedir transiciones inválidas;
- manejar repeticiones sin duplicar decisiones.

Antes de fijar el esquema se deben presentar como máximo dos alternativas viables con sus tradeoffs.

### 4.4-B — Servicio de revisión humana

Implementar reglas de dominio para:

- consultar borradores pendientes;
- aprobar sin cambios;
- editar y aprobar;
- rechazar;
- validar negocio, borrador, operador y estado;
- mantener las reglas fuera del controlador.

### 4.4-C — Interfaz administrativa autenticada

Crear una API interna en NestJS con:

- autenticación explícita;
- autorización explícita;
- identidad del operador obtenida del contexto autenticado;
- rechazo de identidad enviada únicamente por el body;
- sin dashboard visual todavía.

La inspección actual no encontró módulos de autenticación o guards reutilizables. Su diseño deberá revisarse antes de implementar este checkpoint.

### 4.4-D — Pruebas, idempotencia y ausencia de envío

Demostrar mediante unitarias y e2e:

- transiciones válidas e inválidas;
- idempotencia;
- rechazo de operadores no autenticados o no autorizados;
- preservación del texto original;
- auditoría correcta;
- ausencia de llamadas externas reales;
- que aprobar no envía;
- `AUTO_SEND_MESSAGES=false`.

## Decisiones humanas permitidas

### Aprobar sin cambios

El texto final coincide con el borrador original.

### Editar y aprobar

El texto original se conserva y el texto final editado queda registrado por separado.

### Rechazar

La decisión y el operador quedan auditados sin convertir el borrador en mensaje enviado.

## Reglas de seguridad

- La IA propone; NestJS controla; el humano decide.
- Aprobar todavía no envía.
- No confiar en `operatorId`, correo, rol o identidad enviada por el body.
- No enviar WhatsApps reales.
- No agregar ni activar rutas de envío.
- No aplicar migraciones remotas sin autorización explícita.
- Las pruebas deben usar mocks, fakes o datos ficticios.
- No realizar llamadas reales a Gemini, Supabase, Evolution API u otros servicios.
- Conservar aislamiento por negocio.
- Mantener `AUTO_SEND_MESSAGES=false`.
- Mantener `sender=false` hasta que exista un hito futuro que autorice envío.

## No incluye

- Envío a WhatsApp.
- Aprobación automática.
- Dashboard web.
- Inventario real, precios o disponibilidad.
- Reportes.
- Audio, imágenes o documentos.
- Producción.
- `AUTO_SEND_MESSAGES=true`.

## DONE cuando

- [ ] Existe persistencia auditable de decisiones humanas.
- [ ] Se conserva el texto original.
- [ ] Aprobar, editar y aprobar, o rechazar están soportados.
- [ ] Las transiciones inválidas y la idempotencia están cubiertas.
- [ ] El operador proviene de autenticación confiable.
- [ ] Existe una API administrativa segura dentro del alcance aprobado.
- [ ] Unitarias, e2e y build están aprobados.
- [ ] Las pruebas demuestran ausencia de envío y llamadas externas reales.
- [ ] `AUTO_SEND_MESSAGES=false` permanece.
- [ ] El PR funcional está fusionado y la documentación coincide con GitHub.

## Primera acción funcional

Después de completar el gate técnico de automatización de relevos:

**4.4-A — Inspeccionar el esquema y proponer el diseño mínimo de persistencia auditable.**

> La IA propone. NestJS controla. El humano decide. Aprobar todavía no envía.
