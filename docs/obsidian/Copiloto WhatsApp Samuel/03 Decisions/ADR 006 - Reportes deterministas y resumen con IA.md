---
type: decision
project: Copiloto WhatsApp Samuel
status: proposed
created: 2026-07-31
updated: 2026-07-31
---

# ADR 006 — Reportes deterministas y resumen con IA

## Contexto

Samuel quiere pedir resúmenes diarios, conocer los leads prioritarios, saber qué modelos interesan y detectar conversaciones sin respuesta.

Una IA no debe contar leads, calcular métricas o decidir el periodo leyendo una conversación completa sin una consulta confiable.

## Decisión propuesta

NestJS y PostgreSQL calculan los datos. La IA solamente redacta un resumen opcional usando el resultado ya calculado.

```text
Solicitud autenticada
→ ReportQueryService
→ consulta determinista
→ ReportData
→ formateador o resumen IA
→ respuesta para Samuel
```

## Reglas

- Zona horaria del negocio explícita.
- Periodo de consulta visible.
- Métricas calculadas por SQL o TypeScript probado.
- Resumen IA limitado a los datos recibidos.
- Enlace o identificador para revisar el lead original.
- Teléfonos enmascarados por defecto.
- Solo operadores autorizados.
- No enviar mensajes masivos desde un reporte sin otra confirmación.
- Guardar parámetros y momento de generación cuando sea necesario auditar.

## MVP

Primero reportes bajo demanda:

- `/resumen_hoy`
- `/prioridades`
- `/sin_respuesta`
- `/modelo Ranger`
- `/inventario_desactualizado`

Después se podrá programar un resumen diario con la misma consulta probada.

## Consecuencia

Los números seguirán siendo verificables aunque cambie Gemini, Groq o el estilo del texto generado.

