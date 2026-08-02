---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
fase: Fase 1 — Fundación
hito: 2
updated: 2026-07-01
aliases:
  - Hito 2 - Primer Flujo Programable
---

# ✅ Hito 2 — Primer Flujo Programable

## Objetivo

Lograr que un mensaje real de WhatsApp llegue a NestJS y quede guardado en Supabase.

## Flujo confirmado

```txt
WhatsApp
↓
Evolution API
↓
Webhook /webhooks/evolution
↓
NestJS
↓
Buscar negocio por instanceName
↓
Crear o actualizar lead
↓
Guardar mensaje en Supabase
```

## Resultado logrado

- [x] Evolution recibe mensajes reales de WhatsApp
- [x] NestJS recibe webhook `messages.upsert`
- [x] Se ignoran mensajes de grupo
- [x] Se ignoran mensajes enviados por la propia instancia
- [x] Se extrae teléfono desde `remoteJid`
- [x] Se extrae texto del mensaje
- [x] Se identifica negocio por `evolution_instance_name`
- [x] Se crea o actualiza lead en Supabase
- [x] Se guarda mensaje en `messages`
- [x] Se guarda `raw_payload` para debug

## Tablas involucradas

- `businesses`
- `leads`
- `messages`

## Instancia usada

```txt
agent_core_samuel
```

Identifica al negocio:

```txt
Autos Samuel Ford
```

## Problemas resueltos

- [x] NestJS no leía `.env`
- [x] Se instaló y configuró `@nestjs/config`
- [x] Supabase daba `permission denied`
- [x] Se corrigieron permisos usando `service_role`

## Estado final

```txt
Hito 2 completado.
```

## Documentación relacionada

- [[Flujo WhatsApp a Supabase]]
- [[Arquitectura y Flujo Principal]]
- [[ADR 002 - Identificar negocio por Evolution Instance]]
