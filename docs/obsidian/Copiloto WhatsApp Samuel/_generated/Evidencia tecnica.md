---
type: generated-technical-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-20
---

# Evidencia técnica

<!-- AUTO:BEGIN technical-evidence -->
## Revisión observada

- Fuente: `docs/activate-hito-4-5` en `ebedea0`.
- Commit completo: `ebedea024af1dba3cb9220fc50ce9d5b7ddde75e`.
- Mensaje: docs: activate Hito 4.5 shadow pilot.

## Validación

- **Unitarias:** `APROBADO` — 84 casos ejecutados.
- **E2E:** `APROBADO` — 3 casos ejecutados.
- **Build:** `APROBADO` — compilación del backend.

## Backend

- Node.js: 22 (GitHub Actions).
- NestJS: `^11.0.1`.
- `@google/genai`: `^2.15.0`.
- `@supabase/supabase-js`: `^2.108.2`.

## Módulos detectados

- `AppModule` — `agent-core/src/app.module.ts`.
- `EvolutionWebhookModule` — `agent-core/src/webhooks/evolution/evolution-webhook.module.ts`.
- `LeadsModule` — `agent-core/src/leads/leads.module.ts`.
- `ResponseDraftModule` — `agent-core/src/ai/response-drafts/response-draft.module.ts`.
- `ResponseDraftReviewModule` — `agent-core/src/admin/response-drafts/response-draft-review.module.ts`.
- `SupabaseModule` — `agent-core/src/supabase/supabase.module.ts`.

## Migraciones detectadas

- `supabase/migrations/20260713050133_initial_remote_schema.sql`
- `supabase/migrations/20260713052850_add_lead_scoring_columns.sql`
- `supabase/migrations/20260802111346_create_response_drafts.sql`
- `supabase/migrations/20260807020218_create_response_draft_decisions.sql`
<!-- AUTO:END technical-evidence -->
