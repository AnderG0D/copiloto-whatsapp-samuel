---
type: technical-doc
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-09-03
---

# Arquitectura y Flujo Principal

## Modelo mental actualizado

```text
Evolution API = transporte de WhatsApp
NestJS = reglas, permisos y orquestación
Supabase = datos y archivos
AiProvider = capacidad de interpretación y redacción
Samuel = autoridad humana
```

## Implementación observada

<!-- AUTO:BEGIN architecture-state -->
![[Arquitectura actual]]
<!-- AUTO:END architecture-state -->

## Módulos planeados

- `ConversationContextModule`.
- `ResponseDraftModule`.
- `InventoryModule`.
- `AdminCommandsModule`.
- `ReportsModule`.
- `HumanHandoffModule`.
- `MediaModule`.
- `WhatsAppSenderModule`.

No documentar un módulo planeado como implementado hasta comprobarlo en el repositorio.

## Ruta del cliente

```mermaid
flowchart TD
    A["Mensaje del lead"] --> B["EvolutionWebhook"]
    B --> C["Persistir y scorear"]
    C --> D["Construir contexto seguro"]
    D --> E["Generar borrador"]
    E --> F["Revisión o regla de envío"]
```

Durante desarrollo, el flujo termina en el borrador.

En el piloto receive-only de Edgar, el flujo técnico ya puede persistir el
mensaje, scoring, contexto y `response_drafts.PROPOSED`. La revisión principal
del operador se diseñará en el panel web interno; WhatsApp solo puede emitir
una notificación o preview opcional al canal autorizado del operador.

```text
Panel web → NestJS autenticado → response_drafts / decisiones → sin acceso directo del frontend a Supabase
```

## Ruta administrativa

```mermaid
flowchart TD
    A["Mensaje de operador"] --> B{"Identidad autorizada"}
    B -- "No" --> C["Rechazar o tratar como lead"]
    B -- "Sí" --> D["AdminCommandService"]
    D --> E{"Lectura o mutación"}
    E -- "Lectura" --> F["Consultar y responder"]
    E -- "Mutación" --> G["Proponer y confirmar"]
```

## Límite de autoridad

| Pieza | Puede | No puede |
| --- | --- | --- |
| IA | Interpretar, extraer, resumir, redactar | Ejecutar SQL o enviar por sí sola |
| NestJS | Validar, consultar, autorizar, transaccionar | Inventar información faltante |
| Supabase | Persistir datos y archivos | Decidir reglas comerciales |
| Evolution API | Transportar mensajes y medios | Autorizar acciones de negocio |
| Samuel | Aprobar, corregir, tomar control | Ser identificado solo porque el texto dice “soy Samuel” |

## Modelo híbrido de revisión

- El panel web interno es la superficie principal para revisar borradores.
- Debe mostrar mensaje, scores, clasificación, razón, señales, contexto seguro
  y draft de Gemini.
- Las acciones son aprobar, editar y aprobar, o rechazar.
- `response_drafts` conserva la fuente de verdad.
- La revisión nunca habilita por sí sola el envío a leads.

## Flujo futuro de respuesta basada en inventario

```text
Lead pregunta
→ intención y filtros
→ InventoryQueryService
→ datos reales
→ ResponsePlanner
→ borrador con IDs de medios
→ validación
→ aprobación o regla segura
→ envío
```

## Flujo futuro de reportes

```text
Samuel pide reporte
→ autorización
→ consulta determinista
→ datos del periodo
→ formateador o resumen IA
→ respuesta a Samuel
```

## Seguridad estructural

- Separación por `business_id`.
- Operadores allowlisted.
- Acciones mutables con confirmación.
- `AUTO_SEND_MESSAGES=false` durante desarrollo y piloto inicial.
- No usar `raw_payload` como contexto de IA.
- Medios en almacenamiento privado.
- Logs sin secretos.
- Pruebas sin llamadas externas.
