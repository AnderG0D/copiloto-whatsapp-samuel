---
type: technical-doc
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-07-31
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

## Límite actual

```text
Persistencia + scoring
```

No debe existir todavía:

- generación automática dentro del webhook;
- envío;
- inventario;
- medios;
- mutaciones administrativas.

## Privacidad

`raw_payload` puede ser útil para depuración, pero no debe:

- enviarse al proveedor de IA;
- imprimirse completo en producción;
- conservarse indefinidamente sin política;
- aparecer en reportes.

