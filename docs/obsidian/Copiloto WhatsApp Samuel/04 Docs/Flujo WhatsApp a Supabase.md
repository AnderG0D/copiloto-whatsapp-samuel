---
type: technical-doc
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-09-03
---

# Flujo WhatsApp a Supabase

## Flujo actual

```text
WhatsApp
→ Evolution API
→ POST /webhooks/evolution
→ validar messages.upsert
→ ignorar fromMe y grupos
→ extraer texto y metadatos
→ buscar business por instanceName
→ crear o actualizar lead
→ calcular scoring
→ guardar message
→ actualizar lead
→ construir contexto seguro
→ generar borrador con Gemini
→ persistir `response_drafts` como `PROPOSED`
→ notificar opcionalmente al operador
→ detenerse sin envío a la lead
```

## Identidad de negocio

```text
payload.instance
→ businesses.evolution_instance_name
→ business_id
```

## Idempotencia

`external_message_id` evita procesar dos veces el mismo mensaje.

El flujo debe impedir que un duplicado vuelva a sumar score.

## Mensajes soportados actualmente

La implementación conocida procesa texto y captions. Audio, imágenes y documentos como contenido real pertenecen a hitos futuros.

## Límite actual del piloto receive-only

```text
Persistencia + scoring + contexto + borrador PROPOSED
```

El piloto puede ejecutar el pipeline técnico de generación y persistencia, pero
no puede enviar respuestas a leads. El preview por WhatsApp, si se usa, solo se
dirige al canal autorizado del operador.

Todavía no forman parte de este flujo:

- envío automático a leads;
- inventario;
- medios;
- mutaciones administrativas.

## Privacidad

`raw_payload` puede ser útil para depuración, pero no debe:

- enviarse al proveedor de IA;
- imprimirse completo en producción;
- conservarse indefinidamente sin política;
- aparecer en reportes.

