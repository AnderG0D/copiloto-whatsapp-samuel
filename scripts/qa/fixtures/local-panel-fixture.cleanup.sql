-- Limpieza del fixture de QA únicamente local.
-- No elimina decisiones de revisión; si existe una, la FK restrictiva impedirá
-- borrar el draft para evitar eliminar historial de revisión.

begin;

delete from public.response_drafts
 where id = '00000000-0000-4000-8000-000000000005'::uuid;

delete from public.messages
 where id in (
   '00000000-0000-4000-8000-000000000003'::uuid,
   '00000000-0000-4000-8000-000000000004'::uuid
 );

delete from public.leads
 where id = '00000000-0000-4000-8000-000000000002'::uuid;

delete from public.businesses
 where id = '00000000-0000-4000-8000-000000000001'::uuid;

commit;
