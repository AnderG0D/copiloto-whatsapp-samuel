---
type: generated-technical-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-07-31
---

# Evidencia técnica

<!-- AUTO:BEGIN technical-evidence -->
## Revisión observada

- Fuente: `main` en `a82bdfd`, asociado al [PR #7](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/7).
- Commit completo: `a82bdfd9d59c182c4d526f931097bfdf91400160`.
- Mensaje: chore: update default Gemini model to 3.1 Flash-Lite (#7).

## Validación

- **Unitarias:** `APROBADO` — 43 casos ejecutados.
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
- `SupabaseModule` — `agent-core/src/supabase/supabase.module.ts`.

## Migraciones detectadas

- `supabase/migrations/20260713050133_initial_remote_schema.sql`
- `supabase/migrations/20260713052850_add_lead_scoring_columns.sql`
<!-- AUTO:END technical-evidence -->
