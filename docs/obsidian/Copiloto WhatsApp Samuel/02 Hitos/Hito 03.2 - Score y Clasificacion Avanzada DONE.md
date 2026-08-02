---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
fase: Fase 1 — Fundación
hito: 3.2
updated: 2026-07-29
aliases:
  - Hito 3.2 - Score y Clasificacion Avanzada del Lead
---

# 🎯 Hito 3.2 — Score + clasificación avanzada del lead

## Estado anterior

- [x] Hito 3 básico terminado

El sistema ya puede calcular un score inicial y actualizar la clasificación del lead en Supabase.

---

## Objetivo

Mejorar el scoring para que el copiloto no solo detecte palabras clave, sino señales comerciales útiles que expliquen el nivel real de intención del lead.

---

## Flujo

```txt
WhatsApp
↓
Evolution API
↓
NestJS
↓
Supabase
↓
Mensaje guardado
↓
Análisis avanzado del mensaje
↓
Detección de señales comerciales
↓
Score por mensaje
↓
Score acumulado del lead
↓
Clasificación comercial
↓
Razón de clasificación
↓
Lead actualizado en Supabase
```

---

## 3.2.1 Señales comerciales detectadas

El sistema debe detectar señales como:

- [x] Interés general
- [x] Interés en precio
- [x] Interés en financiamiento
- [x] Interés en enganche
- [x] Interés en mensualidad
- [x] Interés en disponibilidad
- [x] Interés en cita
- [x] Urgencia
- [x] Vehículo específico mencionado
- [x] Modelo, año o versión si aparece
- [x] Lead no interesado
- [x] Lead confundido o solo preguntando información general

### Ejemplo de señales

```json
{
  "price": true,
  "financing": true,
  "appointment": true,
  "urgency": true,
  "availability": false,
  "vehicleSpecific": true,
  "vehicleMentioned": "Ford Ranger",
  "notInterested": false
}
```

---

## 3.2.2 Score por mensaje

Cada mensaje debe generar un score individual.

| Mensaje                             | Score | Clasificación momentánea |
| ----------------------------------- | ----: | ------------------------ |
| `Hola`                              |     5 | COLD                     |
| `Me interesa una Ranger`            |    30 | WARM                     |
| `Cuánto cuesta y la puedo ver hoy?` | Umbral HOT | HOT                |
| `No gracias, ya compré otro carro`  |     0 | NOT_INTERESTED           |

---

## 3.2.3 Score acumulado del lead

El score del lead debe tomar en cuenta la conversación completa, no solo el último mensaje.

| Mensaje | Score |
|---|---:|
| `Hola` | +5 |
| `Me interesa una Ranger` | +30 |
| `Cuánto cuesta?` | +25 |
| `La puedo ver hoy?` | +40 |

Resultado:

```txt
Score acumulado: 100
Classification: HOT
```

---

## 3.2.4 Clasificación avanzada

| Score | Classification |
|---:|---|
| 0 - 29 | COLD |
| 30 - 69 | WARM |
| 70+ | HOT |

Regla especial:

Si el lead expresa rechazo claro:

```txt
ya no me interesa
ya compré
no gracias
después veo
```

Entonces:

```txt
Classification: NOT_INTERESTED
```

---

## 3.2.5 Razón de clasificación

El sistema debe guardar una explicación breve de por qué el lead tiene esa clasificación.

Ejemplo:

```txt
El lead preguntó por precio, mostró interés en financiamiento y pidió verlo hoy.
```

Esto ayuda a:

- Entender por qué el lead está HOT
- Mostrar contexto útil al vendedor
- Preparar mejor la respuesta de la IA
- Auditar el scoring después

---

## 3.2.6 Guardar señales en Supabase

### El mensaje debe guardar

- [x] `score`
- [x] `classification`
- [x] `detected_signals`
- [x] `classification_reason`

### El lead debe actualizar

- [x] `score` acumulado
- [x] `classification` actual
- [x] `classification_reason` actual
- [x] `last_message`
- [x] `last_message_at`

---

## 3.2.7 Reglas por tipo de negocio

El scoring debe poder adaptarse según:

```ts
business.business_type
```

### Para autos

- Precio
- Financiamiento
- Enganche
- Mensualidad
- Modelo
- Año
- Kilometraje
- Disponibilidad
- Cita
- Prueba de manejo

### Para bienes raíces

- Renta
- Venta
- Ubicación
- Precio
- Crédito
- Enganche
- Recámaras
- Baños
- Visita
- Cita

---

## 3.2.8 Resultado esperado del servicio

`LeadScoringService` devuelve un objeto con esta forma conceptual:

```json
{
  "messageScore": 70,
  "leadScore": 85,
  "classification": "HOT",
  "classificationReason": "Preguntó por precio, financiamiento y disponibilidad para verlo hoy.",
  "signals": {
    "price": true,
    "financing": true,
    "appointment": true,
    "urgency": true,
    "availability": true,
    "vehicleSpecific": true,
    "vehicleMentioned": "Ford Ranger",
    "notInterested": false
  }
}
```

---

## DONE cuando

- [x] Un mensaje simple como `Hola` deje el lead `COLD`
- [x] Un mensaje como `Me interesa una Ranger` deje el lead `WARM`
- [x] Un mensaje como `Cuánto cuesta y la puedo ver hoy?` deje el lead `HOT`
- [x] Un mensaje como `Ya compré, gracias` deje el lead `NOT_INTERESTED`
- [x] Supabase guarde score del mensaje
- [x] Supabase guarde señales detectadas
- [x] Supabase guarde razón de clasificación
- [x] Supabase actualice score acumulado del lead
- [x] Supabase actualice classification del lead
- [x] El backend imprima logs claros del análisis
- [x] El resultado sirva como contexto limpio para el futuro Hito 4 con IA

---

## Próxima acción física

- [x] Abrir `src/leads/lead-scoring.service.ts`
- [x] Agregar interface `DetectedSignals`
- [x] Modificar el resultado del scoring para regresar `score`, `classification`, `signals` y `reason`

---

## Documentación relacionada

- [[Lead Scoring - Reglas y Contexto IA]]
- [[Diagrama - Hito 3.2 Scoring Avanzado]]
- [[Modelo de Datos SaaS]]
