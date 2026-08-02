---
type: decision
project: Copiloto WhatsApp Samuel
status: proposed
created: 2026-07-31
updated: 2026-07-31
---

# ADR 005 — Administración segura del inventario por WhatsApp

## Contexto

Samuel quiere consultar, agregar, modificar, vender, desactivar y actualizar inventario mediante WhatsApp. Un modelo de IA no debe recibir permiso directo para cambiar la base de datos.

Además, el webhook actual ignora mensajes `fromMe` y grupos. El sistema necesita definir explícitamente desde qué identidad administrará Samuel.

## Decisión propuesta

Separar dos rutas:

```text
Cliente autorizado como lead
→ flujo comercial

Operador autorizado
→ flujo administrativo
```

La ruta se decide por una identidad guardada y autorizada en el backend, nunca por una inferencia de IA.

Para el MVP, Samuel usará un número personal o administrativo allowlisted que escriba al número empresarial conectado al Copiloto. Si después se usa un grupo administrativo, se deberá autorizar tanto el `groupJid` como el participante.

## Lecturas

Las consultas no destructivas pueden ejecutarse directamente:

- `/stock`
- `/buscar Ranger`
- “¿Qué unidades negras están disponibles?”
- “¿Cuándo se actualizó esta unidad?”

## Mutaciones

Toda mutación sigue dos fases:

```text
Mensaje de Samuel
→ extracción de intención
→ validación del backend
→ vista previa
→ acción PENDING_CONFIRMATION
→ Samuel confirma ID
→ transacción
→ auditoría
```

Ejemplo:

```text
Samuel: Cambia la Ranger XLT negra a $845,000

Copiloto:
Propuesta INV-A7F2
Unidad: Ranger XLT negra
Precio anterior: $879,000
Precio nuevo: $845,000
Responde CONFIRMAR INV-A7F2 antes de 10 minutos.
```

## Reglas obligatorias

- Allowlist de operadores.
- Alcance por `business_id`.
- Confirmación para cambios.
- ID de acción de un solo uso.
- Expiración.
- Idempotencia.
- Registro antes/después.
- Transacción.
- Control de versión para evitar sobrescrituras.
- Eliminación lógica; no borrar físicamente desde WhatsApp.
- Acciones masivas requieren control adicional o panel.
- La IA extrae parámetros; un servicio determinista valida y ejecuta.

## Consecuencias

El flujo tarda un mensaje adicional, pero reduce cambios accidentales, suplantaciones y errores de interpretación.

