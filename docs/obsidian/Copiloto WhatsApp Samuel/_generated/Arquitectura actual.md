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

`GeminiProvider` existe y está probado, pero todavía no está registrado en un módulo.

El contrato de IA no está conectado al webhook; no puede generar ni enviar respuestas desde ese flujo.
<!-- AUTO:END architecture -->
