---
type: technical-doc
project: Copiloto WhatsApp Samuel
classification: human
status: active
updated: 2026-10-07
---

**Language / Idioma:** [English](Evolution Webhook Service - English.md) · [Español](Flujo Interno - Evolution Webhook Service.md)

# Flujo Interno — Evolution Webhook Service

## Responsabilidad actual

El endpoint `POST /webhooks/evolution` delega el payload a `EvolutionWebhookService`. El servicio tiene una salida temprana para instancias shadow y, para las demás instancias, procesa mensajes entrantes autorizados, actualiza el lead, registra el mensaje, calcula su scoring y genera un borrador `PROPOSED`.

## Rama shadow de solo recepción

Antes de analizar el pipeline normal, `ShadowReceiveOnlyGuard` revisa si `instance` empieza con `evolution-shadow-`. Si es una instancia shadow, valida el piloto, el evento `messages.upsert`, que el mensaje no sea propio ni de grupo, que tenga identidad individual y texto, y que la identidad esté permitida para ese piloto. La decisión termina aquí: el webhook devuelve aceptación o rechazo con `persisted: false`. No persiste datos, no genera borrador y no continúa por la ruta normal. Una identidad o instancia shadow desconocida se rechaza.

## Secuencia para instancias no shadow

1. Recibir el payload y evaluar primero la guardia shadow.
2. Normalizar el nombre del evento y aceptar solo `messages.upsert`.
3. Ignorar mensajes propios (`fromMe`), de grupo, sin identidad individual válida o sin texto.
4. Extraer instancia, teléfono, nombre, ID externo y texto.
5. Buscar el negocio activo asociado a la instancia y comprobar que el lead esté autorizado.
6. Hacer upsert del lead por `business_id`, `phone`; este paso actualiza `last_message` y sus marcas de tiempo antes de comprobar si el mensaje ya existe.
7. Calcular el score usando el score actual del lead.
8. Insertar el mensaje entrante en `messages`, incluyendo `raw_payload` y los datos de scoring. La restricción de unicidad detecta el duplicado en este insert.
9. Si el insert detecta duplicado (`23505`), devolver sin actualizar el score/clasificación ni generar borrador. El upsert del lead del paso 6 ya ocurrió.
10. Si el insert es nuevo, actualizar score, clasificación y razón del lead.
11. Construir contexto con el mensaje actual y hasta diez mensajes previos de roles permitidos; generar un borrador mediante `ResponseDraftService`.
12. Guardar el borrador en `response_drafts` con estado `PROPOSED` y devolver el resultado técnico al webhook.

## Abstracción de IA

`ResponseDraftService` depende del contrato neutral `AiProvider` e invoca `generateText`; no depende directamente de un SDK de proveedor. El módulo de borradores enlaza actualmente `AI_PROVIDER` con `GeminiProvider`. La IA propone texto y el servicio persiste ese texto como borrador.

## Envío y notificaciones

Este flujo no envía mensajes a WhatsApp ni notifica al operador. Generar y guardar un borrador `PROPOSED` no equivale a aprobarlo ni enviarlo.

## Registros y privacidad

La nota anterior afirmaba que los logs eran mínimos y que los teléfonos estaban enmascarados; eso no coincide con el código actual. El logger del servicio registra teléfono, nombre del cliente y texto completo del mensaje en el log de éxito; también registra teléfonos en otros mensajes de log. No hay enmascaramiento visible en esos registros. Esta nota describe los campos, pero no incluye valores reales.

El payload crudo se guarda en `messages.raw_payload`. El contexto de generación se construye con campos seleccionados de mensajes previos y el mensaje actual, no con el payload crudo completo.
