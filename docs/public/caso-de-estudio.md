# Caso de estudio: asistencia segura para conversaciones de ventas

> **Estado al 6 de octubre de 2026:** el desarrollo está inactivo. El seguimiento del proyecto mantiene el hito del piloto como activo e incompleto; su validación operativa y cierre siguen pendientes.

## El reto

Explorar cómo ayudar a un equipo a revisar conversaciones entrantes de WhatsApp y preparar respuestas, manteniendo el control humano sobre las decisiones y evitando que una generación de IA envíe mensajes por su cuenta.

## La solución implementada

Se construyó un backend en NestJS que recibe eventos de WhatsApp a través de Evolution API, aplica reglas de negocio y conserva información autorizada en Supabase. El flujo contempla clasificación de leads, construcción de contexto seguro y generación de borradores mediante una interfaz de proveedor de IA. Gemini es el proveedor inicial.

Un panel administrativo con autenticación permite revisar los borradores y aprobarlos, editarlos antes de aprobarlos o rechazarlos. El diseño mantiene la generación de IA como propuesta y deja las decisiones y efectos de negocio bajo control del backend y de una persona revisora.

La preparación del piloto aislado mantiene el procesamiento en modo receive-only: puede verificar recepción, clasificación, contexto y persistencia de borradores de prueba, sin enviar respuestas a leads.

## Implementado

- Webhook y módulos de backend para recepción, clasificación y persistencia.
- Contrato de proveedor de IA y generación de borradores con contexto controlado.
- Panel administrativo para revisión humana de borradores.
- Configuración aislada del piloto con protecciones contra envíos a leads.

## Probado

- El estado técnico versionado en el repositorio consigna como aprobadas las pruebas unitarias, las pruebas end-to-end y la compilación del backend.
- La evidencia local registra la revisión del panel y las acciones administrativas con datos sintéticos.
- La evidencia del piloto registra una ejecución técnica aislada de recepción y persistencia de borradores, sin envíos a leads.

Estas comprobaciones acreditan comportamiento de código y validaciones locales o aisladas. No acreditan operación comercial completa.

## Desplegado

No hay despliegue productivo acreditado. La evidencia disponible indica que no se verificó disponibilidad pública ni HTTPS productivo y que no se aplicaron cambios a infraestructura remota como parte de esas validaciones.

## Estado y límites

El desarrollo está inactivo a la fecha indicada. El hito del piloto sigue registrado como activo porque quedan pendientes la validación operativa completa, la revisión de feedback y el acuerdo explícito sobre el alcance posterior. No se afirma que el piloto comercial se haya completado.

No se incluyen métricas de negocio, conversaciones, datos personales ni capturas. El sistema no debe presentarse como envío automático de respuestas ni como una solución desplegada en producción.

## Fuentes del proyecto

- Implementación: backend bajo `agent-core/src/` y migraciones bajo `supabase/migrations/`.
- Validaciones automatizadas: `docs/_generated/project-state.json`; evidencia de ejecución local: `docs/control/hito-4.6-runtime-evidence.json`.
- Estado, alcance y pendientes del piloto: documentación del hito correspondiente en el repositorio.
