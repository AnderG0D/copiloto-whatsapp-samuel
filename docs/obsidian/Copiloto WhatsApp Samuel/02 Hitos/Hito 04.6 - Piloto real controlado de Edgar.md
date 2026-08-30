---
type: milestone
project: Copiloto WhatsApp Samuel
status: active
fase: Fase 2 — IA de texto segura
hito: 4.6
activated: 2026-08-29
updated: 2026-08-29
aliases:
  - Hito 4.6 - Piloto real controlado de Edgar
  - Hito 4.6 - Controlled real Edgar pilot
---

# Hito 4.6 — Piloto real controlado de Edgar

## Objetivo

Ejecutar un piloto operativo controlado con Edgar como operador de prueba y, después, recorrer la secuencia controlada Edgar → Samuel. El objetivo es obtener evidencia de conexión, recepción y experiencia operativa sin enviar mensajes a leads ni afirmar que la operación real ya fue exitosa.

## Gate técnico previo

La implementación del piloto ya está mergeada en `main`. PR #76 y PR #78, con el commit de implementación mergeada `4e6803f`, respaldan la configuración aislada de Edgar, Compose, el webhook receive-only y las pruebas automatizadas. La validación operativa con Edgar y Samuel sigue pendiente y debe ocurrir sólo después de revisar la documentación activa, el alcance aprobado y los invariantes de seguridad.

## Alcance aprobado

- Preparar y ejecutar una prueba controlada de Edgar con la instancia y cuenta de prueba dedicadas.
- Confirmar el estado de Docker y Compose, la instancia Evolution, el QR, la conexión, el webhook y la recepción de mensajes de prueba.
- Confirmar que el flujo permanece receive-only y no realiza persistencia, generación de IA ni envío a leads durante la prueba.
- Repetir la secuencia operativa controlada con Samuel, sin mezclar cuentas, sesiones, espacios de datos o evidencias.
- Revisar el feedback de Edgar y Samuel y registrar los hallazgos antes de ampliar el alcance.
- Acordar con Samuel el pago y el alcance posterior antes de tratar el piloto como trabajo comercial ampliado.

## Fuera de alcance

- No declarar clientes reales, leads reales, datos reales ni una operación real exitosa.
- No enviar mensajes a leads, contactos externos o números no autorizados.
- No conectar el piloto a inventario, precios, vehículos, archivos o datos comerciales no provistos por una fuente confiable.
- No habilitar envío automático, campañas, persistencia de conversaciones ni generación de respuestas para el piloto.
- No modificar backend funcional, Docker, Compose, migraciones, infraestructura remota o configuración productiva.
- No cerrar el Hito 4.6 ni crear un documento `DONE` en esta fase.

## Implementación ya mergeada

La implementación observable incluye rutas aisladas para Edgar y pruebas automatizadas. La evidencia de implementación configurada es:

- PRs: #76 y #78.
- Commit de implementación mergeada: `4e6803f`.
- Configuración del piloto: `agent-core/src/shadow-pilot/shadow-edgar.compose.json`.
- Compose aislado: `docker-compose.shadow-edgar.yaml`.
- Pruebas de Compose e aislamiento: `agent-core/src/shadow-pilot/shadow-edgar.compose.spec.ts` y `agent-core/src/shadow-pilot/shadow-pilot-isolation.spec.ts`.
- Pruebas receive-only y webhook: `agent-core/src/shadow-pilot/shadow-receive-only.guard.spec.ts` y `agent-core/src/shadow-pilot/shadow-only-webhook.service.spec.ts`.

Estas rutas demuestran la preparación técnica; no demuestran por sí solas que se haya ejecutado una operación real con Edgar o Samuel.

## Validación operativa pendiente

La validación aún no está completada. El estado activo representa una prueba pendiente, no un cierre. No se deben registrar como hechos la conexión efectiva, la recepción efectiva, el feedback de Edgar o Samuel, ni un acuerdo comercial hasta contar con evidencia explícita, revisada y sin datos sensibles.

