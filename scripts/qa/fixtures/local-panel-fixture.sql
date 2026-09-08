-- Fixture de QA únicamente local para la bandeja y el detalle de /admin/panel.
-- No es una migración. Ejecutar solo contra la instancia local de Supabase.

begin;

insert into public.businesses (
  id,
  name,
  business_type,
  evolution_instance_name,
  active,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Concesionaria Ficticia QA Local',
  'cars',
  null,
  true,
  '2026-01-15 15:00:00+00'::timestamptz,
  '2026-01-15 15:00:00+00'::timestamptz
)
on conflict (id) do update
set name = excluded.name,
    business_type = excluded.business_type,
    evolution_instance_name = excluded.evolution_instance_name,
    active = excluded.active,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

insert into public.leads (
  id,
  business_id,
  phone,
  name,
  score,
  classification,
  classification_reason,
  status,
  last_message,
  last_message_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  'local-fixture-lead',
  null,
  42,
  'WARM',
  'Clasificación sintética del fixture local de QA.',
  'ACTIVE',
  'También me interesa saber si puedo ver el sedán ficticio de prueba esta semana.',
  '2026-01-15 15:05:00+00'::timestamptz,
  '2026-01-15 15:00:00+00'::timestamptz,
  '2026-01-15 15:05:00+00'::timestamptz
)
on conflict (id) do update
set business_id = excluded.business_id,
    phone = excluded.phone,
    name = excluded.name,
    score = excluded.score,
    classification = excluded.classification,
    classification_reason = excluded.classification_reason,
    status = excluded.status,
    last_message = excluded.last_message,
    last_message_at = excluded.last_message_at,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

insert into public.messages (
  id,
  business_id,
  lead_id,
  phone,
  direction,
  content,
  created_at,
  score,
  classification,
  classification_reason,
  detected_signals,
  role
)
values (
  '00000000-0000-4000-8000-000000000004'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  'local-fixture-lead',
  'IN',
  'Estoy comparando opciones y quisiera conocer el rango de precio del sedán ficticio de prueba.',
  '2026-01-15 15:00:00+00'::timestamptz,
  38,
  'WARM',
  'Interés sintético en una opción automotriz de prueba.',
  '["vehicle_interest", "price_question"]'::jsonb,
  'customer'
)
on conflict (id) do update
set business_id = excluded.business_id,
    lead_id = excluded.lead_id,
    phone = excluded.phone,
    direction = excluded.direction,
    content = excluded.content,
    external_message_id = excluded.external_message_id,
    raw_payload = excluded.raw_payload,
    created_at = excluded.created_at,
    score = excluded.score,
    classification = excluded.classification,
    classification_reason = excluded.classification_reason,
    detected_signals = excluded.detected_signals,
    role = excluded.role;

insert into public.messages (
  id,
  business_id,
  lead_id,
  phone,
  direction,
  content,
  created_at,
  score,
  classification,
  classification_reason,
  detected_signals,
  role
)
values (
  '00000000-0000-4000-8000-000000000003'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  'local-fixture-lead',
  'IN',
  'También me interesa saber si puedo ver el sedán ficticio de prueba esta semana.',
  '2026-01-15 15:05:00+00'::timestamptz,
  42,
  'WARM',
  'Interés sintético en disponibilidad y visita de prueba.',
  '["vehicle_interest", "visit_question"]'::jsonb,
  'customer'
)
on conflict (id) do update
set business_id = excluded.business_id,
    lead_id = excluded.lead_id,
    phone = excluded.phone,
    direction = excluded.direction,
    content = excluded.content,
    external_message_id = excluded.external_message_id,
    raw_payload = excluded.raw_payload,
    created_at = excluded.created_at,
    score = excluded.score,
    classification = excluded.classification,
    classification_reason = excluded.classification_reason,
    detected_signals = excluded.detected_signals,
    role = excluded.role;

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
values (
  '00000000-0000-4000-8000-000000000005'::uuid,
  '00000000-0000-4000-8000-000000000001'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid,
  '00000000-0000-4000-8000-000000000003'::uuid,
  '¡Claro! El sedán ficticio de prueba está disponible para una visita de demostración en nuestro horario de QA. Podemos revisar juntos sus características y resolver tus dudas; esta respuesta es solo un ejemplo local y no confirma inventario ni precio reales.',
  'PROPOSED',
  '2026-01-15 15:06:00+00'::timestamptz,
  '2026-01-15 15:06:00+00'::timestamptz
)
on conflict (id) do update
set business_id = excluded.business_id,
    lead_id = excluded.lead_id,
    source_message_id = excluded.source_message_id,
    text = excluded.text,
    status = excluded.status,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at;

commit;
