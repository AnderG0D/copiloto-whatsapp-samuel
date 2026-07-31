---
type: decision
project: Copiloto WhatsApp Samuel
status: accepted
updated: 2026-07-01
---

# ADR 001 — Multiindustria desde el día 1

## Decisión

El copiloto se diseñará como una base SaaS reutilizable desde el inicio, no como un bot exclusivo para autos.

## Contexto

El primer cliente real es Samuel y su negocio de autos, pero el diseño debe poder adaptarse después a bienes raíces u otras industrias.

## Consecuencia

La arquitectura de datos debe usar entidades universales primero:

- `businesses`
- `leads`
- `messages`
- `inventory`

Y después agregar lógica específica según:

```ts
business.business_type
```

## Regla

```txt
Universal primero.
Específico después.
```
