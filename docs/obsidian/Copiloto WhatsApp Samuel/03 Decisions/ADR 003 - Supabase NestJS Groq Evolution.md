---
type: decision
project: Copiloto WhatsApp Samuel
status: superseded
updated: 2026-07-31
superseded_by:
  - ADR 004 - AiProvider intercambiable, Gemini principal y Groq complementario
---

# ADR 003 — Supabase, NestJS, Groq y Evolution API

> [!warning] Decisión parcialmente reemplazada
> La separación entre Evolution API, NestJS y Supabase sigue vigente. La elección de Groq como cerebro conversacional fue reemplazada por [[ADR 004 - AiProvider intercambiable, Gemini principal y Groq complementario]].

## Decisión original

El sistema usará esta separación mental:

```txt
Supabase = memoria
NestJS = cerebro lógico
Groq = cerebro conversacional (reemplazado)
Evolution API = boca + oído por WhatsApp
```

## Parte que permanece vigente

```txt
WhatsApp
↓
Evolution API
↓
NestJS
↓
Supabase
```

- Evolution API transporta mensajes de WhatsApp.
- NestJS valida, decide, scorea y orquesta.
- Supabase conserva datos del negocio.

## Parte reemplazada

El código de negocio ya no debe depender directamente de Groq. Debe depender del contrato neutral `AiProvider`; Gemini es la primera implementación y Groq queda como proveedor complementario futuro.

## Consecuencia

Cada herramienta tiene una responsabilidad clara:

| Parte | Responsabilidad |
|---|---|
| Evolution API | Recibir y enviar WhatsApp |
| NestJS | Validar, decidir, scorear, orquestar |
| Supabase | Guardar negocios, leads, mensajes e inventario |
| `AiProvider` | Contrato neutral para interpretación y redacción |

Para el estado vigente, consultar [[ADR 004 - AiProvider intercambiable, Gemini principal y Groq complementario]].
