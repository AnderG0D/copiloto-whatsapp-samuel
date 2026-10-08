**Español | [English](case-study.md)**

# Caso de estudio: asistencia segura para conversaciones de ventas

> **Estado al 6 de octubre de 2026:** el desarrollo estuvo activo entre mayo y septiembre de 2026 y actualmente está inactivo. El hito 4.6 permanece activo e incompleto.

## El reto

Explorar cómo ayudar a un equipo a revisar conversaciones entrantes de WhatsApp y preparar respuestas, manteniendo el control humano sobre las decisiones y evitando que una generación de IA envíe mensajes por su cuenta.

## La solución implementada

Se construyó un backend en NestJS para recibir eventos de WhatsApp mediante Evolution API, aplicar reglas de negocio y conservar información autorizada en Supabase. El flujo contempla clasificación de leads, construcción de contexto seguro y generación de borradores mediante una interfaz de proveedor de IA. Gemini es el proveedor inicial.

También se desarrolló un panel administrativo con autenticación para revisar borradores, aprobarlos, editarlos antes de aprobarlos o rechazarlos. La generación de IA propone contenido; las decisiones y los efectos de negocio quedan bajo control del backend y de una persona revisora.

## Actividad histórica mostrada en capturas del 24 de junio de 2026

Capturas privadas de esa fecha muestran actividad de recepción con mensajes reales y registros de leads y mensajes en Supabase, en un entorno identificado como `PRODUCTION`. También muestran puntuaciones y clasificaciones, además de errores de esquema.

Esto documenta actividad histórica de recepción y persistencia en el entorno identificado de esa manera. No demuestra que todos los eventos se procesaran correctamente, disponibilidad continua, que el panel administrativo estuviera desplegado en producción ni resultados comerciales. Las capturas y sus datos no se publican.

## Pruebas posteriores del hito 4.6

Las pruebas posteriores del hito 4.6 se realizaron localmente, en aislamiento y con datos sintéticos. La evidencia local registra la revisión del panel y acciones administrativas; la evidencia runtime documenta verificaciones técnicas de recepción y persistencia de borradores sin enviar respuestas a leads.

El estado técnico versionado en el repositorio consigna aprobadas las pruebas unitarias, las pruebas end-to-end y la compilación del backend. Estas validaciones locales no convierten la actividad histórica en una verificación de operación productiva. El hito 4.6 sigue activo e incompleto.

## Despliegue

La actividad histórica descrita arriba se limita a lo que muestran las capturas privadas del 24 de junio. No acredita disponibilidad continua, despliegue productivo del panel administrativo ni operación comercial completa. Las pruebas posteriores del hito 4.6 fueron locales y aisladas; no se accedió a producción durante esa revisión.

## Estado y límites

El desarrollo estuvo activo entre mayo y septiembre de 2026 y actualmente está inactivo. El hito 4.6 permanece activo porque sus pendientes de validación operativa, revisión de feedback y acuerdo explícito sobre el alcance posterior no están cerrados. No se afirma que el hito o un piloto comercial se hayan completado.

No se incluyen métricas de negocio, conversaciones, capturas, nombres, teléfonos ni otros datos identificables. El sistema no debe presentarse como envío automático de respuestas ni atribuirse resultados comerciales sin evidencia.

## Fuentes del proyecto

- Implementación: backend bajo `agent-core/src/` y migraciones bajo `supabase/migrations/`.
- Validaciones automatizadas y evidencia local: `docs/_generated/project-state.json` y `docs/control/hito-4.6-runtime-evidence.json`.
- Estado, alcance y pendientes del hito 4.6: documentación del hito correspondiente en el repositorio.
- Actividad histórica: capturas privadas del 24 de junio de 2026, resumidas aquí sin publicar imágenes ni datos identificables.
