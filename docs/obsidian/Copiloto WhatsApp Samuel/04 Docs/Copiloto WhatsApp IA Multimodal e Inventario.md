---
type: product-doc
project: Copiloto WhatsApp Samuel
status: planned
created: 2026-07-29
updated: 2026-07-31
aliases:
  - IA multimodal del Copiloto
  - Gemini Groq Copiloto WhatsApp
tags:
  - copiloto-whatsapp
  - inteligencia-artificial
  - gemini
  - groq
  - multimodal
  - inventario
---

# IA multimodal e inventario del Copiloto WhatsApp

## Decisión

- `AiProvider` evita acoplar el producto a un SDK.
- Gemini es la primera implementación.
- Groq puede añadirse por tarea.
- NestJS controla inventario, permisos, acciones y envío.
- Supabase conserva datos y archivos.
- La multimodalidad se integra después de estabilizar texto, inventario y revisión humana.

## No confundir

### Comprender un archivo del lead

```text
Audio, imagen o PDF
→ validación
→ extracción o análisis
→ resultado estructurado
→ reglas del negocio
```

### Enviar un archivo del inventario

```text
Solicitud del lead
→ buscar unidad real
→ resolver medio aprobado
→ validar negocio y vehículo
→ plan de respuesta
→ aprobación o regla segura
→ envío
```

La segunda operación no debe generar imágenes falsas ni usar archivos encontrados por la IA.

## Ejemplos conceptuales

Un audio puede transformarse en datos estructurados antes de entrar al flujo comercial:

```json
{
  "transcript": "Busco una Ranger automática y tengo 150 mil de enganche",
  "intent": "VEHICLE_SEARCH",
  "vehicle": "Ranger",
  "transmission": "automática",
  "downPayment": 150000
}
```

Un plan de respuesta puede referenciar medios existentes sin permitir que la IA los invente:

```json
{
  "text": "Encontré una unidad que coincide. Samuel puede confirmar disponibilidad y compartir las fotos autorizadas.",
  "attachments": [
    {
      "type": "image",
      "mediaId": "vehicle-photo-123"
    }
  ],
  "requiresHuman": true
}
```

Estos objetos son diseños propuestos, no contratos ya implementados.

## Dependencias antes de multimodalidad

- Borradores seguros.
- Inventario real.
- Medios privados y autorizados.
- Transferencia y pausa.
- Límites de tamaño y retención.
- Registro de costos.
- Manejo de errores.

## Ruta revisada

### Texto

- 4.1 — Proveedor neutral y Gemini.
- 4.2 — Contexto y borradores.
- 4.3 — Persistencia e integración sin envío.
- 4.4 — Aprobación humana.

### Inventario

- 5.1 — Modelo y consultas.
- 5.2 — Medios y documentos.
- 5.3 — Administración de solo lectura.
- 5.4 — Mutaciones confirmadas.
- 5.5 — Respuestas grounded.

### Operación

- 6.1 — Reportes.
- 6.2 — Transferencia y pausa.
- 6.3 — Resumen diario.

### Multimodalidad

- 7.1 — Audio.
- 7.2 — Imágenes.
- 7.3 — Documentos y PDF.
- 7.4 — Envío controlado de medios.

## Audio

- Validar formato, duración y tamaño.
- Transcribir.
- Guardar transcript seguro.
- Aplicar scoring al transcript.
- Eliminar o retener el archivo según política.

## Imágenes

- Validar archivo.
- Analizar características, no identidad.
- Buscar coincidencias en inventario.
- Informar ambigüedad.
- No asegurar que dos vehículos son iguales sin evidencia.

## Documentos

- Aceptar solo tipos definidos.
- Analizar únicamente datos necesarios.
- Transferir documentos financieros o identificaciones a un flujo sensible.
- No usar datos sensibles en niveles gratuitos sin revisar privacidad.

## Medios del inventario

- Bucket privado.
- Separación por negocio.
- Estado de autorización.
- Checksums.
- IDs internos.
- Acceso temporal al enviar.
- Auditoría de qué archivo se compartió.

Antes de compartir, NestJS debe confirmar que el medio existe, pertenece al negocio y unidad correctos, está autorizado y cumple los límites permitidos.

## Seguridad y privacidad

- Retención limitada según una necesidad real del negocio.
- Restricciones de formato, tamaño y duración.
- Rechazo de archivos no compatibles o sospechosos.
- Separación estricta por `business_id`.
- Acceso temporal a objetos privados.
- Nada de secretos o contenido sensible en logs.
- Documentos financieros o de identidad requieren un flujo sensible separado.
- Transferencia humana cuando exista baja confianza o una solicitud delicada.

## Proveedores

El proveedor puede elegirse por tarea. No se necesita obligar a Gemini o Groq a resolver todo.

Antes de producción medir:

- precisión;
- naturalidad;
- latencia;
- costo;
- errores;
- alucinaciones;
- calidad de extracción;
- transferencias humanas correctas.

## Regla final

```text
La IA entiende y propone.
El backend valida y ejecuta.
```

## Fuentes oficiales conservadas

- [Gemini Files API](https://ai.google.dev/gemini-api/docs/files)
- [Gemini — Procesamiento de documentos](https://ai.google.dev/gemini-api/docs/document-processing)
- [Gemini — Comprensión de audio](https://ai.google.dev/gemini-api/docs/audio)
- [Gemini — Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Gemini — Salidas estructuradas](https://ai.google.dev/gemini-api/docs/structured-output)
- [Groq — Speech to text](https://console.groq.com/docs/speech-to-text)
- [Groq — Visión](https://console.groq.com/docs/vision)
