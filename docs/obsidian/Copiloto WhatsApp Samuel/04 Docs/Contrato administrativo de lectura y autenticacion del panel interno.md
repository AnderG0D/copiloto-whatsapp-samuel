---
type: technical-contract
project: Copiloto WhatsApp Samuel
status: approved-documentation-only
updated: 2026-09-06
lifecycle: historical-superseded
current-state-source: docs/control/hito-4.6-runtime-evidence.json
---

# Contrato administrativo de lectura y autenticación del panel interno

> [!warning] Checkpoint histórico de diseño
> Esta nota conserva el diseño aprobado el 2026-09-06 antes de la implementación del panel. Las afirmaciones que indican “no implementado” o “implementación no autorizada” describen ese checkpoint histórico y no el estado runtime vigente. El estado actual del panel y su evidencia posterior están en `docs/control/hito-4.6-runtime-evidence.json`.

## Objetivo

Registrar el contrato administrativo mínimo de lectura y el modelo de autenticación provisional aprobados para el futuro panel web interno. El panel será el centro principal de revisión; WhatsApp queda como notificación o atajo opcional.

## Alcance

Esta nota define únicamente el diseño aprobado para la primera demo: bandeja de borradores, detalle agregado, uso posterior de la revisión existente, proyección segura, autorización por negocio, autenticación y recarga manual. No crea una interfaz, rutas, DTOs, sesión, cookie, BFF/proxy, CORS, migración ni cambio de runtime.

## Hechos verificados

- `response_drafts` y Supabase son la fuente de verdad para los borradores y su estado.
- La evidencia exploratoria previa confirma que no existe frontend ni framework UI y que no existen endpoints GET administrativos de lectura.
- La ruta de revisión ya registrada para reutilización futura es `POST /admin/businesses/:businessId/response-drafts/:responseDraftId/reviews` con `APPROVE`, `EDIT_AND_APPROVE` y `REJECT`.
- Edgar permanece en receive-only; aprobar, editar/aprobar o rechazar un draft no envía un mensaje a un lead.
- La migración local de transición está `NOT_VERIFIED`; esta nota no la aplica ni la modifica.

## Diseño aprobado

- El navegador se comunicará exclusivamente con NestJS; no consultará Supabase directamente.
- NestJS conservará el control de autorización, reglas de negocio, proyecciones seguras y resolución de `operatorId`.
- La primera demo usará recarga manual. Polling, SSE y WebSocket son mejoras posteriores.
- El detalle incluirá la decisión existente si la hay. El modelo actual admite una decisión por draft; no se inventa historial paginable ni persistencia de errores de revisión.

## Rutas propuestas

Estas rutas son propuestas de contrato; ambas permanecen `NOT_IMPLEMENTED`.

```text
GET /admin/businesses/:businessId/response-drafts
GET /admin/businesses/:businessId/response-drafts/:responseDraftId
```

La bandeja tendrá `status=PROPOSED` por defecto, cursor opaco, `limit=25` por defecto y máximo propuesto de `100`, ordenada por `createdAt desc`. Cada consulta valida primero que el operador está autorizado para el negocio solicitado antes de acceder a datos relacionados.

La proyección conceptual de la bandeja es:

```text
id
businessId
status
createdAt
updatedAt
draftTextPreview
sourceMessage: id, contentPreview, createdAt
lead: score, classification
```

Los nombres definitivos deben alinearse con tipos y relaciones existentes; no se autorizan columnas inventadas.

El detalle agregado propuesto incluirá draft, negocio, mensaje fuente, resumen seguro del lead, score, clasificación, razón, señales detectadas, timestamps, contexto limitado y decisión existente. El contexto inicial será de hasta diez mensajes, ordenados cronológicamente y restringidos al mismo negocio y lead. No se propone todavía una ruta separada de contexto.

La futura ruta de historial queda solo como propuesta:

```text
GET /admin/businesses/:businessId/response-drafts/:responseDraftId/reviews
```

## Revisión posterior

La UI futura reutilizará posteriormente la ruta existente:

