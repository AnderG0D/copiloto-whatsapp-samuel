---
type: technical-evidence-standard
project: Copiloto WhatsApp Samuel
rule: FD-EVIDENCIA-01
status: active
created: 2026-09-03
updated: 2026-09-03
tags:
  - copiloto-samuel
  - evidencia
  - validacion
  - trazabilidad
---

# Estándar de Evidencia Técnica Reproducible

`FD-EVIDENCIA-01` exige evidencia reproducible, sanitizada y trazable para auditorías, revisiones de código y validaciones de runtime, Docker, Supabase, pipeline o documentación. El contrato verificable está en `docs/control/documentation-policy.json` bajo `technicalEvidenceContract`.

## Reglas de uso

- Crear un registro por acción o conjunto atómico de acciones que compartan objetivo, contexto y resultado.
- Registrar sólo hechos observados en código, GitHub o validaciones realmente ejecutadas. No inferir ni inventar evidencia.
- Sanitizar la salida antes de conservarla. Nunca incluir secretos, tokens, contraseñas, datos personales, payloads sensibles ni datos de leads reales.
- No persistir automáticamente logs crudos; conservar un extracto sanitizado que permita revisar el resultado y referenciar la fuente trazable cuando exista.
- Si no hay evidencia, usar `UNKNOWN`, `BLOCKED` o `NOT_RUN`, explicar la causa y definir el siguiente checkpoint.
- Esta plantilla no autoriza cambios de ADR, roadmap, alcance, decisiones humanas o archivo histórico, ni permite avanzar de hito sin aprobación humana explícita.

## Estados permitidos

| Estado | Uso |
| --- | --- |
| `PASS` | El resultado observado cumple lo esperado sin advertencias relevantes. |
| `PASS_WITH_WARNINGS` | Cumple, pero hay advertencias o riesgos documentados. |
| `FAIL` | El resultado observado no cumple lo esperado. |
| `BLOCKED` | No puede ejecutarse o concluirse por un bloqueo identificado. |
| `NOT_RUN` | La acción no se ejecutó. |
| `UNKNOWN` | Falta evidencia suficiente para determinar el resultado. |

## Plantilla reutilizable

```md
### Evidencia — [identificador breve]

- Objetivo: [qué se busca comprobar]
- Alcance: [incluye y excluye]
- Proyecto: Copiloto WhatsApp Samuel
- Hito: [identificador o `N/A`]
- Entorno: [local, CI, Docker, Supabase de prueba u otro entorno autorizado]
- Rama: [salida de `git branch --show-current` o `UNKNOWN`]
- Commit: [SHA verificado o `UNKNOWN`]
- Acción ejecutada: [comando exacto o acción reproducible]
- Salida original sanitizada: [extracto sin datos sensibles; nunca log crudo]
- Esperado: [resultado verificable]
- Observado: [resultado verificable]
- Estado: [PASS | PASS_WITH_WARNINGS | FAIL | BLOCKED | NOT_RUN | UNKNOWN]
- Hallazgos y riesgos: [incluye evidencia faltante y sus consecuencias]
- Decisión: [continuar, detener, corregir o escalar]
- Siguiente checkpoint: [acción concreta para confirmar, reparar o desbloquear]
- Autorización requerida: [ninguna o la autorización humana explícita necesaria]
```

## Revisión antes de registrar

- ¿La acción puede repetirse con el contexto anotado?
- ¿La salida está sanitizada y es suficiente para contrastar esperado contra observado?
- ¿El estado refleja la evidencia disponible sin inventarla?
- ¿El siguiente checkpoint evita avanzar de hito sin aprobación humana explícita?
