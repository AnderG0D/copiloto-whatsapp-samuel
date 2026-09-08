alter table public.response_drafts
  drop constraint response_drafts_status_check;

alter table public.response_drafts
  add constraint response_drafts_status_check
  check (status in ('PROPOSED', 'APPROVED', 'REJECTED'));

comment on table public.response_drafts is
  'AI-generated response drafts and their human review state; these rows do not represent sent WhatsApp messages.';

comment on column public.response_drafts.status is
  'PROPOSED awaits review; APPROVED or REJECTED records the terminal human review state.';

comment on table public.response_draft_decisions is
  'Immutable human decisions for response drafts; these rows do not represent sent WhatsApp messages.';

create or replace function public.review_response_draft(
  p_business_id uuid,
  p_response_draft_id uuid,
  p_operator_id text,
  p_decision text,
  p_final_text text default null
)
returns table (
  id uuid,
  business_id uuid,
  response_draft_id uuid,
  operator_id text,
  decision text,
  final_text text,
  decided_at timestamptz
)
language plpgsql
set search_path = public
as $function$
declare
  draft_status text;
  decision_id uuid;
begin
  if p_business_id is null or p_response_draft_id is null then
    raise exception 'business and response draft identifiers are required'
      using errcode = '22023';
  end if;

  if p_operator_id is null or length(btrim(p_operator_id)) = 0 then
    raise exception 'operator identifier must not be blank'
      using errcode = '22023';
  end if;

  if p_decision is null or p_decision not in (
    'APPROVE',
    'EDIT_AND_APPROVE',
    'REJECT'
  ) then
    raise exception 'unsupported response draft decision'
      using errcode = '22023';
  end if;

  if p_decision = 'EDIT_AND_APPROVE' then
    if p_final_text is null or length(btrim(p_final_text)) = 0 then
      raise exception 'EDIT_AND_APPROVE requires a non-blank final text'
        using errcode = '22023';
    end if;
  elsif p_final_text is not null then
    raise exception 'APPROVE and REJECT do not accept final text'
      using errcode = '22023';
  end if;

  select rd.status
    into draft_status
    from public.response_drafts as rd
   where rd.id = p_response_draft_id
     and rd.business_id = p_business_id
   for update;

  if not found then
    raise exception 'response draft not found'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
      from public.response_draft_decisions as existing_decision
     where existing_decision.response_draft_id = p_response_draft_id
  ) then
    raise exception using
      errcode = '23505',
      message = 'duplicate key value violates unique constraint "response_draft_decisions_response_draft_id_key"',
      constraint = 'response_draft_decisions_response_draft_id_key';
  end if;

  if draft_status <> 'PROPOSED' then
    raise exception 'response draft is not eligible for review'
      using errcode = 'P0001';
  end if;

  insert into public.response_draft_decisions (
    business_id,
    response_draft_id,
    operator_id,
    decision,
    final_text
  )
  values (
    p_business_id,
    p_response_draft_id,
    btrim(p_operator_id),
    p_decision,
    case
      when p_decision = 'EDIT_AND_APPROVE' then btrim(p_final_text)
      else null
    end
  )
  returning response_draft_decisions.id into decision_id;

  update public.response_drafts as rd
     set status = case
                    when p_decision = 'REJECT' then 'REJECTED'
                    else 'APPROVED'
                  end,
         updated_at = now()
   where rd.id = p_response_draft_id
     and rd.business_id = p_business_id;

  return query
  select decision_row.id,
         decision_row.business_id,
         decision_row.response_draft_id,
         decision_row.operator_id,
         decision_row.decision,
         decision_row.final_text,
         decision_row.decided_at
    from public.response_draft_decisions as decision_row
   where decision_row.id = decision_id;
end;
$function$;

revoke all on function public.review_response_draft(uuid, uuid, text, text, text)
  from public, anon, authenticated;

grant execute on function public.review_response_draft(uuid, uuid, text, text, text)
  to service_role;

comment on function public.review_response_draft(uuid, uuid, text, text, text) is
  'Atomically records one human response-draft decision and transitions the draft from PROPOSED to APPROVED or REJECTED. It never sends WhatsApp messages.';
