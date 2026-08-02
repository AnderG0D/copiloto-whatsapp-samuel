---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
fase: Fase 1 — Fundación
hito: 3
updated: 2026-07-01
aliases:
  - Hito 3 - Score y Clasificacion Basica
---

# ✅ Hito 3 — Score + clasificación básica del lead

## Objetivo

Pasar de solo guardar mensajes a entender de forma básica qué tan interesado viene el lead.

## Flujo

```txt
WhatsApp
→ Evolution API
→ NestJS
→ Supabase guarda lead + message
→ NestJS calcula score
→ NestJS actualiza lead.score y lead.classification
→ Supabase queda con lead clasificado
```

## Alcance del hito básico

- [x] Crear `LeadScoringService`
- [x] Detectar palabras clave comerciales
- [x] Calcular score del mensaje
- [x] Acumular score en `leads.score`
- [x] Clasificar lead como `COLD`, `WARM`, `HOT` o `NOT_INTERESTED`
- [x] Actualizar lead en Supabase

## Reglas base

| Score | Classification |
|---:|---|
| 0 - 29 | COLD |
| 30 - 69 | WARM |
| 70 - 100 | HOT |

## Ejemplos probados / esperados

| Mensaje | Resultado esperado |
|---|---|
| `Hola` | COLD |
| `Me interesa una Ford Ranger` | WARM |
| `Cuánto cuesta y la puedo ver hoy?` | HOT |

## Estado final

```txt
Hito 3 básico terminado.
```

## Lo que sigue

El siguiente nivel es [[Hito 03.2 - Score y Clasificacion Avanzada DONE]], donde el sistema deja de depender solo de palabras clave y empieza a guardar señales comerciales y razón de clasificación.
