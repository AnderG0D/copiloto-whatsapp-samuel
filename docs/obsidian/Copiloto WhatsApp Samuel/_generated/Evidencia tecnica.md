---
type: generated-technical-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-10
---

# Evidencia técnica

<!-- AUTO:BEGIN technical-evidence -->
## Revisión observada

- Fuente: `main` en `de4247d`, asociado al [PR #26](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/26).
- Commit completo: `de4247ddb4ae1ccb1f3a0537bb3a349686da16cc`.
- Mensaje: feat: persist auditable response draft decisions (#26).
- Ejecución de CI: [abrir evidencia](https://github.com/AnderG0D/copiloto-whatsapp-samuel/actions/runs/31448713401).

## Validación

- **Unitarias:** `APROBADO` — 96 casos ejecutados.
- **E2E:** `APROBADO` — 1 caso ejecutados.
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
- `SupabaseModule` — `agent-core/src/supabase/supabase.module.ts`.

## Migraciones detectadas

- `supabase/migrations/20260713050133_initial_remote_schema.sql`
- `supabase/migrations/20260713052850_add_lead_scoring_columns.sql`
- `supabase/migrations/20260802111346_create_response_drafts.sql`
- `supabase/migrations/20260807020218_create_response_draft_decisions.sql`
<!-- AUTO:END technical-evidence -->
