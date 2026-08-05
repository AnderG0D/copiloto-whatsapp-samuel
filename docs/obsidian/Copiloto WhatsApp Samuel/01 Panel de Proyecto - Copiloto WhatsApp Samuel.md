---
type: project-dashboard
project: Copiloto WhatsApp Samuel
system: Pensar-Hacer v1
status: active
fase: Fase 2 — IA de texto segura
hito_actual: Hito 4.4 — Revisión y aprobación humana
updated: 2026-08-04
aliases:
  - Panel de Ejecucion - Copiloto WhatsApp Samuel
---

# Panel de Proyecto — Copiloto WhatsApp Samuel

> [!rule] Uso
> Aquí solo vive el estado operativo: dónde estoy, qué debo verificar y cuál es la siguiente acción física.

## Próxima acción física

![[Siguiente accion]]

## Estado actual

<!-- AUTO:BEGIN dashboard-state -->
![[Estado actual]]

![[Evidencia tecnica]]
<!-- AUTO:END dashboard-state -->

## Hito activo

**Hito 4.4 — Revisión y aprobación humana**

Resultado esperado:

```text
borrador PROPOSED
→ operador autenticado
→ aprobar | editar y aprobar | rechazar
→ texto original preservado
→ decisión auditable
→ sin envío
```

### Condición previa al desarrollo funcional

Antes de comenzar técnicamente 4.4-A debe quedar fusionado y validado, en un PR independiente, el sistema determinista de relevo automático entre hitos.

Este gate documental no reemplaza la próxima acción canónica generada ni forma parte de los checkpoints funcionales 4.4-A a 4.4-D.

## Producto final

- [ ] Agente comercial para clientes.
- [ ] Respuestas basadas en inventario real.
- [ ] Texto, audio, imágenes y documentos.
- [ ] Fotos y fichas autorizadas de vehículos.
- [ ] Modo administrador para Samuel.
- [ ] Inventario editable desde un canal autenticado.
- [ ] Reportes y resúmenes de leads.
- [ ] Transferencia y pausa del bot.
- [ ] Piloto supervisado.
- [ ] Base SaaS multiindustria.

## Bloqueos y riesgos operativos

<!-- AUTO:BEGIN blockers -->
- El primer checkpoint pendiente es **4.4-A: Persistencia auditable de decisiones humanas**.
<!-- AUTO:END blockers -->

Riesgos de producto que requieren decisiones humanas:

- No existe todavía un canal administrativo autenticado para Samuel.
- No existe todavía un modelo de inventario real confirmado por migraciones.

## Regla de seguridad

```text
AUTO_SEND_MESSAGES=false
```

La IA propone. NestJS valida. Samuel aprueba cuando la acción cambia datos o puede contactar a un lead.

## Recordatorio

> Calidad > velocidad.
>
> Una próxima acción física pequeña vale más que sostener todo el roadmap en la cabeza.
