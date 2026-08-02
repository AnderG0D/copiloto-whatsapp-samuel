---
type: milestone
project: Copiloto WhatsApp Samuel
status: superseded
fase: Fase 2 — Inteligencia artificial
hito: 4.1
updated: 2026-07-31
superseded_by:
  - Hito 04.1 - Abstraccion IA y Gemini - VERIFICAR CIERRE
aliases:
  - Hito 4.1 - Abstracción de IA y Gemini
  - Hito 4.1 - Capa de IA intercambiable
---

# 🎯 Hito 4.1 — Abstracción de IA y Gemini

> [!warning] Versión archivada
> Este borrador fue reemplazado por [[Hito 04.1 - Abstraccion IA y Gemini DONE]]. No usarlo como estado operativo.

## Objetivo

Crear una capa de inteligencia artificial intercambiable en NestJS e implementar Gemini como primer proveedor, inicialmente solo para texto.

El resto del Copiloto debe depender del contrato neutral `AiProvider`, no directamente del SDK de Google. Esto permitirá añadir Groq u otro proveedor sin reescribir la lógica de negocio.

## Punto de partida

- [x] `main` limpia y actualizada en `5af5d0a`
- [x] Rama local `feature/hito-4-1-gemini-provider` creada desde `main`
- [x] Hito 3.2 terminado con 24 pruebas unitarias
- [x] Hito 3.3 terminado con una prueba e2e real del webhook
- [x] GitHub Actions ejecuta unitarias, e2e y build con Node.js 22
- [x] Contrato neutral de IA fusionado mediante el PR #5
- [x] `AiProvider`, tipos de texto y token `AI_PROVIDER` disponibles
- [x] Envío automático de mensajes desactivado

## Decisiones de arquitectura

| Decisión                                  | Motivo                                                              |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `AiProvider` será el contrato común       | Evita acoplar el Copiloto a Gemini                                  |
| Gemini será el primer proveedor           | Ofrece texto y capacidades multimodales para hitos posteriores      |
| Groq podrá añadirse como respaldo         | Puede servir como proveedor alternativo o para transcripción rápida |
| El Hito 4.1 comienza únicamente con texto | Reduce el alcance y facilita probar bien la capa base               |
| El modelo se configurará mediante entorno | Permite cambiarlo sin modificar código                              |
| Las pruebas simularán el cliente Gemini   | Las pruebas no consumirán cuota ni dependerán de internet           |
| NestJS controlará inventario y acciones   | La IA no inventará precios, archivos, permisos ni transferencias    |
| `AUTO_SEND_MESSAGES=false` permanece      | En este hito no se enviarán WhatsApps reales                        |

## Alcance

### Sí incluye

- [x] Contrato neutral `AiProvider`
- [ ] SDK oficial `@google/genai`
- [ ] Implementación `GeminiProvider`
- [ ] Generación de texto mediante Gemini
- [ ] Modelo configurable
- [ ] Configuración de `temperature`
- [ ] Configuración de `maxOutputTokens`
- [ ] Pruebas unitarias con Gemini simulado
- [ ] Manejo de respuesta vacía
- [ ] Propagación o traducción controlada de errores
- [ ] Unitarias, e2e y build aprobados
- [ ] Pull Request validado por GitHub Actions

### No incluye todavía

- Conectar la IA al webhook de Evolution
- Responder automáticamente a leads
- Enviar mensajes reales de WhatsApp
- Consultar inventario, precios o disponibilidad
- Enviar fotos o documentos de vehículos
- Procesar audios, imágenes o documentos
- Transferir conversaciones a Samuel
- Implementar Groq
- Activar `AUTO_SEND_MESSAGES`

## Contrato neutral disponible

```ts
export interface AiProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>;
}
```

El código consumidor deberá depender de `AI_PROVIDER`. Gemini será una implementación del contrato, no una dependencia directa del webhook o de la lógica comercial.

## Plan por commits pequeños

### Commit 1 — Contrato neutral

```text
feat: add provider-neutral AI contract
```

Estado: **completado y fusionado en `main` mediante el PR #5**.

Incluyó:

- `ai.types.ts`
- `ai-provider.interface.ts`
- `ai.constants.ts`

### Commit 2 — Instalar el SDK oficial

```text
chore: add Google GenAI SDK
```

Debe modificar solamente:

- `agent-core/package.json`
- `agent-core/package-lock.json`

No debe agregar:

- API keys
- Código de Gemini
- Cambios al webhook
- Variables de entorno versionadas con secretos
- Lógica de envío de WhatsApp

### Commit 3 — Implementar Gemini para texto

```text
feat: implement Gemini text provider
```

Debe incluir la adaptación entre el contrato neutral y el SDK:

- `GeminiProvider`
- Conversión de mensajes al formato requerido por Gemini
- Lectura de `GEMINI_API_KEY`
- Lectura de `GEMINI_MODEL`
- Modelo inicial configurable: `gemini-2.5-flash-lite`
- Uso de `temperature`
- Uso de `maxOutputTokens`
- Extracción del texto generado

