---
type: milestone
project: Copiloto WhatsApp Samuel
status: active
fase: Fase 2 — IA de texto segura
hito: 4.6
activated: 2026-08-29
updated: 2026-09-03
aliases:
  - Hito 4.6 - Piloto real controlado de Edgar
  - Hito 4.6 - Controlled real Edgar pilot
---

# Hito 4.6 — Piloto real controlado de Edgar

## Objetivo

Ejecutar un piloto operativo controlado con Edgar como operador de prueba y,
después, recorrer la secuencia controlada Edgar → Samuel. El objetivo es
obtener evidencia de conexión, recepción, persistencia, scoring, contexto,
generación de borradores y experiencia operativa sin enviar mensajes a leads ni
afirmar que la operación comercial real ya fue exitosa.

## Gate técnico previo

La implementación del piloto ya está mergeada en `main`. PR #76 y PR #78, con el commit de implementación mergeada `4e6803f`, respaldan la configuración aislada de Edgar, Compose, el webhook receive-only y las pruebas automatizadas. La validación operativa con Edgar y Samuel sigue pendiente y debe ocurrir sólo después de revisar la documentación activa, el alcance aprobado y los invariantes de seguridad.

## Alcance aprobado

- Preparar y ejecutar una prueba controlada de Edgar con la instancia y cuenta de prueba dedicadas.
- Confirmar el estado de Docker y Compose, la instancia Evolution, el QR, la conexión, el webhook y la recepción de mensajes de prueba.
- Confirmar que el flujo permanece receive-only respecto a los mensajes salientes
  a leads. La validación técnica aislada puede persistir el mensaje entrante,
  scoring, contexto y `response_drafts.PROPOSED`; no puede enviar respuestas a
  leads.
- Confirmar que la generación con Gemini y la persistencia del borrador ocurren
  únicamente dentro del backend autorizado y con contexto seguro.
- Confirmar que el preview opcional, si se habilita, se dirige únicamente al
  canal autorizado del operador y no a la lead.
- Repetir la secuencia operativa controlada con Samuel, sin mezclar cuentas, sesiones, espacios de datos o evidencias.
- Revisar el feedback de Edgar y Samuel y registrar los hallazgos antes de ampliar el alcance.
- Acordar con Samuel el pago y el alcance posterior antes de tratar el piloto como trabajo comercial ampliado.

## Fuera de alcance

- No declarar clientes reales, leads reales, datos reales ni una operación real exitosa.
- No enviar mensajes a leads, contactos externos o números no autorizados.
- No conectar el piloto a inventario, precios, vehículos, archivos o datos comerciales no provistos por una fuente confiable.
- No habilitar envío automático, campañas ni respuestas salientes a leads. La
  persistencia técnica de mensajes entrantes, scoring, contexto y borradores
  `PROPOSED` sí forma parte de la validación aislada.
- No modificar backend funcional fuera del receive-only aislado ni configuración productiva, migraciones o infraestructura remota; los Compose del piloto deben permanecer limitados a sus runtimes aislados.
- No cerrar el Hito 4.6 ni crear un documento `DONE` en esta fase.

## Implementación ya mergeada

La implementación observable incluye rutas aisladas para Edgar y pruebas automatizadas. La evidencia de implementación configurada es:

- PRs: #76 y #78.
- Commit de implementación mergeada: `4e6803f`.
- Configuración del piloto: `agent-core/src/shadow-pilot/shadow-edgar.compose.json`.
- Compose aislado: `docker-compose.shadow-edgar.yaml`.
- Compose aislado disponible para la secuencia de Samuel: `docker-compose.shadow-samuel.yaml`.
- Pruebas de Compose e aislamiento: `agent-core/src/shadow-pilot/shadow-edgar.compose.spec.ts` y `agent-core/src/shadow-pilot/shadow-pilot-isolation.spec.ts`.
- Pruebas receive-only y webhook: `agent-core/src/shadow-pilot/shadow-receive-only.guard.spec.ts` y `agent-core/src/shadow-pilot/shadow-only-webhook.service.spec.ts`.