```text
POST /admin/businesses/:businessId/response-drafts/:responseDraftId/reviews
```

```json
{ "decision": "APPROVE" }
```

```json
{ "decision": "EDIT_AND_APPROVE", "finalText": "..." }
```

```json
{ "decision": "REJECT" }
```

No se agrega motivo de rechazo porque el contrato actual no lo soporta. La UI tratará un `409` como conflicto de revisión y recargará el detalle. Ninguna de estas decisiones equivale a enviar un mensaje a un lead.

## Proyecciones

Campos permitidos, siempre sujetos a autorización por negocio: texto del draft, texto del mensaje fuente, contexto limitado, estado, timestamps, score, clasificación, razón, señales, dirección, rol y nombre/tipo del negocio cuando sean necesarios.

Datos minimizados: nombre del lead, identificadores internos, texto completo fuera del detalle, `lastMessage` y `lastMessageAt`.

Datos prohibidos:

```text
raw_payload
teléfono
JID
external_message_id
evolution_instance_name
tokens
credenciales
claves de Supabase
datos de otros negocios
datos no relacionados con el draft
```

## Autenticación

Decisión provisional aprobada para la primera demo:

- BFF/proxy en NestJS.
- Sesión web mediante cookie `HttpOnly`, `Secure` y `SameSite` apropiado.
- `ADMIN_REVIEW_TOKEN` permanece exclusivamente del lado servidor.
- El navegador nunca recibe ni almacena el bearer estático.
- `operatorId` se resuelve en servidor.
- Puede mantenerse temporalmente una allowlist estática por negocio para un único operador.

La migración posterior a identidad real, membresías o SSO queda fuera de este checkpoint.

## Autorización por negocio

Toda lectura y revisión valida el negocio autorizado antes de recuperar el draft, su mensaje fuente, lead, contexto o decisión. La autorización no se infiere del `businessId` proporcionado por el navegador y nunca permite proyectar datos de otros negocios.

## Alternativas descartadas temporalmente

- Acceso directo del navegador a Supabase.
- Entregar `ADMIN_REVIEW_TOKEN` o cualquier bearer estático al navegador.
- WhatsApp como superficie primaria de revisión.
- Polling, SSE o WebSocket para la primera demo.
- Rutas independientes de contexto e historial paginable.
- Motivo de rechazo o persistencia de errores de revisión sin soporte actual.

## Trade-offs

La recarga manual reduce complejidad, pero no ofrece actualización inmediata. El detalle agregado evita múltiples llamadas iniciales, a cambio de exigir una proyección y autorización cuidadosas. La allowlist de operador único acelera la demo, pero no sustituye identidad real ni membresías.

## Riesgos

- Exponer campos no permitidos por una proyección demasiado amplia.
- Omitir la comprobación de pertenencia al negocio antes de cargar relaciones.
- Confundir aprobación con envío; el runtime permanece receive-only y con cero envíos a leads.
- Implementar autenticación o CORS antes de revisar este contrato en su checkpoint autorizado.

## Secuencia futura

1. Revisar nuevamente este diseño y autorizar un checkpoint de implementación limitado.
2. Implementar primero autorización, proyecciones y contratos GET con pruebas aisladas.
3. Implementar la autenticación web provisional y el BFF/proxy en NestJS cuando se autorice.
4. Crear el frontend y conectar únicamente los contratos autorizados.
5. Evaluar identidad real, membresías o SSO como una decisión posterior.

## Límites explícitos

Diseño aprobado: sí.

Implementación: no autorizada en este checkpoint.

No se autorizan frontend, endpoints GET, autenticación, cookies, BFF/proxy, CORS, DTOs, migraciones, servicios ni cambios runtime. Edgar permanece en receive-only y los envíos a leads siguen en cero.

## Aprobación humana de Hiram

Hiram aprobó este diseño el 2026-09-06. La aprobación es documental y no autoriza implementación. El siguiente checkpoint deberá volver a revisar este contrato antes de implementar cualquier parte.

Relaciones:

- [[Modelo operativo hibrido - Automatizacion y relevo humano]]
- [[Arquitectura y Flujo Principal]]
