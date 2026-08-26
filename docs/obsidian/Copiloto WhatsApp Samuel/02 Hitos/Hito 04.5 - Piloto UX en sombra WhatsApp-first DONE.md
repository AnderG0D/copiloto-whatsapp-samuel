---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
fase: Fase 2 — IA de texto segura
hito: 4.5
activated: 2026-08-19
completed: 2026-08-25
updated: 2026-08-25
aliases:
  - Hito 4.5 - Piloto UX en sombra
  - Hito 4.5 - Shadow WhatsApp-first pilot
---

# Hito 4.5 — Piloto UX en sombra WhatsApp-first

## Objetivo alcanzado

Se validó la experiencia del operador en un piloto WhatsApp-first controlado, con cuentas de prueba dedicadas y aisladas. El piloto no envía mensajes a leads ni reutiliza sesiones, cuentas o datos entre participantes.

```text
operador allowlisted
→ cuenta de prueba dedicada enlazada por QR a Evolution aislado
→ datos y leads simulados/controlados
→ revisión humana en sombra
→ cero contacto con leads
```

La IA genera candidatos únicamente; NestJS conserva las decisiones y efectos de negocio. El cierre no autoriza el envío a leads.

## Evidencia de cierre

- 4.5-A completado: configuración local aislada, allowlists explícitas e instancias `shadow-edgar` y `shadow-samuel`.
- 4.5-B completado: canal de WhatsApp restringido exclusivamente a operadores allowlisted, con rechazo de participantes no autorizados y sin comunicación con leads.
- PRs fusionados: #69, #70, #71 y #72.
- Merge commits verificados: `a1295d6703cf8b489fb3d00253dd569ba1c96e7f`, `0d1d3e8e62b2dcab38a481a046256e603139702d`, `33dc4ebedd76f8a8d540e50c3f9cb82468d0e7dc` y `7cdafa081bd307e41a8df558114caa75a082cdf1`.
- Validación verificada: unitarias, E2E, build y `test:docs` exitosos.

## Alcance completado

### 4.5-A — Preparar el piloto local aislado

- [x] Configuración local aislada sin migración de base de datos.
- [x] Instancias de Evolution aisladas para cada piloto.
- [x] Allowlist explícita de operadores.
- [x] Cuentas de WhatsApp de prueba dedicadas, enlazadas mediante QR.
- [x] Datos y leads simulados o controlados por piloto.

### 4.5-B — Habilitar el canal restringido de operadores

- [x] Canal de WhatsApp disponible únicamente para operadores allowlisted.
- [x] Rechazo verificable de participantes no autorizados.
- [x] Sin comunicación con leads ni reutilización de sesiones, cuentas o datos fuera de cada piloto.

## Aislamiento obligatorio confirmado

| Piloto | Operador permitido | Cuenta de prueba | Instancia Evolution | Datos permitidos |
| --- | --- | --- | --- | --- |
| Prueba local de Edgar | Edgar, mediante su WhatsApp personal | `shadow-edgar` | Aislada para Edgar | Simulados/controlados solo para Edgar |
| Prueba guiada con Samuel | Samuel, mediante su WhatsApp personal | `shadow-samuel` | Aislada para Samuel | Simulados/controlados solo para Samuel |

- Edgar y Samuel actúan únicamente como operadores; sus cuentas personales no son cuentas de prueba ni destinatarios de leads.
- Cada cuenta de prueba se enlaza mediante QR exclusivamente a su instancia Evolution aislada.
- No se comparten sesiones, cuentas, datos ni leads entre Edgar, Samuel y los leads simulados.
- Un lead real nunca se incorpora al piloto ni se usa como dato de prueba.

## Progreso observado

<!-- AUTO:BEGIN milestone-progress -->
- [x] 4.5-A — Preparar el piloto local aislado.
- [x] 4.5-B — Habilitar el canal restringido de operadores.
<!-- AUTO:END milestone-progress -->

## Criterios de aceptación

- [x] Existen dos configuraciones locales aisladas: `shadow-edgar` y `shadow-samuel`.
- [x] Cada configuración usa una cuenta de WhatsApp de prueba distinta, enlazada por QR a su instancia Evolution aislada.
- [x] Las allowlists de operadores son explícitas y verificables.
- [x] Los datos y leads de prueba son simulados/controlados y están aislados por piloto.
- [x] No hay migración de base de datos para 4.5-A.
- [x] Ningún flujo permite enviar un mensaje a un lead.
- [x] 4.5-B acepta únicamente operadores allowlisted.
- [x] Las pruebas usan mocks, fakes o datos ficticios y no llaman servicios externos reales.
- [x] `AUTO_SEND_MESSAGES=false` y `sender=false` permanecen.

## Invariantes de seguridad confirmadas

- `sender=false`.
- `AUTO_SEND_MESSAGES=false`.
- `noLeadSend=true`: cero envío a leads.
- La allowlist se evalúa antes de procesar el canal de operador.
- La IA solo genera candidatos; NestJS conserva permisos, estado, reglas de negocio y corte de seguridad.
- No se aplicaron migraciones ni cambios de infraestructura remota.

## Validación final

- [x] Unitarias exitosas.
- [x] E2E exitosas.
- [x] Build exitoso.
- [x] `test:docs` exitoso.
- [x] No se introdujeron llamadas a servicios externos, envíos reales ni cambios de infraestructura.

## Estado posterior al cierre

El proyecto espera aprobación humana explícita antes de definir o activar otro hito. No hay hito activo, rama operativa, checkpoint pendiente ni destino de relevo.

## Evidencia de cierre

**Evidencia de cierre registrada: 4.5-A y 4.5-B están completos; los PRs #69, #70, #71 y #72 y sus merge commits verificados respaldan el cierre.**

> Cero envío a leads. `sender=false`, `AUTO_SEND_MESSAGES=false` y `noLeadSend=true` permanecen vigentes.

## Lo que sigue

El proyecto queda en espera de aprobación humana explícita antes de definir o activar cualquier otro hito. No hay hito activo, rama operativa, checkpoint pendiente ni destino de relevo.