La implementación todavía no se conectará al webhook.

### Commit 4 — Cubrir Gemini con pruebas

```text
test: cover Gemini provider
```

Las pruebas deben usar un cliente simulado y comprobar:

- Conversión de mensajes `system`, `user` y `assistant`
- Modelo configurado
- `temperature`
- `maxOutputTokens`
- Extracción de una respuesta válida
- Comportamiento ante una respuesta vacía
- Comportamiento ante un error del SDK
- Ausencia de llamadas reales a Google

## Primer paso — Instalar el SDK en un commit pequeño

### 1. Confirmar el punto de partida

Desde la terminal de VS Code:

```powershell
cd "C:\Users\manzo\Desktop\Freelance\Copilot"

git status --short --branch
git branch --show-current
git rev-parse --short HEAD
```

Resultado esperado:

```text
feature/hito-4-1-gemini-provider
5af5d0a
```

Si `git status` muestra modificaciones inesperadas, detenerse antes de instalar.

### 2. Instalar el SDK oficial

```powershell
cd agent-core
npm install @google/genai
```

Usar `@google/genai`, no el paquete antiguo `@google/generative-ai`.

El comando actualizará `package.json` y `package-lock.json`. El lockfile conservará la versión exacta resuelta por npm.

### 3. Revisar el cambio

```powershell
npm ls @google/genai
git status --short
git diff -- package.json package-lock.json
git diff --check
```

El cambio debe limitarse a la nueva dependencia y su información en el lockfile.

No debe existir ningún archivo `.env` dentro del diff.

### 4. Ejecutar validaciones

```powershell
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

Si el e2e no encuentra variables de Supabase, puede ejecutarse con valores ficticios únicamente para la prueba:

```powershell
cmd /c "set SUPABASE_URL=https://example.supabase.co&& set SUPABASE_SERVICE_ROLE_KEY=test-service-role-key&& npm run test:e2e -- --runInBand"
```

Resultado esperado:

- 24 pruebas unitarias aprobadas
- 1 prueba e2e aprobada
- Build aprobado
- Ninguna llamada a Gemini
- Ningún WhatsApp enviado

### 5. Crear el commit

Todavía dentro de `agent-core`:

```powershell
git add package.json package-lock.json
git diff --cached --stat
git diff --cached
git commit -m "chore: add Google GenAI SDK"
```

Después:

```powershell
cd ..
git status --short --branch
git log -2 --oneline
```

El árbol debe quedar limpio.

### 6. Subir el checkpoint

```powershell
git push -u origin feature/hito-4-1-gemini-provider
```

No es necesario abrir el Pull Request todavía. La misma rama puede recibir los commits pequeños restantes y el PR se abre cuando el Hito 4.1 esté completo.

## Variables previstas para el siguiente commit

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
```

Reglas:

- Nunca subir una API key real a GitHub.
- La clave vive únicamente en el entorno local o en secretos del entorno de despliegue.
- `GEMINI_MODEL` debe poder cambiar sin editar TypeScript.
- Agregar estas variables al código y a una plantilla segura corresponde al siguiente commit, no al commit del SDK.

## DONE cuando

- [x] `GeminiProvider` implementa `AiProvider`
- [x] La aplicación puede generar texto mediante el proveedor de forma aislada
- [x] El proveedor no está acoplado al webhook
- [x] El modelo puede cambiarse mediante configuración
- [x] Las pruebas usan Gemini simulado
- [x] Las unitarias pasan
- [x] El e2e existente pasa
- [x] El build pasa
- [x] GitHub Actions pasa con Node.js 22
- [x] El Pull Request es revisado y fusionado
- [x] `AUTO_SEND_MESSAGES=false` permanece
- [x] No se envía ningún WhatsApp real

## Resultado esperado

Al cerrar el hito, NestJS tendrá una base semejante a esta:

```text
Código consumidor
    → AI_PROVIDER
    → AiProvider
    → GeminiProvider
    → SDK @google/genai
```

En hitos posteriores podrá agregarse `GroqProvider` u otro proveedor sin cambiar el contrato consumido por el Copiloto.

## Lo que sigue

Después del Hito 4.1:

1. Crear un servicio que genere respuestas propuestas.
2. Integrarlo al flujo entrante sin enviar mensajes.
3. Guardar propuestas para revisión humana.
4. Incorporar contexto real del negocio e inventario.
5. Añadir capacidades multimodales por etapas.
6. Diseñar la transferencia controlada a Samuel.

## Fuentes oficiales

- [Gemini API libraries](https://ai.google.dev/gemini-api/docs/libraries)
- [Google Gen AI JavaScript SDK](https://googleapis.github.io/js-genai/)
- [Gemini 2.5 Flash-Lite](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-lite)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
