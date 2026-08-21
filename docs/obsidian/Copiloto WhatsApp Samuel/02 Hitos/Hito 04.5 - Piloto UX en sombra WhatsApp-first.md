---
type: milestone
project: Copiloto WhatsApp Samuel
status: active
fase: Fase 2 — IA de texto segura
hito: 4.5
activated: 2026-08-19
updated: 2026-08-19
aliases:
  - Hito 4.5 - Piloto UX en sombra
  - Hito 4.5 - Shadow WhatsApp-first pilot
---

# Hito 4.5 — Piloto UX en sombra WhatsApp-first

## Objetivo

Validar la experiencia del operador en un piloto WhatsApp-first controlado, con cuentas de prueba dedicadas y aisladas, sin enviar mensajes a leads ni reutilizar sesiones, cuentas o datos entre participantes.

## Resultado esperado

```text
operador allowlisted
→ cuenta de prueba dedicada enlazada por QR a Evolution aislado
→ datos y leads simulados/controlados
→ revisión humana en sombra
→ cero contacto con leads
```

La IA puede seguir generando candidatos y NestJS conserva todas las decisiones y efectos de negocio. Este hito no autoriza el envío a leads.

<!-- AUTO:BEGIN technical-gate -->
## Gate técnico previo

Antes de iniciar 4.5-A debe completarse y fusionarse la promoción documental 4.4 → 4.5. La promoción debe conservar `observedRevision` y `frozenRevision`, y fusionarse mediante **Create a merge commit**.

- `sender=false` y `AUTO_SEND_MESSAGES=false` deben conservarse.
- No se permite ningún envío a leads.
- Este gate no implementa todavía el piloto funcional ni modifica `agent-core`.
<!-- AUTO:END technical-gate -->

## Alcance aprobado

### 4.5-A — Configuración local del piloto

- Configuración local de piloto, sin migración de base de datos.
- Instancias de Evolution aisladas para cada piloto.
- Allowlist explícita de operadores.
- Cuentas de WhatsApp de prueba dedicadas, enlazadas mediante QR.
- Datos y leads simulados o controlados por piloto.

### 4.5-B — Canal de WhatsApp limitado a operadores

Solo después de 4.5-A podrá implementarse un canal de WhatsApp estrictamente limitado a los operadores allowlisted. Este canal no autoriza mensajes a leads ni reutilización de sesiones, cuentas o datos fuera del piloto correspondiente.

## Aislamiento obligatorio

| Piloto | Operador permitido | Cuenta de prueba | Instancia Evolution | Datos permitidos |
| --- | --- | --- | --- | --- |
| Prueba local de Hiram | Hiram, mediante su WhatsApp personal | `shadow-hiram` | Aislada para Hiram | Simulados/controlados solo para Hiram |
| Prueba guiada con Samuel | Samuel, mediante su WhatsApp personal | `shadow-samuel` | Aislada para Samuel | Simulados/controlados solo para Samuel |

- Hiram y Samuel actúan únicamente como operadores; sus cuentas personales no son cuentas de prueba ni destinatarios de leads.
- Cada cuenta de prueba se enlaza mediante QR exclusivamente a su instancia Evolution aislada.
- No se comparten sesiones, cuentas, datos ni leads entre Hiram, Samuel y los leads simulados.
- Un lead real nunca se incorpora al piloto ni se usa como dato de prueba.

## Progreso observado

<!-- AUTO:BEGIN milestone-progress -->
- [ ] 4.5-A — Preparar el piloto local aislado.
- [ ] 4.5-B — Habilitar el canal restringido de operadores.
<!-- AUTO:END milestone-progress -->

## Checkpoints

### 4.5-A — Preparar el piloto local aislado

Definir e implementar la configuración local mínima para `shadow-hiram` y `shadow-samuel`, con allowlists explícitas, instancias aisladas y datos controlados. La evidencia debe demostrar que un operador fuera de la allowlist no puede usar el piloto y que no se requiere migración de base de datos.

### 4.5-B — Habilitar el canal restringido de operadores

Tras completar 4.5-A, habilitar el canal de WhatsApp solamente para los operadores allowlisted. La evidencia debe demostrar que el canal rechaza participantes no autorizados y no permite comunicación con leads.

## Criterios de aceptación

- [ ] Existen dos configuraciones locales aisladas: `shadow-hiram` y `shadow-samuel`.
- [ ] Cada configuración usa una cuenta de WhatsApp de prueba distinta, enlazada por QR a su instancia Evolution aislada.
- [ ] Las allowlists de operadores son explícitas y verificables.
- [ ] Los datos y leads de prueba son simulados/controlados y están aislados por piloto.
- [ ] No hay migración de base de datos para 4.5-A.
- [ ] Ningún flujo permite enviar un mensaje a un lead.
- [ ] 4.5-B, si se implementa, acepta únicamente operadores allowlisted.
- [ ] Las pruebas usan mocks, fakes o datos ficticios y no llaman servicios externos reales.
- [ ] `AUTO_SEND_MESSAGES=false` y `sender=false` permanecen.

## Reglas de seguridad

- No se permite ningún envío a leads.
- No se conectan cuentas, sesiones, datos ni leads reales entre pilotos.
- La allowlist debe evaluarse antes de procesar el canal de operador.
- Los proveedores de IA solo generan candidatos; no ejecutan efectos de negocio.
- NestJS conserva el control de permisos, estado, reglas de negocio y corte de seguridad.
- Las pruebas no usan credenciales reales ni contactan Evolution, WhatsApp, Gemini, Groq o Supabase.
- No se aplican migraciones ni cambios de infraestructura remota dentro de este hito sin autorización explícita.

## No incluye

- Envíos a leads, manuales o automáticos.
- Activar `AUTO_SEND_MESSAGES=true`.
- Un sender para WhatsApp.
- Producción, cuentas de negocio reales o datos de clientes.
- Migraciones de base de datos para 4.5-A.
- Reutilizar sesiones, cuentas o datos entre Hiram, Samuel y leads simulados.

## Primera acción funcional

**4.5-A — Diseñar la configuración local aislada y la allowlist explícita de operadores, sin migración de base de datos ni contacto con leads.**

> La IA propone. NestJS controla. El piloto permanece en sombra y no envía a leads.
