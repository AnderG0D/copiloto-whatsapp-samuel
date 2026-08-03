create table public.response_drafts (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  lead_id uuid not null
    references public.leads(id) on delete cascade,

  source_message_id uuid not null
    references public.messages(id) on delete cascade,

  text text not null
    constraint response_drafts_text_not_blank
    check (length(btrim(text)) > 0),

  status text not null default 'PROPOSED'
    constraint response_drafts_status_check
    check (status = 'PROPOSED'),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint response_drafts_source_message_id_key
    unique (source_message_id)
);

create index response_drafts_business_id_idx
  on public.response_drafts (business_id);

create index response_drafts_lead_id_created_at_idx
  on public.response_drafts (lead_id, created_at desc);

alter table public.response_drafts enable row level security;

comment on table public.response_drafts is
  'AI-generated response drafts pending human review; these rows do not represent sent WhatsApp messages.';

comment on column public.response_drafts.source_message_id is
  'Incoming message that originated the draft.';