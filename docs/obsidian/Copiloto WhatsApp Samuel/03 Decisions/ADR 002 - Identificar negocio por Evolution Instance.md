---
type: decision
project: Copiloto WhatsApp Samuel
status: accepted
updated: 2026-07-01
---

# ADR 002 — Identificar negocio por Evolution Instance

## Decisión

Cada negocio se identificará por el nombre de su instancia de Evolution API.

Ejemplo:

```txt
agent_core_samuel → Autos Samuel Ford
```

## Contexto

Cuando llega un webhook de Evolution, NestJS necesita saber a qué negocio pertenece ese mensaje para guardar correctamente:

- `business_id` en `leads`
- `business_id` en `messages`

## Implementación

En Supabase:

```sql
businesses.evolution_instance_name
```

En el webhook:

```ts
payload.instance
```

Flujo:

```txt
Webhook llega con instanceName
↓
NestJS busca businesses.evolution_instance_name
↓
Encuentra business_id
↓
Guarda lead y message con ese business_id
```

## Consecuencia

Esto permite que el sistema sea multi-negocio sin construir todavía todo el sistema de usuarios, planes y permisos.
