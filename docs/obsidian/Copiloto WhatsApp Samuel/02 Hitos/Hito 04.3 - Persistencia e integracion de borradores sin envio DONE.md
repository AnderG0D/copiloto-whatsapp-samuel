---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
fase: Fase 2 — IA de texto segura
hito: 4.3
completed: 2026-08-03
updated: 2026-08-04
aliases:
  - Hito 4.3 - Persistencia e integracion sin envio
  - Hito 4.3 - Borradores persistentes
---

# Hito 4.3 — Persistencia e integración de borradores sin envío

## Objetivo alcanzado

Persistir de forma trazable los borradores `PROPOSED` e integrarlos al flujo entrante después del scoring, manteniendo `AUTO_SEND_MESSAGES=false`.

## Resultado alcanzado

```text
mensaje guardado y scoreado
→ contexto seguro
→ borrador PROPOSED
→ persistencia trazable
→ sin envío
```

El sistema genera y persiste candidatos de respuesta, pero todavía no permite aprobarlos, editarlos, rechazarlos ni enviarlos a WhatsApp.

## Alcance completado

- Tabla persistente `response_drafts`.
- Relación trazable con negocio, lead y mensaje entrante.
- Integración después del scoring.
- Registro de `ResponseDraftService`, `ResponseDraftRepository` y `AI_PROVIDER`.
- Manejo de duplicados y fallos parciales.
- Pruebas unitarias y e2e con servicios externos simulados.
- `AUTO_SEND_MESSAGES=false` durante todo el hito.
- Estado observado del emisor: `sender=false`.

La migración `20260802111346_create_response_drafts.sql` sí fue aplicada y verificada en Supabase remoto durante el PR #15. Este hito no realizó envíos reales ni activó infraestructura de envío.

## Progreso observado

<!-- AUTO:BEGIN milestone-progress -->
- [x] 4.3-A — Persistencia trazable de borradores PROPOSED.
- [x] 4.3-B — Registro de la capa de IA y borradores en NestJS.
- [x] 4.3-C — Integración después del scoring sin envío.
- [x] 4.3-D — Pruebas de persistencia, idempotencia y ausencia de envío.
<!-- AUTO:END milestone-progress -->

## Checkpoints completados

### 4.3-A — Persistencia trazable de borradores PROPOSED

Se creó `response_drafts` con:

- relación con `businesses`, `leads` y `messages`;
- texto obligatorio y no vacío;
- estado restringido a `PROPOSED`;
- un solo borrador por `source_message_id`;
- índices por negocio y por lead/fecha;
- RLS activado;
- tipos de Supabase actualizados.

### 4.3-B — Registro de la capa de IA y borradores en NestJS

`ResponseDraftModule` registra y exporta:

- `ConversationContextBuilder`;
- `ResponseDraftService`;
- `ResponseDraftRepository`;
- `GeminiProvider` mediante `AI_PROVIDER`;
- `SupabaseModule`.

### 4.3-C — Integración después del scoring sin envío

El webhook:

1. valida el evento entrante;
2. localiza el negocio;
3. crea o actualiza el lead;
4. calcula el scoring;
5. guarda el mensaje;
6. construye contexto seguro;
7. genera un borrador;
8. lo persiste como `PROPOSED`;
9. termina sin enviar WhatsApp.

Si falla la IA o la persistencia del borrador, el mensaje entrante y su scoring permanecen guardados.

### 4.3-D — Pruebas, idempotencia y ausencia de envío

Se comprobó:

- generación y persistencia exitosa;
- contexto seguro;
- ausencia de un segundo borrador para mensajes duplicados;
- fallo controlado del proveedor de IA;
- fallo controlado de persistencia;
- mapeo camelCase a snake_case;
- registro y exportación del módulo;
- e2e con proveedor falso;
- ausencia de llamadas externas reales;
- ausencia de envío.

## Evidencia GitHub

- [PR #15 — Persistencia de borradores sin envío](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/15), merge `a6c5ab4`.
- [PR #16 — Corrección de evidencia documental](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/16), merge `ad7cb62`.
- [PR #18 — Detección de integración indirecta con IA](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/18), merge `cea0cb7`.
- [PR #19 — Sincronización documental correcta](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/19), merge `e065655`.

El PR #17 fue cerrado sin merge y no se utiliza como evidencia positiva.

## Validación final

- **Unitarias:** 82/82 aprobadas.
- **E2E:** 1/1 aprobada.
- **Build:** aprobado.
- **Documentación automática:** aprobada.
- **Envío automático:** desactivado.
- **`AUTO_SEND_MESSAGES`:** `false`.
- **`sender`:** `false`.

## No incluye

- Envío de WhatsApp.
- Aprobación, edición o rechazo humano.
- Autenticación de operadores.
- Interfaz administrativa.
- Inventario, precios o disponibilidad.
- Audio, imágenes, documentos u otra multimedia.
- `AUTO_SEND_MESSAGES=true`.

## Reglas de seguridad conservadas

- La IA genera candidatos; NestJS controla los efectos de negocio.
- Las pruebas usan mocks, fakes o datos ficticios.
- No se entregan payloads crudos al proveedor de IA.
- Aprobar un borrador todavía no existe y, cuando exista, no significará enviarlo.
- `AUTO_SEND_MESSAGES=false` permanece como condición obligatoria.

## DONE cuando

- [x] Los cuatro checkpoints cuentan con evidencia verificable.
- [x] La persistencia conserva borradores `PROPOSED` con trazabilidad.
- [x] La integración ocurre después del scoring y es idempotente.
- [x] Las pruebas confirman ausencia de envío y de llamadas externas reales.
- [x] Unitarias, e2e, build y validaciones del repositorio están aprobadas.
- [x] El hito está fusionado y su documentación de cierre coincide con GitHub.

## Lo que sigue

**Hito 4.4 — Revisión y aprobación humana.**

Antes de comenzar técnicamente 4.4-A se implementará, en un PR independiente, el sistema determinista de relevo automático entre hitos.

> La IA propone. NestJS controla. El humano decide. Aprobar todavía no envía.
