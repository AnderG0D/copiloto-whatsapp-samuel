---
type: diagram
project: Copiloto WhatsApp Samuel
status: proposed
updated: 2026-07-31
---

# Diagrama — Reportes para Samuel

```mermaid
flowchart TD
    A["Solicitud autenticada"] --> B["ReportQueryService"]
    B --> C["PostgreSQL calcula"]
    C --> D["ReportData verificable"]
    D --> E{"Presentación"}
    E -- "Determinista" --> F["Formato directo"]
    E -- "IA" --> G["Resumen sin cambiar cifras"]
    F --> H["Respuesta a Samuel"]
    G --> H
```
