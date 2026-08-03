---
type: generated-architecture
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-03
---

# Arquitectura actual observada

<!-- AUTO:BEGIN architecture -->
```mermaid
flowchart TD
    A["AppModule"] --> B["EvolutionWebhookModule"]
    B --> C["SupabaseModule"]
    B --> D["LeadsModule"]
    E["AiProvider contract"] -. "implemented by" .-> F["GeminiProvider"]
    G["ResponseDraftService"] --> E
```

`GeminiProvider` está registrado en el runtime.

El contrato de IA no está conectado al webhook; no puede generar ni enviar respuestas desde ese flujo.
<!-- AUTO:END architecture -->
