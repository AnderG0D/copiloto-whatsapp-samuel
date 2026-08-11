alter table public.response_drafts
  add constraint response_drafts_id_business_id_key
  unique (id, business_id);

create table public.response_draft_decisions (
  id uuid primary key default gen_random_uuid(),

  business_id uuid not null,
  response_draft_id uuid not null,

  operator_id text not null
    constraint response_draft_decisions_operator_id_not_blank
    check (length(btrim(operator_id)) > 0),

  decision text not null
    constraint response_draft_decisions_decision_check
    check (decision in ('APPROVE', 'EDIT_AND_APPROVE', 'REJECT')),

  final_text text,
  decided_at timestamptz not null default now(),

  constraint response_draft_decisions_response_draft_id_key
    unique (response_draft_id),

  constraint response_draft_decisions_response_draft_business_id_fkey
    foreign key (response_draft_id, business_id)
    references public.response_drafts (id, business_id)
    on delete restrict,

  constraint response_draft_decisions_final_text_check
    check (
      (
        decision = 'EDIT_AND_APPROVE'
        and final_text is not null
        and length(btrim(final_text)) > 0
      )
      or (
        decision in ('APPROVE', 'REJECT')
        and final_text is null
      )
    )
);

create index response_draft_decisions_business_id_decided_at_idx
  on public.response_draft_decisions (business_id, decided_at desc);

alter table public.response_draft_decisions enable row level security;

revoke update, delete, truncate
  on table public.response_draft_decisions
  from anon, authenticated, service_role;

comment on table public.response_draft_decisions is
  'Immutable human decisions for PROPOSED response drafts; these rows do not represent sent messages.';

comment on column public.response_draft_decisions.operator_id is
  'Opaque stable operator identifier supplied by a trusted authentication context; intentionally has no user foreign key in Hito 4.4-A.';

comment on column public.response_draft_decisions.final_text is
  'Edited final text for EDIT_AND_APPROVE; APPROVE uses the original response_drafts.text and REJECT has no final text.';
