---
type: project-dashboard
project: Copiloto WhatsApp Samuel
system: Pensar-Hacer v1
status: active
fase: Fase 2 — IA de texto segura / piloto receive-only
hito_actual: Hito 4.6 — Piloto real controlado de Edgar
updated: 2026-09-03
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

## Modelo operativo vigente

El panel web interno es el centro principal para revisar borradores. WhatsApp
solo puede utilizarse como notificación opcional o atajo para el operador.

El panel debe mostrar:

- mensaje recibido;
- score del mensaje y de la lead;
- clasificación y razón;
- señales comerciales;
- contexto/historial seguro;
- draft generado por Gemini.

Las acciones son **Aprobar**, **Editar y aprobar** y **Rechazar**. El frontend
se comunica únicamente con NestJS; nunca consulta Supabase directamente con
claves secretas. `response_drafts` conserva la fuente de verdad.

WhatsApp no escribe el draft en la barra de composición. Si se habilita un
preview, se dirige únicamente al canal autorizado del operador.

## Hito activo

**Hito 4.6 — Piloto real controlado de Edgar**

Resultado esperado:

```text
mensaje de prueba recibido
→ scoring y contexto seguro
→ Gemini genera y persiste response_drafts.PROPOSED
→ notificación opcional al operador
→ revisión posterior por NestJS/panel
→ cero envío a la lead
```

La validación técnica del pipeline no equivale a activar envío a leads ni a
cerrar el piloto comercial.

### Estado de revisión humana

El backend de decisiones del Hito 4.4 ya está documentado como cerrado. Falta
construir o integrar la superficie web del operador conforme al modelo híbrido.

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
- El primer checkpoint pendiente es **4.6-A: Ejecutar la prueba controlada de Edgar**.
<!-- AUTO:END blockers -->

Riesgos de producto que requieren decisiones humanas:

- El panel web de revisión todavía no está construido como superficie principal.
- No existe todavía un modelo de inventario real confirmado por migraciones.

## Regla de seguridad

```text
SHADOW_ONLY_MODE=edgar
SENDER=false
AUTO_SEND_MESSAGES=false
NO_LEAD_SEND=true
```

La IA propone. NestJS valida y controla. Samuel decide en el panel cuando la
acción puede contactar a un lead. En el piloto Edgar no se permite ningún
envío a leads.

## Recordatorio

> Calidad > velocidad.
>
> Una próxima acción física pequeña vale más que sostener todo el roadmap en la cabeza.