## Secuencia de prueba Edgar → Samuel

1. Confirmar la documentación activa, la rama de referencia, el alcance y la ausencia de cambios locales no explicados.
2. Revisar Docker Compose y variables seguras sin imprimir secretos; no ejecutar Docker desde este registro documental.
3. Levantar y revisar únicamente el entorno aislado autorizado cuando exista aprobación operativa separada.
4. Confirmar la instancia `evolution-shadow-edgar`, la cuenta de prueba dedicada y el QR sin guardar imágenes, tokens, números completos o payloads reales.
5. Confirmar la conexión de Edgar y enviar sólo el mensaje de prueba autorizado al canal receive-only; verificar webhook y recepción.
6. Confirmar que no hubo persistencia, generación de IA, envío automático ni contacto con leads.
7. Detener, aislar y revisar la evidencia de Edgar; no reutilizar la sesión ni sus datos.
8. Repetir la misma secuencia para Samuel con `evolution-shadow-samuel`, sus identificadores y su espacio controlado.
9. Comparar feedback y bloqueos sin copiar datos personales; registrar sólo conclusiones mínimas y trazables.

## Checklist de preparación y prueba

- [ ] Docker y Compose revisados; no se ejecuta Docker como parte de esta actualización documental.
- [ ] Instancia `evolution-shadow-edgar` confirmada como destino aislado.
- [ ] QR de la cuenta de prueba revisado sin almacenar el QR ni secretos.
- [ ] Conexión de la cuenta de prueba confirmada con evidencia segura y mínima.
- [ ] Webhook receive-only configurado para la instancia aislada.
- [ ] Mensaje de prueba recibido por el webhook, sin conservar payload personal.
- [ ] `sender=false`, `AUTO_SEND_MESSAGES=false` y `noLeadSend=true` verificados.
- [ ] Ausencia de envío a leads y contactos externos verificada.
- [ ] Secuencia Edgar → Samuel completada sin mezclar identidades o datos.

## Evidencia requerida

- Registro de fecha, alcance y aprobación de la prueba, sin secretos ni datos personales innecesarios.
- Identificación de la instancia y cuenta de prueba mediante identificadores controlados, no números completos.
- Evidencia segura de conexión, webhook y recepción.
- Resultado explícito de ausencia de envío, persistencia, generación de IA y contacto con leads.
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
- `noLeadSend=true`: cero envío a leads.
- Edgar y Samuel son operadores de prueba; no son leads ni destinatarios de mensajes.
- Las cuentas, sesiones, instancias, identificadores y espacios de datos de Edgar y Samuel permanecen aislados.
- No usar credenciales reales en pruebas automatizadas ni registrar secretos, QR, números completos o payloads reales.
- No conectar generación de IA ni servicios externos al webhook sin autorización explícita.
- Detenerse ante cualquier identidad no allowlisted, instancia inesperada, conflicto, dato real no autorizado o estado ambiguo.

No se permite ningún envío a leads.

## Criterios para pasar posteriormente a DONE

El Hito 4.6 sólo podrá pasar a `DONE` cuando todo el alcance aprobado esté completo, la secuencia Edgar → Samuel tenga evidencia operativa revisada, el feedback esté registrado, el acuerdo comercial esté explícito, las pruebas y build requeridos estén verdes, la documentación y la evidencia estén alineadas, las invariantes de seguridad estén verificadas y exista autorización humana explícita para cerrar el hito. El código mergeado, por sí solo, no satisface estos criterios.

## Estado y siguiente acción

Estado actual: `active`, con validación operativa pendiente. La siguiente acción canónica es ejecutar la prueba controlada de Edgar dentro del alcance aprobado. Cualquier discrepancia documental, cambio local no explicado, conflicto o evidencia faltante bloquea el avance y debe reportarse.
