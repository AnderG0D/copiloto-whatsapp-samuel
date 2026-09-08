-- Limpieza del fixture de QA únicamente local para probar acciones de revisión.
-- No elimina decisiones, negocio, lead ni el draft aprobado existente ...0005.

begin;

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
    raise exception 'QA review fixture cleanup refused: a draft has an associated decision';
  end if;
end;
$$;

delete from public.response_drafts
 where id in (
   '00000000-0000-4000-8000-000000000008'::uuid,
   '00000000-0000-4000-8000-000000000009'::uuid
 );

delete from public.messages
 where id in (
   '00000000-0000-4000-8000-000000000006'::uuid,
   '00000000-0000-4000-8000-000000000007'::uuid
 );

commit;