Estas rutas demuestran la preparación técnica; no demuestran por sí solas que se haya ejecutado una operación real con Edgar o Samuel.

## Validación técnica observada

La validación runtime posterior confirmó parcialmente el pipeline de Edgar, sin
convertir el hito en una operación comercial ni autorizar envíos:

- Compose y API aislados ejecutándose correctamente.
- `SHADOW_ONLY_MODE=edgar`, `SENDER=false`, `AUTO_SEND_MESSAGES=false` y
  `NO_LEAD_SEND=true` verificados.
- Mensaje de prueba recibido y persistido con scoring, clasificación e historial
  seguro.
- Gemini generó un borrador que quedó enlazado al mensaje como
  `response_drafts.PROPOSED`.
- Preview aceptado por Evolution únicamente hacia el canal del operador.
- Candidatos y evidencia de envío a la lead: `0`.
- Build: `0`; pruebas: `19` suites y `254` tests aprobados.

Estos resultados son evidencia técnica del pipeline receive-only. El cierre del
hito todavía requiere la secuencia con Samuel, feedback revisable y acuerdo
comercial explícito.

## Validación operativa pendiente

La validación operativa completa aún no está terminada. Ya existe evidencia
técnica parcial del runtime receive-only de Edgar; el estado activo representa
que siguen pendientes la secuencia con Samuel, el feedback revisable y el
acuerdo comercial. No se debe inferir ninguno de esos puntos a partir del
código o de la validación técnica parcial.

## Secuencia de prueba Edgar → Samuel

1. Confirmar la documentación activa, la rama de referencia, el alcance y la ausencia de cambios locales no explicados.
2. Revisar Docker Compose y variables seguras sin imprimir secretos; no ejecutar Docker desde este registro documental.
3. Levantar y revisar únicamente el entorno aislado autorizado cuando exista aprobación operativa separada.
4. Confirmar la instancia `evolution-shadow-edgar`, la cuenta de prueba dedicada y el QR sin guardar imágenes, tokens, números completos o payloads reales.
5. Confirmar la conexión de Edgar y enviar sólo el mensaje de prueba autorizado al canal receive-only; verificar webhook y recepción.
6. Confirmar que no hubo envío a leads ni contactos externos. La persistencia
   técnica de mensajes de prueba, scoring, contexto y borradores debe quedar
   aislada, trazable y sin exponer payloads en logs.
7. Detener, aislar y revisar la evidencia de Edgar; no reutilizar la sesión ni sus datos.
8. Repetir la misma secuencia para Samuel con `evolution-shadow-samuel`, sus identificadores y su espacio controlado.
9. Comparar feedback y bloqueos sin copiar datos personales; registrar sólo conclusiones mínimas y trazables.

## Checklist de preparación y prueba

- [x] Docker y Compose revisados; no se ejecuta Docker como parte de esta actualización documental.
- [x] Instancia `evolution-shadow-edgar` confirmada como destino aislado.
- [ ] QR de la cuenta de prueba revisado sin almacenar el QR ni secretos.
- [x] Conexión de la cuenta de prueba confirmada con evidencia segura y mínima.
- [x] Webhook receive-only configurado para la instancia aislada.
- [ ] QR habilitado explícitamente en el manifiesto y en Compose para vincular la cuenta de prueba; no se conserva la imagen ni el contenido del QR.
- [x] Mensaje de prueba recibido por el webhook, sin conservar payload personal.
- [x] Persistencia técnica de mensajes de prueba, scoring, contexto y borradores `PROPOSED` verificada dentro del runtime aislado; no hay persistencia ni envío operativo hacia leads.
- [x] `SENDER=false`, `AUTO_SEND_MESSAGES=false`, `NO_LEAD_SEND=true` y `SHADOW_ONLY_MODE=edgar` verificados.
- [x] Ausencia de envío a leads y contactos externos verificada.
- [ ] Compose Samuel disponible con instancia, red, volúmenes, puertos, allowlist y variables `SHADOW_SAMUEL_*` independientes.
- [ ] Secuencia Edgar → Samuel completada sin mezclar identidades o datos.

