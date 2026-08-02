---
type: generated-architecture
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-07-31
---

# Arquitectura actual observada

<!-- AUTO:BEGIN architecture -->
```mermaid
flowchart TD
    A["AppModule"] --> B["EvolutionWebhookModule"]
    B --> C["SupabaseModule"]
    B --> D["LeadsModule"]
    E["AiProvider contract"] -. "implemented by" .-> F["GeminiProvider"]
```

`GeminiProvider` existe y está probado, pero todavía no está registrado en un módulo ni conectado al webhook. `ConversationContextService`, `ResponseDraftService`, inventario, reportes, medios y envío permanecen fuera de la implementación observada.
<!-- AUTO:END architecture -->
