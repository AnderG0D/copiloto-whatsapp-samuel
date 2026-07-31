---
type: project-moc
project: Copiloto WhatsApp Samuel
system: Pensar-Hacer v1
status: active
updated: 2026-07-31
aliases:
  - Copiloto WhatsApp Samuel
  - Proyecto Copiloto Samuel
---

# Copiloto WhatsApp Samuel — MOC

> [!summary] Propósito
> Índice central del proyecto. El código y GitHub prueban qué existe; este MOC organiza el conocimiento necesario para entenderlo y continuarlo.

## Ejecutar

- [[01 Panel de Proyecto - Copiloto WhatsApp Samuel]]

<!-- AUTO:BEGIN operational-links -->
- [[Estado actual]]
- [[Evidencia tecnica]]
- [[Siguiente accion]]
<!-- AUTO:END operational-links -->

## Hitos

### Cerrados

- [[Hito 02 - Primer Flujo Programable DONE]]
- [[Hito 03 - Score y Clasificacion Basica DONE]]
- [[Hito 03.2 - Score y Clasificacion Avanzada DONE]]

### Actual

- [[Hito 04.1 - Abstraccion IA y Gemini DONE]]
- [[Hito 04.2 - Contexto y borradores seguros de respuesta ACTIVE]]

## Decisiones

- [[ADR 001 - Multiindustria desde el Dia 1]]
- [[ADR 002 - Identificar negocio por Evolution Instance]]
- [[ADR 003 - Supabase NestJS Groq Evolution]]
- [[ADR 004 - AiProvider intercambiable, Gemini principal y Groq complementario]]
- [[ADR 005 - Administracion segura del inventario por WhatsApp]]
- [[ADR 006 - Reportes deterministas y resumen con IA]]

> [!warning]
> `ADR 003` conserva valor histórico, pero su parte “Groq = cerebro conversacional” fue reemplazada por `ADR 004`.

## Producto y arquitectura

- [[Vision y Roadmap del Producto]]
- [[Arquitectura y Flujo Principal]]
- [[Modelo de Datos SaaS]]
- [[Copiloto WhatsApp IA Multimodal e Inventario]]

## Operación de Samuel

- [[Administracion del Inventario por WhatsApp]]
- [[Reportes y Resumenes para Samuel]]

## Código y flujo actual

- [[Flujo WhatsApp a Supabase]]
- [[Lead Scoring - Reglas y Contexto IA]]
- [[Mapa del Codigo - agent-core]]
- [[Flujo Interno - Evolution Webhook Service]]
- [[Checklist de Pruebas del Webhook]]
- [[Setup Local - Como levantar el proyecto]]
- [[Flujo de Trabajo ChatGPT Work Codex GitHub]]

## Diagramas

- [[Diagrama - Flujo Principal WhatsApp a IA]]
- [[Diagrama - Arquitectura Codigo agent-core]]
- [[Diagrama - Flujo Interno Webhook Scoring]]
- [[Diagrama - Administracion segura de inventario]]
- [[Diagrama - Reportes para Samuel]]
- [[Diagrama - Hito 3.2 Scoring Avanzado]]
- [[Diagrama - Modelo Mental del Sistema]]

## Estrategia

- [[Plan Desarrollo Piloto y Produccion Copiloto WhatsApp]]

## Trazabilidad documental

- [[_Informe de consolidacion]]

## Archivo

- [[README - Archivo]]

## Regla anti-duplicación

| Información | Fuente |
| --- | --- |
| Próxima acción física | `_generated/Siguiente accion.md` |
| Alcance y evidencia de un hito | Nota del hito |
| Decisión que no debe replantearse | ADR |
| Explicación técnica estable | `04 Docs/` |
| Relaciones y secuencias | `05 Diagramas/` |
| Código exacto | Repositorio |
| Evidencia de integración | PR y GitHub Actions |
| Conversaciones o borradores viejos | `90 Archive/` |
