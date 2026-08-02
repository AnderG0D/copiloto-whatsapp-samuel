---
type: strategy-doc
project: Copiloto WhatsApp Samuel
status: active
created: 2026-07-29
updated: 2026-07-31
aliases:
  - Estrategia de costos y despliegue del Copiloto
  - Plan de desarrollo gratuito del Copiloto
---

# Plan de desarrollo, piloto y producción

## Estrategia

```text
Construir barato
→ validar con datos seguros
→ piloto supervisado
→ cobrar
→ reinvertir
→ automatizar casos demostrados
```

## Desarrollo

- Datos ficticios o anonimizados.
- Proveedores simulados en pruebas.
- `AUTO_SEND_MESSAGES=false`.
- Sin documentos sensibles reales.
- Límites de consumo.
- Unitarias, e2e, build, lint y CI.

Resultado actual:

- Scoring avanzado.
- Flujo persistente.
- Contrato neutral de IA.
- Gemini de texto fusionado mediante el PR #6.
- Modelo predeterminado actualizado mediante el PR #7.

Prioridades:

1. Borradores seguros.
2. Persistencia y revisión humana.
3. Inventario real.
4. Modo Samuel.
5. Multimodalidad.

## Piloto supervisado

- Inventario real validado.
- Samuel aprueba respuestas.
- Presupuesto y límites.
- Registro de ediciones.
- Transferencia y pausa.
- Medición de costo por conversación.

No activar respuestas automáticas generales durante el piloto inicial.

## Producción inicial

Automatizar solamente casos con reglas y evidencia:

- saludos;
- preguntas generales conocidas;
- consultas exactas de inventario;
- envío de medios autorizados;
- agenda dentro de reglas;
- respuestas con confianza suficiente.

Transferir cuando:

- el lead pide humano;
- existe negociación;
- faltan datos confiables;
- hay queja;
- aparecen datos sensibles;
- falla una dependencia;
- el lead es una oportunidad importante.

## Crecimiento

1. Hosting estable.
2. Consumo pagado de IA.
3. Monitoreo.
4. Seguridad y privacidad.
5. Dashboard.
6. Proveedores de respaldo.
7. Multiindustria.

## Métricas

### Calidad

- Borradores aprobados, editados y rechazados.
- Datos comerciales incorrectos.
- Precisión de inventario y medios.
- Transferencias correctas.

### Negocio

- Leads atendidos.
- Citas.
- Tiempo ahorrado.
- Tiempo de respuesta.
- Costo por lead y cita.

### Confiabilidad

- Disponibilidad.
- Duplicados.
- Errores.
- Latencia.
- Reintentos.
- Uso de fallback.

## Control de consumo

Registrar por negocio, lead y proveedor:

- mensajes y conversaciones;
- tokens de entrada y salida;
- minutos de audio;
- imágenes y documentos procesados;
- volumen de archivos;
- latencia, errores y reintentos;
- uso de proveedor alternativo;
- costo estimado por conversación.

Estas mediciones permiten fijar precios con evidencia y detectar consumos anómalos.

## Presupuesto por etapa

| Etapa | Presupuesto | Operación |
| --- | ---: | --- |
| Desarrollo | Cerca de $0 MXN o cuota mínima | Datos seguros, límites y sin envío automático |
| Piloto | Presupuesto pequeño | Conversaciones reales con aprobación humana |
| Producción inicial | Financiado por el ingreso del proyecto | Automatización de casos demostrados |
| Crecimiento | Reinversión proporcional | Capacidad, monitoreo, respaldo y seguridad |

## Criterios Desarrollo → Piloto

- [ ] Hitos de texto cerrados.
- [ ] Inventario consultado por backend.
- [ ] Revisión humana implementada.
- [ ] Transferencia y pausa probadas.
- [ ] Medios autorizados.
- [ ] Multimodalidad probada con datos seguros.
- [ ] CI verde.
- [ ] No hay envíos accidentales.
- [ ] Costos y límites visibles.
- [ ] Modelo Gemini vigente para la fecha del piloto.

## Riesgo temporal

El modelo predeterminado del Hito 4.1 tiene apagado anunciado para el 16 de octubre de 2026. Debe existir una migración probada antes del piloto.