## Evidencia requerida

- Registro de fecha, alcance y aprobación de la prueba, sin secretos ni datos personales innecesarios.
- Identificación de la instancia y cuenta de prueba mediante identificadores controlados, no números completos.
- Evidencia segura de conexión, webhook y recepción.
- Resultado explícito de ausencia de envío a leads y contactos externos. La
  evidencia debe distinguir la persistencia técnica autorizada de mensajes de
  prueba, scoring, contexto y borradores `PROPOSED` de cualquier efecto
  operativo o comercial.
- Registro separado del feedback de Edgar y Samuel.
- Checkpoint comercial con el acuerdo de pago y alcance posterior documentado por Samuel.
- Pruebas automatizadas relevantes, `npm run docs:check`, `npm run test:docs`, `npm run docs:handoff:check` y `git diff --check`, con su resultado real.

## Progreso observado

<!-- AUTO:BEGIN milestone-progress -->
- [ ] 4.6-A — Ejecutar la prueba controlada de Edgar.
- [ ] 4.6-B — Completar la secuencia controlada Edgar → Samuel.
- [ ] 4.6-C — Revisar y registrar el feedback operativo.
- [ ] 4.6-D — Acordar con Samuel el pago y el alcance posterior.
<!-- AUTO:END milestone-progress -->

## Checkpoint de feedback

El checkpoint 4.6-C sólo se marca cuando Edgar y Samuel hayan entregado feedback revisable, se hayan separado hechos de opiniones y se hayan registrado bloqueos, mejoras y decisiones sin exponer datos personales. El feedback no autoriza por sí mismo cambios de alcance ni envío de mensajes.

## Checkpoint comercial

El checkpoint 4.6-D sólo se marca cuando Samuel acuerde explícitamente el pago, el alcance posterior, las responsabilidades y la condición de avance. No inferir aceptación comercial a partir de una conversación informal o de que el código esté mergeado.

## Reglas de seguridad

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- `NO_LEAD_SEND=true`: cero envío a leads.
- Edgar y Samuel son operadores de prueba; no son leads ni destinatarios de mensajes.
- Las cuentas, sesiones, instancias, identificadores y espacios de datos de Edgar y Samuel permanecen aislados.
- El runtime puede persistir mensajes de prueba, scoring, contexto y borradores
  `PROPOSED` de forma aislada; no debe producir persistencia ni efectos
  operativos hacia leads o contactos externos.
- No usar credenciales reales en pruebas automatizadas ni registrar secretos, QR, números completos o payloads reales.
- La generación con Gemini forma parte del pipeline técnico autorizado y debe
  permanecer limitada a contexto seguro, persistencia de `PROPOSED` y ausencia
  de efectos de envío. No conectar proveedores ni efectos adicionales sin
  autorización explícita.
- Detenerse ante cualquier identidad no allowlisted, instancia inesperada, conflicto, dato real no autorizado o estado ambiguo.

No se permite ningún envío a leads.

## Criterios para pasar posteriormente a DONE

El Hito 4.6 sólo podrá pasar a `DONE` cuando todo el alcance aprobado esté completo, la secuencia Edgar → Samuel tenga evidencia operativa revisada, el feedback esté registrado, el acuerdo comercial esté explícito, las pruebas y build requeridos estén verdes, la documentación y la evidencia estén alineadas, las invariantes de seguridad estén verificadas y exista autorización humana explícita para cerrar el hito. El código mergeado, por sí solo, no satisface estos criterios.

## Estado y siguiente acción

Estado actual: `active`, con validación técnica de Edgar observada y validación
operativa/comercial pendiente. La siguiente acción es completar la secuencia
controlada Edgar → Samuel después de revisar esta documentación. Cualquier
discrepancia documental, cambio local no explicado, conflicto o evidencia
faltante bloquea el avance y debe reportarse.
