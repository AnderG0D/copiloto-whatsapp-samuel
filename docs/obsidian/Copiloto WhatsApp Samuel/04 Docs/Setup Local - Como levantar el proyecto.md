---
type: setup-doc
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-07-31
---

# Setup Local — Cómo levantar el proyecto

> [!info]
> Los comandos se conservan como guía humana y el entorno técnico observado se regenera sin leer `.env`.

## Prerrequisitos conocidos

- Node.js compatible con el proyecto.
- npm.
- Docker Desktop.
- Evolution API y sus servicios.
- Acceso al proyecto Supabase de desarrollo.
- Variables locales configuradas sin versionar.

GitHub Actions usa Node.js 22; conviene usar la misma versión local.

## Inicio documentation-first

Antes de levantar un entorno para un hito nuevo, completar el registro documental: control del hito, documento base, objetivo, alcance, fuera de alcance, criterios de aceptación, riesgos, invariantes, evidencia requerida, estado, handoff, siguiente acción y aprobación humana explícita. Después, y sólo después de confirmar que la copia canónica `main` está limpia y sincronizada con `origin/main`, crear un worktree y rama exclusivos desde ese `main` y trabajar únicamente allí.

Durante la prueba, actualizar la nota del hito con evidencia real y distinguir la implementación mergeada de la validación operativa. No marcar checkpoints sin evidencia ni declarar `DONE` sólo porque el código terminó. Si hay conflictos, cambios locales no explicados, pruebas pendientes o documentación desalineada, detenerse y reportarlo. El procedimiento completo está en [[Flujo de Trabajo ChatGPT Work Codex GitHub#Regla permanente: ciclo `documentation-first`|la regla documentation-first]].

## Entorno observado

<!-- AUTO:BEGIN setup-runtime -->
![[Evidencia tecnica]]
<!-- AUTO:END setup-runtime -->

## Repositorio

La copia canónica `C:\Users\manzo\Desktop\Freelance\Copilot` permanece exclusivamente en `main` y no es un espacio de desarrollo. Para la puerta de limpieza, la sincronización exacta, la creación de worktrees y el ciclo posterior a la integración, seguir la [[Flujo de Trabajo ChatGPT Work Codex GitHub#Regla oficial y estricta del ciclo Git|regla oficial y estricta del ciclo Git]]. Esta nota no duplica esos comandos ni autoriza operaciones remotas.

## Backend

```powershell
cd agent-core
npm ci
npm run build
npm test
npm run test:e2e
```

Usar el script real del repositorio para desarrollo; no inventar uno si `package.json` tiene otro nombre.

## Variables requeridas

Revisar una plantilla segura o la validación de configuración. Nunca pegar valores reales en Obsidian, prompts, logs o commits.

Categorías conocidas:

- Supabase.
- Evolution API.
- Gemini.
- modo de aplicación.
- seguridad de envíos.

## Servicios

Antes de probar el webhook:

1. Revisar el archivo Docker Compose real.
2. Levantar únicamente los servicios definidos.
3. Confirmar salud de Evolution, Postgres y Redis.
4. Confirmar que la instancia de desarrollo está conectada.
5. Mantener el envío automático desactivado.

## Diagnóstico seguro

- `git status --short --branch`
- `npm test`
- `npm run test:e2e`
- `npm run build`
- logs sin secretos

No documentar tokens, QR, números completos o payloads reales.
