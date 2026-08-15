---
type: generated-architecture
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-14
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
    B --> G
```

`GeminiProvider` está registrado en el runtime.

`EvolutionWebhookService` llama a `ResponseDraftService`, que usa `AI_PROVIDER` para generar borradores. El flujo los persiste como `PROPOSED`; no envía mensajes a WhatsApp.
<!-- AUTO:END architecture -->
