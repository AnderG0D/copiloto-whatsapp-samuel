---
type: product-technical-doc
project: Copiloto WhatsApp Samuel
status: proposed
created: 2026-07-31
updated: 2026-07-31
aliases:
  - Modo Samuel - Reportes
  - Resumen diario de leads
---

# Reportes y Resúmenes para Samuel

## Objetivo

Permitir que Samuel obtenga información accionable desde WhatsApp sin revisar todas las conversaciones.

## Regla principal

```text
PostgreSQL y NestJS calculan.
La IA explica.
```

La IA no debe inventar conteos, ordenar prioridades sin datos ni omitir el periodo analizado.

## MVP bajo demanda

### `/resumen_hoy`

Debe incluir:

- Periodo y zona horaria.
- Leads nuevos.
- Leads activos por clasificación.
- Leads `HOT`.
- Conversaciones esperando respuesta.
- Solicitudes de cita.
- Modelos más preguntados.
- Problemas de inventario detectados.

Ejemplo:

```text
Resumen de hoy — 31 jul, 00:00–18:30, Chihuahua

- 12 leads nuevos
- 3 HOT, 5 WARM y 4 COLD
- 4 conversaciones esperan respuesta
- 2 personas quieren ver una unidad hoy
- Ranger fue el modelo más preguntado

Prioridad:
1. Ana •••• 4821 — pidió cita hoy para Ranger XLT
2. Luis •••• 1094 — preguntó enganche y mensualidad
3. Marisol •••• 7730 — espera fotos de una unidad
```

### `/prioridades`

Orden sugerido mediante reglas explícitas:

1. Solicitud de hablar con humano.
2. Cita o urgencia.
3. Lead `HOT` sin respuesta.
4. Negociación o documentos.
5. Tiempo esperando.
6. Score como desempate.

La IA puede explicar el orden, pero no sustituirlo.

### `/sin_respuesta`

Lead cuyo último mensaje relevante es `IN` y no tiene respuesta posterior dentro del umbral configurado.

El umbral debe ser visible y configurable.

### `/modelo Ranger`

- Leads que mencionaron Ranger en el periodo.
- Clasificación.
- Última interacción.
- Siguiente acción sugerida.

### `/lead <identificador>`

- Estado actual.
- Interés.
- Señales.
- Resumen breve.
- Último mensaje.
- Borradores pendientes.
- Estado de transferencia.

### `/inventario_desactualizado`

- Unidades cuyo `last_verified_at` supera el límite.
- Unidades con precio o disponibilidad dudosos.
- Medios pendientes de autorización.

## Datos recomendados para el resumen diario

### Ventas

- Nuevos leads.
- HOT/WARM/COLD.
- Citas solicitadas y confirmadas.
- Negociaciones.
- Leads cerrados o no interesados.

### Atención

- Tiempo de primera respuesta.
- Conversaciones sin respuesta.
- Conversaciones transferidas.
- Errores del bot.

### Demanda

- Modelos y versiones solicitados.
- Rango de presupuesto.
- Financiamiento, enganche y mensualidad.
- Colores y características.
- Consultas sin coincidencia de inventario.

### Inventario

- Disponibles, reservados y vendidos.
- Altas y cambios del día.
- Unidades desactualizadas.
- Fotografías o documentos pendientes.

### Calidad del Copiloto

- Borradores aprobados sin cambios.
- Borradores editados o rechazados.
- Respuestas que necesitaron a Samuel.
- Datos faltantes o alucinaciones detectadas.

## Seguridad

- Solo operadores autorizados.
- Enmascarar teléfonos en listados.
- No incluir `raw_payload`.
- No mostrar documentos sensibles.
- No mezclar negocios.
- No permitir “manda mensaje a todos los calientes” como efecto de un reporte.

Una campaña o envío masivo requiere otro flujo, permisos y confirmación.

## Implementación por etapas

### 6.1 — Consultas puras

- Tipos de reporte.
- Periodos y zona horaria.
- Consultas probadas.
- Formato de texto sin IA.

### 6.2 — Acceso por WhatsApp

- Operador autenticado.
- Comandos y lenguaje natural.
- Sin tareas programadas.

### 6.3 — Resumen con IA

- Recibe `ReportData`.
- Produce texto breve.
- No altera números.
- Fallback al formato determinista.

### 6.4 — Entrega programada

- Mañana o cierre del día.
- Misma consulta del reporte bajo demanda.
- Reintentos y observabilidad.
- Preferencia de horario de Samuel.

## Pruebas mínimas

- Límites de día en `America/Chihuahua`.
- Periodos vacíos.
- Conteos por clasificación.
- Detección de última dirección `IN`.
- Orden de prioridades.
- Separación por negocio.
- Teléfonos enmascarados.
- Resumen IA sin cambiar cifras.
- Operador no autorizado.

