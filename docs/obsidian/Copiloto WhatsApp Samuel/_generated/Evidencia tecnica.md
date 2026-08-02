---
type: generated-technical-evidence
project: Copiloto WhatsApp Samuel
generated: true
updated: 2026-08-02
---

# Evidencia técnica

<!-- AUTO:BEGIN technical-evidence -->
## Revisión observada

- Fuente: `main` en `22040b4`, asociado al [PR #11](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/11).
- Commit completo: `22040b4d356324f5a6092947ae968be47e8a61b1`.
- Mensaje: ci: open protected documentation sync PRs (#11).
- Ejecución de CI: [abrir evidencia](https://github.com/AnderG0D/copiloto-whatsapp-samuel/actions/runs/30739571530).

## Validación

- **Unitarias:** `APROBADO` — 72 casos ejecutados.
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
