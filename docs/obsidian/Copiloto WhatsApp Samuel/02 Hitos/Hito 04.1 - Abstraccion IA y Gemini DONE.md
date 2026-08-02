---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
fase: Fase 2 — IA de texto segura
hito: 4.1
updated: 2026-07-31
completed: 2026-07-31
aliases:
  - Hito 4.1 - Abstracción de IA y Gemini
  - Hito 4.1 - Capa de IA intercambiable
---

# Hito 4.1 — Abstracción de IA y Gemini

## Objetivo

Crear una capa de IA intercambiable e implementar Gemini como primer proveedor de texto sin conectarlo al webhook.

## Implementado y verificado en `main`

- [x] Contrato neutral `AiProvider`.
- [x] Token `AI_PROVIDER`.
- [x] Tipos de entrada y salida.
- [x] SDK `@google/genai`.
- [x] `GeminiProvider`.
- [x] Modelo configurable.
- [x] Modelo predeterminado vigente: `gemini-3.1-flash-lite`.
- [x] Conversión de roles.
- [x] `systemInstruction`.
- [x] `temperature` y `maxOutputTokens`.
- [x] Rechazo de configuración ausente.
- [x] Rechazo de entradas conversacionales vacías.
- [x] Rechazo de respuestas vacías.
- [x] Pruebas con SDK completamente simulado.
- [x] `AGENTS.md`.

## Evidencia conocida

- Unitarias: 43/43.
- E2E: 1/1.
- Build: aprobado.
- ESLint: aprobado localmente.
- Backend CI: aprobado.
- PR principal [#6](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/6): fusionado en `main` (`4c285fc`).
- PR de mantenimiento [#7](https://github.com/AnderG0D/copiloto-whatsapp-samuel/pull/7): actualización del modelo predeterminado fusionada en `main` (`a82bdfd`).

## Restricciones preservadas

- No está conectado al webhook.
- No guarda borradores.
- No consulta inventario.
- No procesa medios.
- No envía WhatsApps.
- No contiene credenciales.

## Verificación final

- [x] PR #6 confirmado como `Merged`.
- [x] `main` contiene la abstracción `AiProvider` y `GeminiProvider`.
- [x] Unitarias, E2E, build, ESLint y Backend CI aprobados.
- [x] Alcance y restricciones de seguridad preservados.
- [x] Modelo predeterminado obsoleto reemplazado mediante un cambio pequeño, probado y separado.
- [x] PR #7 confirmado como `Merged`.
- [x] Hito cerrado formalmente como `done`.

## Mantenimiento resuelto durante el cierre

La implementación original usaba `gemini-2.5-flash-lite`, cuyo apagado estaba anunciado para el 16 de octubre de 2026. El riesgo se resolvió antes de iniciar el Hito 4.2 mediante el PR #7, que actualizó el valor predeterminado y su prueba a `gemini-3.1-flash-lite` sin mezclar el cambio con otro hito.

El modelo continúa siendo configurable mediante `GEMINI_MODEL`, por lo que futuros cambios no requieren modificar el contrato `AiProvider` ni el código consumidor.

## Resultado

```text
Código consumidor
→ AI_PROVIDER
→ AiProvider
→ GeminiProvider
→ @google/genai
```

## Siguiente hito

- [[Hito 04.2 - Contexto y borradores seguros de respuesta ACTIVE]]
