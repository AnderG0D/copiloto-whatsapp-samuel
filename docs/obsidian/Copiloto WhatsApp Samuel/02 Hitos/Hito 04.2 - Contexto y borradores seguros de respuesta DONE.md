---
type: milestone
project: Copiloto WhatsApp Samuel
status: done
fase: Fase 2 — IA de texto segura
hito: 4.2
completed: 2026-08-01
updated: 2026-08-02
aliases:
  - Hito 4.2 - Contexto confiable y borradores
  - Hito 4.2 - Response Draft Service
---

# Hito 4.2 — Contexto confiable y borradores seguros de respuesta

## Objetivo

Crear una capa aislada que reciba datos seguros del negocio, lead e historial, construya mensajes neutrales para `AiProvider` y genere un borrador interno.

## Problema que resuelve

`GeminiProvider` ya puede generar texto, pero todavía no existe una pieza de negocio que decida:

- qué contexto enviar;
- qué datos excluir;
- cómo limitar el historial;
- qué instrucciones comerciales aplicar;
- cómo impedir que un borrador se confunda con un mensaje autorizado.

## Progreso observado

<!-- AUTO:BEGIN milestone-progress -->
- [x] 4.2-A — Contratos neutrales de contexto y borrador.
- [x] 4.2-B — Constructor determinista de contexto seguro.
- [x] 4.2-C — Servicio aislado de borradores.
- [x] 4.2-D — Pruebas del contexto y los borradores.
<!-- AUTO:END milestone-progress -->

## Flujo

```text
Entrada normalizada
↓
ContextBuilder
↓
AiMessage[]
↓
AI_PROVIDER.generateText
↓
ResponseDraft
↓
Resultado interno sin guardar ni enviar
```

## Entrada mínima

- Datos públicos y permitidos del negocio.
- Mensaje actual del lead.
- Score y clasificación.
- Señales detectadas.
- Razón de clasificación.
- Historial reciente limitado.

No incluir teléfono, payload crudo, secretos o datos personales que no sean necesarios para redactar.

## Salida mínima

```ts
type ResponseDraft = {
  text: string;
  status: 'PROPOSED';
};
```

La salida no representa aprobación ni envío.

## Sí incluye

- Contratos neutrales del contexto y borrador.
- Construcción determinista de `AiMessage[]`.
- Límite configurable de mensajes históricos.
- Conversión `customer → user` y `bot/human → assistant`.
- Instrucción segura en español mexicano.
- Uso exclusivo de `AI_PROVIDER`.
- Servicio aislado para generar borradores.
- Pruebas unitarias con proveedor simulado.
- Manejo de historial vacío y respuesta vacía.
- Unitarias, e2e, build, ESLint y revisión de diff.

## No incluye

- Consultar Supabase desde el servicio de redacción.
- Conectarse al webhook.
- Guardar borradores.
- Enviar mensajes.
- Activar `AUTO_SEND_MESSAGES`.
- Inventario, precios, fotos o fichas.
- Function calling.
- Reportes.
- Audio, imágenes o documentos.
- Transferencia humana.
- Groq.
- Refactorizar `GeminiProvider` sin un defecto demostrado.

## Reglas de contexto

1. Ordenar el historial cronológicamente.
2. Enviar solo los últimos mensajes necesarios.
3. Excluir payloads crudos.
4. Excluir teléfonos y metadatos no conversacionales.
5. No afirmar disponibilidad, precio o promoción sin datos confiables de entrada.
6. Indicar claramente cuando falta información.
7. Pedir una pregunta de seguimiento cuando el contexto no alcance.
8. Mantener respuestas breves, naturales y útiles para WhatsApp.

## Criterios de aceptación

- [x] El consumidor depende de `AiProvider`, no de `GeminiProvider`.
- [x] Un lead `HOT` conserva score, señales y razón dentro del contexto seguro.
- [x] El historial respeta el límite configurado.
- [x] Los roles se transforman correctamente.
- [x] No se incluyen teléfono, `raw_payload` ni credenciales.
- [x] El proveedor simulado recibe exactamente los mensajes esperados.
- [x] El resultado tiene estado `PROPOSED`.
- [x] Ningún código puede enviar el borrador.
- [x] No hay llamadas reales a Gemini durante pruebas.
- [x] `AUTO_SEND_MESSAGES=false` permanece.

## Checkpoints recomendados

### 4.2-A — Contratos del borrador

```text
feat: add response draft contracts
```

### 4.2-B — Constructor de contexto

```text
feat: build safe lead conversation context
```

### 4.2-C — Servicio de borradores

```text
feat: generate isolated AI response drafts
```

### 4.2-D — Pruebas

```text
test: cover response draft generation
```

La división exacta debe ajustarse después de inspeccionar el repositorio.

## Riesgos

- Duplicar tipos que ya existan.
- Introducir dependencias de Supabase demasiado pronto.
- Enviar demasiado historial y elevar costos.
- Pasar datos personales innecesarios.
- Convertir un borrador en respuesta real por accidente.
- Hacer el prompt tan grande que oculte las reglas importantes.

## DONE cuando

- [x] Alcance aprobado.
- [x] Cambios pequeños y revisables.
- [x] Unitarias aprobadas.
- [x] E2E existente aprobado.
- [x] Build aprobado.
- [x] ESLint de archivos modificados aprobado.
- [x] `git diff --check` limpio.
- [x] GitHub Actions verde.
- [x] Sin llamadas reales ni mensajes reales.
- [x] Documentación actualizada.

## Evidencia de cierre

- PR #8 fusionado el 2026-08-01 mediante el commit `2f9cc2595e1a339e97eaafb36a84e14f9a245f32`.
- 72 pruebas unitarias y 1 prueba e2e aprobadas.
- Build, ESLint, Prettier y `git diff --check` aprobados.
- Los cuatro checkpoints quedaron implementados en los cinco archivos de contexto y borradores registrados en `docs/control/milestones.json`.
- El alcance no agregó persistencia de borradores, conexión con el webhook, llamadas reales a Supabase o Gemini ni envío de WhatsApp; `AUTO_SEND_MESSAGES=false` permaneció.

## Lo que sigue

**Hito 4.3 — Persistir borradores e integrarlos al flujo entrante sin envío.**
