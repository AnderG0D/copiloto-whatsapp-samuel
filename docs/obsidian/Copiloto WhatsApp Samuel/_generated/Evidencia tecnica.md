---
type: generated-technical-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-25
---

# Evidencia técnica

<!-- AUTO:BEGIN technical-evidence -->
## Revisión observada

- Fuente: `main` en `2fe6ba9`, asociado al [PR #67](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/67).
- Commit completo: `2fe6ba9772b97df96b7f6b8987e73e69dc7f323f`.
- Mensaje: Merge pull request #67 from AnderG0D/fix/hito-4-5-a-evidence-alignment.
- Ejecución de CI: [abrir evidencia](https://github.com/AnderG0D/copiloto-whatsapp-samuel/actions/runs/32924245872).

## Validación

- **Unitarias:** `APROBADO` — 184 casos ejecutados.
- **E2E:** `APROBADO` — 6 casos ejecutados.
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
- `ShadowPilotModule` — `agent-core/src/shadow-pilot/shadow-pilot.module.ts`.
- `SupabaseModule` — `agent-core/src/supabase/supabase.module.ts`.

## Migraciones detectadas

- `supabase/migrations/20260713050133_initial_remote_schema.sql`
- `supabase/migrations/20260713052850_add_lead_scoring_columns.sql`
- `supabase/migrations/20260802111346_create_response_drafts.sql`
- `supabase/migrations/20260807020218_create_response_draft_decisions.sql`
<!-- AUTO:END technical-evidence -->
