---
type: technical-doc
project: Copiloto WhatsApp Samuel
area: git
status: superseded
updated: 2026-07-31
superseded_by:
  - Flujo de Trabajo ChatGPT Work Codex GitHub
---

# 🌿 Git y GitHub — Flujo de Cambios

> [!warning] Guía reemplazada
> No ejecutar este flujo como guía vigente. La fuente canónica es [[Flujo de Trabajo ChatGPT Work Codex GitHub]].

> [!summary] Propósito  
> Esta nota define cómo guardar avances del código del Copiloto WhatsApp Samuel sin perder cambios ni revolver hitos.

---

# 🧠 Regla principal

```txt
Cambio pequeño
↓
Probar
↓
Commit
↓
Push a GitHub
```

---

# 🌱 Ramas recomendadas

## Rama estable

```txt
main
```

Contiene lo que ya funciona.

## Rama de desarrollo

```txt
dev
```

Contiene avances activos.

## Ramas por hito o feature

Formato:

```txt
feature/hito-3-2-scoring-avanzado
docs/mapa-codigo-agent-core
fix/webhook-duplicate-message
```

---

# 🧾 Tipos de commit

| Tipo        | Cuándo usarlo                          |
| ----------- | -------------------------------------- |
| `feat:`     | Nueva función                          |
| `fix:`      | Corrección de error                    |
| `docs:`     | Documentación                          |
| `refactor:` | Reorganizar código sin cambiar función |
| `test:`     | Pruebas                                |
| `chore:`    | Configuración o mantenimiento          |

---

# ✅ Ejemplos de commits

```bash
git commit -m "feat: add lead scoring to incoming webhook"
git commit -m "fix: avoid duplicated message scoring"
git commit -m "docs: add code map for agent-core"
git commit -m "docs: document webhook internal flow"
git commit -m "refactor: clean evolution webhook service"
```

---

# 🚀 Flujo para documentar

## 1. Revisar estado

```bash
git status
```

## 2. Crear rama de documentación

```bash
git checkout -b docs/basic-code-documentation
```

## 3. Agregar archivos

```bash
git add .
```

## 4. Crear commit

```bash
git commit -m "docs: add basic code documentation"
```

## 5. Subir a GitHub

```bash
git push origin docs/basic-code-documentation
```

---

# 🚀 Flujo para programar Hito 3.2

## 1. Crear rama

```bash
git checkout -b feature/hito-3-2-scoring-avanzado
```

## 2. Programar cambios

Archivos principales:

```txt
src/leads/lead-scoring.service.ts
src/webhooks/evolution/evolution-webhook.service.ts
```

## 3. Probar

Mensajes mínimos:

```txt
Hola
Me interesa una Ranger
Cuánto cuesta y la puedo ver hoy?
Ya compré, gracias
```

## 4. Revisar cambios

```bash
git status
git diff
```

## 5. Guardar commit

```bash
git add .
git commit -m "feat: add advanced lead scoring signals"
```

## 6. Subir cambios

```bash
git push origin feature/hito-3-2-scoring-avanzado
```

---

# 🧯 Comandos de seguridad

## Ver rama actual

```bash
git branch
```

## Ver historial corto

```bash
git log --oneline --decorate --graph -10
```

## Ver cambios antes de guardar

```bash
git diff
```

## Deshacer cambios de un archivo no commiteado

```bash
git restore ruta/del/archivo.ts
```

---

# 🧠 Regla anti-caos

Antes de cambiar código, escribir:

```txt
¿Qué archivo voy a tocar?
¿Qué quiero lograr?
¿Cómo sé que ya funcionó?
```

Después de probar, hacer commit.
