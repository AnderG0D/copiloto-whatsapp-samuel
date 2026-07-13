alter table public.messages
  add column if not exists detected_signals jsonb,
  add column if not exists classification_reason text;

alter table public.leads
  add column if not exists classification_reason text;