---
type: technical-doc
project: Copiloto WhatsApp Samuel
area: codigo
status: active
updated: 2026-07-31
---

# Mapa del Código — `agent-core`

> [!info]
> La evidencia técnica se regenera desde `main`; las responsabilidades se conservan como explicación humana.

<!-- AUTO:BEGIN code-map-evidence -->
![[Evidencia tecnica]]
<!-- AUTO:END code-map-evidence -->

## Entrada

- `src/main.ts` — arranque.
- `src/app.module.ts` — módulo raíz.

## Supabase

- `src/supabase/supabase.module.ts`
- `src/supabase/supabase.service.ts`

Responsabilidad: cliente de base de datos. No imprimir configuración ni `service_role`.

## Leads

- `src/leads/lead-scoring.service.ts`
- `src/leads/lead-scoring.service.spec.ts`
- `src/leads/leads.module.ts`

Responsabilidad: señales, score y clasificación.

## Webhook Evolution

- `src/webhooks/evolution/evolution-webhook.controller.ts`
- `src/webhooks/evolution/evolution-webhook.module.ts`
- `src/webhooks/evolution/evolution-webhook.service.ts`

Responsabilidad: validar evento, normalizar mensaje, identificar negocio, persistir, scorear y actualizar.

## IA

- `src/ai/ai.constants.ts`
- `src/ai/ai-provider.interface.ts`
- `src/ai/ai.types.ts`
- `src/ai/gemini.provider.ts`
- `src/ai/gemini.provider.spec.ts`

Responsabilidad:

- contrato neutral;
- token de inyección;
- adaptación de mensajes;
- provider Gemini aislado.

El provider no debe estar conectado al webhook al cierre del Hito 4.1.

## Pruebas

- 24 pruebas de scoring.
- 19 pruebas del provider Gemini.
- 1 e2e del webhook.

Total conocido:

```text
43 unitarias + 1 e2e
```

## Piezas planeadas

No existen hasta comprobarlas:

- `ConversationContextService`.
- `ResponseDraftService`.
- `InventoryService`.
- `AdminCommandService`.
- `ReportQueryService`.
- `HumanHandoffService`.
- `MediaService`.
- `EvolutionSender`.

## Cómo mantener esta nota

Actualizarla cuando:

- se agrega un módulo;
- cambia una responsabilidad;
- un servicio se divide;
- el flujo principal cambia.

No copiar implementaciones completas; enlazar al código y explicar la responsabilidad.
