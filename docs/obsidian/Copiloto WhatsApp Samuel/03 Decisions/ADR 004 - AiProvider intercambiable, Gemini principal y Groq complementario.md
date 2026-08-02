---
type: decision
project: Copiloto WhatsApp Samuel
status: accepted
created: 2026-07-30
updated: 2026-07-31
supersedes:
  - Parte conversacional de ADR 003
---

# ADR 004 — AiProvider intercambiable, Gemini principal y Groq complementario

## Contexto

El producto debe evolucionar de texto a audio, imágenes y documentos. Acoplar el webhook directamente a un SDK impediría cambiar de proveedor y mezclar capacidades según la tarea.

## Decisión

El código de negocio dependerá del contrato neutral `AiProvider` y del token `AI_PROVIDER`.

```text
Lógica del Copiloto
→ AI_PROVIDER
→ AiProvider
→ implementación configurable
```

Gemini es la primera implementación. Groq queda como opción futura para transcripción, baja latencia o respaldo.

## Reglas

- El webhook no importa SDKs de IA.
- El inventario y los reportes no dependen de un proveedor.
- Los proveedores no ejecutan mutaciones de negocio.
- El modelo se configura fuera del código de negocio.
- Las pruebas simulan el SDK.
- Una migración de API o modelo ocurre en un cambio dedicado.

## Estado actual

El Hito 4.1 implementó `GeminiProvider` con `@google/genai` y `generateContent`.

La documentación oficial de Google recomienda Interactions API para proyectos nuevos desde junio de 2026, aunque `generateContent` continúa soportado. No se migrará automáticamente: primero se debe demostrar que la migración aporta valor para function calling, multimodalidad, observabilidad o manejo de contexto.

## Consecuencias

### Positivas

- Proveedores intercambiables.
- Pruebas aisladas.
- Menor riesgo de vendor lock-in.
- El inventario conserva a NestJS como autoridad.

### Costos

- Se necesitan adaptadores.
- Las capacidades específicas de un proveedor requieren contratos adicionales.
- Debe vigilarse la vigencia de modelos y APIs.

## Revisión temporal

`gemini-2.5-flash-lite`, el valor predeterminado implementado, tiene apagado anunciado para el 16 de octubre de 2026. Antes del piloto debe evaluarse un reemplazo estable con pruebas y PR propio.

## Fuentes oficiales

- [Gemini — Deprecaciones](https://ai.google.dev/gemini-api/docs/deprecations)
- [Gemini — Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Gemini — Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
