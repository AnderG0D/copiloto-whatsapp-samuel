---
type: database-doc
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-07-31
---

# Modelo de Datos SaaS

> [!important]
> Esta nota separa lo confirmado de lo propuesto. Las migraciones de `main` son la fuente autoritativa.

## Modelo actual confirmado

```text
businesses
├─ leads
└─ messages
```

### `businesses`

- `id`
- `name`
- `business_type`
- `evolution_instance_name`
- `active`
- timestamps

### `leads`

- `business_id`
- `phone`
- `name`
- `score`
- `classification`
- `status`
- `last_message`
- `last_message_at`
- `classification_reason`
- timestamps

Unicidad:

```text
business_id + phone
```

### `messages`

- `business_id`
- `lead_id`
- `phone`
- `direction`
- `role`
- `content`
- `external_message_id`
- `score`
- `classification`
- `detected_signals`
- `classification_reason`
- `raw_payload`
- `created_at`

## Extensión propuesta para borradores

### `response_drafts`

No corresponde al Hito 4.2 aislado; se evaluará en el Hito 4.3.

- `id`
- `business_id`
- `lead_id`
- `source_message_id`
- `text`
- `status`: `PROPOSED`, `APPROVED`, `EDITED`, `REJECTED`, `EXPIRED`
- `approved_by`
- `created_at`
- `updated_at`

## Extensión propuesta para operadores

### `business_operators`

- `id`
- `business_id`
- `display_name`
- `whatsapp_jid` o identificador normalizado
- `role`: `OWNER`, `ADMIN`, `VIEWER`
- `active`
- `created_at`
- `updated_at`

El teléfono o JID identifica al operador; la IA no decide quién es Samuel.

## Inventario híbrido

La estructura recomendada cumple:

```text
Universal primero.
Específico después.
```

### `inventory_items`

Campos universales:

- `id`
- `business_id`
- `item_type`
- `title`
- `status`: `DRAFT`, `AVAILABLE`, `RESERVED`, `SOLD`, `INACTIVE`, `ARCHIVED`
- `price`
- `currency`
- `description`
- `visibility`
- `version`
- `last_verified_at`
- timestamps

### `vehicle_details`

Extensión uno-a-uno para autos:

- `inventory_item_id`
- `brand`
- `model`
- `trim`
- `year`
- `color`
- `transmission`
- `mileage`
- `condition`
- `stock_number`
- metadatos específicos permitidos

No usar el VIN completo en respuestas o logs. Si se almacena, debe tener una necesidad operativa y acceso restringido.

### `inventory_media`

- `id`
- `business_id`
- `inventory_item_id`
- `storage_path`
- `media_type`
- `position`
- `caption`
- `status`: `PENDING`, `APPROVED`, `REJECTED`, `ARCHIVED`
- `checksum`
- timestamps

### `inventory_documents`

- `id`
- `business_id`
- `inventory_item_id`
- `document_type`
- `storage_path`
- `version`
- `status`
- timestamps

### `inventory_actions`

Auditoría y confirmación:

- `id`
- `business_id`
- `inventory_item_id`
- `action_type`
- `status`: `PENDING_CONFIRMATION`, `CONFIRMED`, `EXECUTED`, `REJECTED`, `EXPIRED`, `FAILED`
- `requested_by_operator_id`
- `confirmed_by_operator_id`
- `before_data`
- `proposed_data`
- `result_data`
- `idempotency_key`
- `expires_at`
- timestamps

## Reportes

Los reportes pueden empezar como consultas y tipos de aplicación sin tabla nueva.

Si se necesita auditoría:

### `report_runs`

- `id`
- `business_id`
- `report_type`
- `requested_by_operator_id`
- `period_start`
- `period_end`
- `parameters`
- `result_summary`
- `created_at`

## Restricciones transversales

- Todas las tablas operativas llevan `business_id`.
- Índices por negocio, estado y tiempo.
- Claves foráneas explícitas.
- Eliminación lógica para inventario.
- Versionado optimista para mutaciones.
- IDs externos e idempotencia para eventos.
- RLS y permisos mínimos cuando se exponga acceso fuera del backend.
- Storage privado separado lógicamente por negocio.

## Fuentes oficiales

- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Control de acceso de Storage](https://supabase.com/docs/guides/storage/security/access-control)
