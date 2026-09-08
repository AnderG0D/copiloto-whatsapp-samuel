-- Fixture de QA únicamente local para probar EDIT_AND_APPROVE y REJECT en /admin/panel.
-- No es una migración. Ejecutar solo contra la instancia local de Supabase.
-- Este fixture no crea decisiones: las acciones del panel deben crearlas.

begin;

do $$
begin
  if not exists (
    select 1
      from public.businesses
     where id = '00000000-0000-4000-8000-000000000001'::uuid
  ) then
    raise exception 'QA fixture requires the synthetic business 00000000-0000-4000-8000-000000000001';
  end if;

  if not exists (
    select 1
      from public.leads
     where id = '00000000-0000-4000-8000-000000000002'::uuid
       and business_id = '00000000-0000-4000-8000-000000000001'::uuid
  ) then
    raise exception 'QA fixture requires the synthetic lead 00000000-0000-4000-8000-000000000002 for the synthetic business';
  end if;

  if exists (
    select 1
      from public.response_drafts
     where id in (
       '00000000-0000-4000-8000-000000000008'::uuid,
       '00000000-0000-4000-8000-000000000009'::uuid
     )
  ) then
    raise exception 'QA review fixture draft IDs already exist; refusing to reset them';
  end if;

  if exists (
    select 1
      from public.messages
     where id in (
       '00000000-0000-4000-8000-000000000006'::uuid,
       '00000000-0000-4000-8000-000000000007'::uuid
     )
  ) then
    raise exception 'QA review fixture message IDs already exist; refusing to overwrite them';
  end if;
end;
$$;

insert into public.messages (
  id,
  business_id,
  lead_id,
  phone,
  direction,
  content,
  external_message_id,
  raw_payload,
  created_at,
  score,
  classification,
  classification_reason,
  detected_signals,
  role
)
values
(
  '00000000-0000-4000-8000-000000000006'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  'local-fixture-qa-lead',
  'IN',
  '[QA LOCAL] Mensaje sintético para probar EDIT_AND_APPROVE en el panel; no representa una conversación real.',
  null,
  null,
  '2026-01-15 15:10:00+00'::timestamptz,
  45,
  'WARM',
  'Clasificación sintética del fixture local de QA.',
  '["qa_local", "edit_and_approve"]'::jsonb,
  'customer'
),
(
  '00000000-0000-4000-8000-000000000007'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  'local-fixture-qa-lead',
  'IN',
  '[QA LOCAL] Mensaje sintético para probar REJECT en el panel; no representa una conversación real.',
  null,
  null,
  '2026-01-15 15:11:00+00'::timestamptz,
  45,
  'WARM',
  'Clasificación sintética del fixture local de QA.',
  '["qa_local", "reject"]'::jsonb,
  'customer'
);

insert into public.response_drafts (
  id,
  business_id,
  lead_id,
  source_message_id,
  text,
  status,
  created_at,
  updated_at
)
values
(
  '00000000-0000-4000-8000-000000000008'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000006'::uuid,
  '[QA LOCAL] Borrador sintético para EDIT_AND_APPROVE. El texto final debe ser proporcionado manualmente desde el panel; no confirma inventario, precio ni disponibilidad reales.',
  'PROPOSED',
  '2026-01-15 15:12:00+00'::timestamptz,
  '2026-01-15 15:12:00+00'::timestamptz
),
(
  '00000000-0000-4000-8000-000000000009'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000007'::uuid,
  '[QA LOCAL] Borrador sintético para REJECT. Este contenido es de prueba y no debe enviarse ni interpretarse como información comercial real.',
  'PROPOSED',
  '2026-01-15 15:13:00+00'::timestamptz,
  '2026-01-15 15:13:00+00'::timestamptz
);

do $$
begin
  if exists (
    select 1
      from public.response_draft_decisions
     where response_draft_id in (
       '00000000-0000-4000-8000-000000000008'::uuid,
       '00000000-0000-4000-8000-000000000009'::uuid
     )
  ) then
    raise exception 'QA review fixture drafts must start without response draft decisions';
  end if;
end;
$$;

commit;
