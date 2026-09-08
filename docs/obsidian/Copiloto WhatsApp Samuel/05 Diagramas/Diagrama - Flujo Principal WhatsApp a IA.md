---
type: diagram
project: Copiloto WhatsApp Samuel
status: planned
updated: 2026-09-03
---

# Diagrama — Flujo Principal WhatsApp a IA

```mermaid
flowchart TD
    A["Mensaje de WhatsApp"] --> B["Evolution Webhook"]
    B --> C["Persistir + scoring"]
    C --> D["Contexto seguro"]
    D --> E["AI_PROVIDER"]
    E --> F["Borrador PROPOSED"]
    F --> G["Panel web / revisión del operador"]
    G --> H{"¿Decisión?"}
    H -- "Aprobar / editar" --> I["Actualizar decisión en NestJS"]
    H -- "Rechazar" --> J["Marcar REJECTED"]
    I --> K["Sin envío a leads en receive-only"]
    J --> K
```

En el piloto Edgar el flujo termina en la revisión y persistencia de la
decisión, sin envío a leads. WhatsApp solo puede recibir una notificación o
preview opcional en el canal del operador.
