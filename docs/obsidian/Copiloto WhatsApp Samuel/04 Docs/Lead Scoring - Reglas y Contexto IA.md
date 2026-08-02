---
type: technical-doc
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-07-31
---

# Lead Scoring — Reglas y Contexto IA

## Responsabilidad

`LeadScoringService` calcula intención comercial de forma determinista y auditable.

La IA redacta respuestas; no reemplaza el scoring actual sin un hito explícito.

## Casos de aceptación

| Mensaje | Resultado |
| --- | --- |
| `Hola` | `COLD` |
| `Me interesa una Ranger` | `WARM` |
| `Cuánto cuesta y la puedo ver hoy?` | `HOT` |
| `Ya compré, gracias` | `NOT_INTERESTED` |

## Señales

- precio;
- financiamiento;
- enganche;
- mensualidad;
- vehículo o versión;
- disponibilidad;
- cita;
- prueba de manejo;
- urgencia;
- desinterés.

## Datos persistidos

### Mensaje

- score;
- clasificación;
- señales;
- razón.

### Lead

- score acumulado;
- clasificación;
- razón actual;
- último mensaje;
- fecha.

## Contexto seguro para Hito 4.2

Ejemplo conceptual:

```json
{
  "classification": "HOT",
  "score": 85,
  "signals": ["price", "appointment", "urgency"],
  "reason": "Preguntó por precio y pidió verlo hoy.",
  "currentMessage": "¿Cuánto cuesta y la puedo ver hoy?",
  "recentMessages": [
    {
      "role": "customer",
      "content": "Me interesa una Ranger"
    }
  ]
}
```

No enviar:

- teléfono;
- `raw_payload`;
- IDs internos innecesarios;
- secretos;
- archivos;
- datos sensibles.

## Regla

La clasificación ayuda a orientar el tono, pero no autoriza:

- asegurar disponibilidad;
- inventar precio;
- prometer financiamiento;
- enviar un mensaje;
- contactar masivamente.

## Evidencia

El Hito 3.2 quedó cubierto por 24 pruebas unitarias. Los cambios futuros deben conservar esos casos.

