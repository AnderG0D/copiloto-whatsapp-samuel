---
type: product-doc
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-07-31
---

# Visión y Roadmap del Producto

## Visión

Construir un copiloto comercial por WhatsApp que atienda leads, recuerde la conversación, use información real del negocio y permita a Samuel operar ventas e inventario de forma segura.

El primer negocio es `Autos Samuel Ford`; la base debe poder reutilizarse para bienes raíces y otras industrias.

## Dos experiencias del producto

### Cliente

- Pregunta por vehículos.
- Recibe datos y medios autorizados.
- Comparte texto, audio, imágenes o documentos.
- Avanza hacia cita o intervención humana.

### Samuel

- Consulta inventario.
- Propone y confirma cambios.
- Pide reportes.
- Revisa leads prioritarios.
- Toma o libera conversaciones.
- Autoriza acciones delicadas.

## Principios

1. Universal primero; específico después.
2. Calidad > velocidad.
3. La IA interpreta y redacta; NestJS decide y ejecuta.
4. Precios, disponibilidad y archivos vienen de fuentes confiables.
5. La automatización se activa de manera gradual.
6. Cada mutación es autenticada, validada y auditable.
7. Los reportes calculan datos fuera de la IA.

## Estado construido

<!-- AUTO:BEGIN roadmap-state -->
![[Estado actual]]
<!-- AUTO:END roadmap-state -->

## Roadmap recomendado

### Fase 2 — IA de texto segura

#### Hito 4.2 — Contexto y borradores aislados

- Contexto seguro.
- Historial limitado.
- Borrador interno con `AI_PROVIDER`.
- Sin persistencia ni envío.

#### Hito 4.3 — Persistencia e integración sin envío

- Tabla o estado de borradores.
- Integración después del scoring.
- Trazabilidad.
- `AUTO_SEND_MESSAGES=false`.

#### Hito 4.4 — Revisión y aprobación humana

- Samuel puede aprobar, editar o rechazar.
- El sistema registra la decisión.
- Todavía sin automatización general.

### Fase 3 — Inventario confiable

#### Hito 5.1 — Modelo y consultas

- `inventory_items`.
- `vehicle_details`.
- Búsquedas probadas.
- Datos ficticios.

#### Hito 5.2 — Medios y documentos

- `inventory_media`.
- `inventory_documents`.
- Almacenamiento privado.
- Autorización de archivos.

#### Hito 5.3 — Consultas administrativas por WhatsApp

- Identidad allowlisted.
- `/stock`.
- Búsqueda natural.
- Solo lectura.

#### Hito 5.4 — Mutaciones confirmadas

- Propuestas de cambio.
- Confirmación con ID.
- Auditoría.
- Idempotencia.
- Eliminación lógica.

#### Hito 5.5 — Respuestas basadas en inventario

- Consultar inventario real.
- Generar plan de respuesta.
- Resolver archivos reales.
- Sin inventar datos.

### Fase 4 — Operación de Samuel

#### Hito 6.1 — Reportes bajo demanda

- Resumen del día.
- Prioridades.
- Sin respuesta.
- Interés por modelo.

#### Hito 6.2 — Transferencia y pausa

- Tomar conversación.
- Pausar bot.
- Liberar conversación.
- Auditoría.

#### Hito 6.3 — Resumen diario programado

- Misma consulta probada.
- Horario del negocio.
- Solo para operadores autorizados.

### Fase 5 — Multimodalidad

- Hito 7.1 — Audio.
- Hito 7.2 — Imágenes.
- Hito 7.3 — Documentos y PDF.
- Hito 7.4 — Envío controlado de medios.

### Fase 6 — Piloto y producción

- Piloto supervisado.
- Métricas de calidad y costo.
- Automatización de casos seguros.
- Observabilidad.
- Privacidad y retención.
- Escalamiento multiindustria.

## MVP vendible

- Historial y scoring.
- Borradores útiles.
- Inventario real consultable.
- Fotos autorizadas.
- Aviso y transferencia a Samuel.
- `/stock`.
- Cambios de inventario confirmados.
- `/resumen_hoy`.
- Operación supervisada.

## Fuera del MVP inicial

- Envíos masivos.
- Descuentos automáticos.
- Borrado físico desde WhatsApp.
- Procesamiento de documentos sensibles sin políticas.
- Autonomía total.
- Multiusuario completo con planes y cobros.
