create table public.authorized_leads (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null
    references public.businesses(id) on delete cascade,

  phone text not null
    constraint authorized_leads_phone_normalized_check
    check (phone ~ '^[0-9]+$'),

  label text,
  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint authorized_leads_business_id_phone_key
    unique (business_id, phone)
);

create index authorized_leads_business_id_active_phone_idx
  on public.authorized_leads (business_id, is_active, phone);

alter table public.authorized_leads enable row level security;

comment on table public.authorized_leads is
  'Business-scoped allowlist for inbound WhatsApp leads. Only active rows authorize persistence and AI candidate generation.';

comment on column public.authorized_leads.phone is
  'Normalized individual WhatsApp phone identity: digits only, without a JID suffix.';
