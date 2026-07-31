---
type: product-technical-doc
project: Copiloto WhatsApp Samuel
status: proposed
created: 2026-07-31
updated: 2026-07-31
aliases:
  - Inventario por WhatsApp para Samuel
---

# Administración del Inventario por WhatsApp

## Recomendación principal

Usar un diseño híbrido:

- Comandos claros como ruta rápida y comprobable.
- Lenguaje natural como comodidad.
- Backend determinista para autorización, validación y ejecución.
- Confirmación obligatoria para mutaciones.

No conviene elegir entre “solo comandos” y “solo IA”. Cada uno cubre una necesidad distinta.

## Canal administrativo

### MVP recomendado

Samuel escribe desde un número personal o administrativo autorizado al WhatsApp empresarial del Copiloto.

Ventajas:

- Identidad simple de allowlist.
- Conversación separada de los clientes.
- No requiere panel web inicial.

El backend consulta `business_operators` antes de interpretar el mensaje como comando.

### Alternativa posterior

Grupo administrativo allowlisted.

Requiere:

- dejar de ignorar ese grupo específico;
- validar `groupJid`;
- validar el participante;
- impedir que otros integrantes ejecuten acciones;
- pruebas específicas de payloads de grupo.

### Lo que no funciona como autenticación

- Que el texto diga “soy Samuel”.
- Un comando secreto sin validar el remitente.
- Que la IA “reconozca su forma de escribir”.

## Tipos de operación

| Riesgo | Ejemplos | Comportamiento |
| --- | --- | --- |
| Lectura | stock, buscar, detalle | Ejecutar tras autorización |
| Cambio simple | precio, color, descripción | Propuesta + confirmación |
| Estado comercial | reservado, vendido, inactivo | Propuesta + confirmación |
| Alta | nueva unidad y datos | Vista previa completa + confirmación |
| Medios | agregar o quitar fotos | Validar archivo + confirmación |
| Masivo | cambiar varias unidades | Panel o confirmación reforzada |
| Borrado | eliminar | Convertir a archivado, no hard delete |

## Ejemplos

### Consultar

```text
/stock Ranger
¿Qué camionetas negras hay disponibles?
Muéstrame las unidades que llevan 30 días sin actualizarse.
```

### Agregar

```text
Agrega una Ranger XLT 2026 negra automática en $879,000.
```

Respuesta:

```text
Propuesta INV-4C21

Alta:
- Ford Ranger XLT
- Año: 2026
- Color: negro
- Transmisión: automática
- Precio: $879,000 MXN
- Estado: DRAFT

Faltan: fotos y stock_number.
Responde CONFIRMAR INV-4C21 o CANCELAR INV-4C21.
```

### Cambiar precio

```text
Bájale la Ranger XLT negra a 845 mil.
```

El backend debe resolver exactamente una unidad. Si hay varias coincidencias, pregunta cuál; nunca elige al azar.

### Marcar vendido

```text
Marca como vendida la unidad FRS-204.
```

El sistema conserva el registro y cambia el estado a `SOLD`.

## Flujo de una mutación

1. Autenticar operador.
2. Extraer intención y parámetros.
3. Resolver el registro dentro del mismo negocio.
4. Rechazar coincidencias ambiguas.
5. Validar tipos, rangos y reglas.
6. Crear `inventory_action`.
7. Mostrar antes y después.
8. Esperar confirmación.
9. Verificar expiración y operador.
10. Ejecutar en transacción.
11. Incrementar `version`.
12. Guardar auditoría.
13. Responder resultado.

## Medios

Cuando Samuel mande fotos:

1. Validar tipo y tamaño.
2. Calcular checksum.
3. Guardar en bucket privado.
4. Asociar a `business_id` e `inventory_item_id`.
5. Dejar estado `PENDING` o `APPROVED` según la política.
6. No enviar a leads hasta estar autorizado.

Las URLs públicas permanentes no deben ser la fuente de verdad. El backend resuelve el archivo y crea acceso temporal cuando se necesite.

## Casos que deben detenerse

- Operador no autorizado.
- Unidad inexistente.
- Varias coincidencias.
- Precio fuera de rango permitido.
- Acción expirada.
- Acción ya ejecutada.
- Versión del inventario cambió desde la propuesta.
- Archivo no permitido.
- Acción masiva no soportada.

## Pruebas mínimas

- Operador permitido y denegado.
- Lectura con y sin resultados.
- Ambigüedad.
- Confirmación correcta, incorrecta y expirada.
- Doble confirmación idempotente.
- Conflicto de versión.
- Separación entre negocios.
- Soft delete.
- Auditoría antes/después.
- Medios no autorizados.
- Ninguna llamada real a IA o WhatsApp en unitarias.

## División recomendada

- 5.1 — Modelo y consultas.
- 5.2 — Operador autenticado y lecturas.
- 5.3 — Propuestas y confirmación.
- 5.4 — Medios.
- 5.5 — Uso del inventario en respuestas a leads.

## Fuentes oficiales

- [Gemini — Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Supabase — Storage privado y URLs firmadas](https://supabase.com/docs/guides/storage/serving/downloads)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
