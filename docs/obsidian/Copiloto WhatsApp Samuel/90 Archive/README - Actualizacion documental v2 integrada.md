---
type: documentation-migration
project: Copiloto WhatsApp Samuel
status: archived
created: 2026-07-31
updated: 2026-07-31
---

# Integrar la actualización documental v2

> [!note] Estado
> Esta propuesta ya fue incorporada en la documentación consolidada del 31 de julio de 2026. Se conserva como evidencia de migración.

> [!summary] Resultado
> Esta carpeta propone una fuente de verdad más coherente para continuar desde el Hito 4.2. Separa con claridad lo implementado, lo que falta verificar y las funciones futuras de inventario, reportes y multimodalidad.

## Qué encontré en la documentación original

La base es buena, pero necesita sincronización:

1. El MOC y el Panel siguen situados en el Hito 3.2, aunque el código ya avanzó hasta el Hito 4.1.
2. Varias notas y diagramas todavía muestran a Groq conectado directamente al flujo, en contradicción con `AiProvider` y Gemini.
3. La nota del Hito 4.1 mezcla tareas pendientes con un checklist final completamente marcado.
4. El nombre del archivo dice `ACTIVO`, mientras su contenido afirma que el PR ya fue fusionado. El estado real del merge debe comprobarse.
5. La nota multimodal llama “Hito 4.2” al inventario, pero el cierre del Hito 4.1 indica que primero debe existir generación de borradores con contexto.
6. `Modelo de Datos SaaS` presenta `inventory` como si ya existiera, aunque pertenece al trabajo futuro.
7. `Git y GitHub - Flujo de Cambios.md` recomienda `git add .` y una rama `dev`; eso contradice el flujo canónico nuevo y `AGENTS.md`.
8. Hay cinco notas vacías:
   - `ADR 004 - AiProvider intercambiable, Gemini principal y Groq complementario.md`
   - `Checklist de Pruebas del Webhook.md`
   - `Setup Local - Como levantar el proyecto.md`
   - `Diagrama - Arquitectura Codigo agent-core.md`
   - `Diagrama - Flujo Interno Webhook Scoring.md`
9. Existe un `02 Hitos.rar` duplicado dentro de la carpeta activa.
10. Algunos enlaces usan títulos o aliases diferentes a los nombres reales.
11. El modelo predeterminado implementado, `gemini-2.5-flash-lite`, tiene una fecha de apagado anunciada para el 16 de octubre de 2026. Debe revisarse en un cambio separado y probado; no se debe cambiar silenciosamente dentro de otro hito.

## Decisión de secuencia

La secuencia recomendada es:

```text
Hito 4.1 — Proveedor neutral + Gemini
↓
Hito 4.2 — Contexto confiable + borradores aislados
↓
Hito 4.3 — Guardar borradores e integrarlos sin envío
↓
Fase 5 — Inventario real y administración segura
↓
Fase 6 — Modo Samuel, reportes y transferencia humana
↓
Fase 7 — Audio, imágenes y documentos
↓
Fase 8 — Piloto y automatización gradual
```

Así el Hito 4.2 no intenta resolver IA, inventario, reportes, medios y envío en un solo cambio.

## Cómo integrar esta propuesta

1. Haz un respaldo de la carpeta original.
2. Verifica si el PR #6 fue realmente fusionado.
3. Conserva los hitos 2, 3 y 3.2 ya cerrados.
4. Reemplaza o agrega las notas de esta carpeta en las rutas equivalentes.
5. Si el PR #6 ya fue fusionado, cambia la nota del Hito 4.1 a `status: done`, renómbrala como `DONE` y enlázala desde el MOC.
6. Mueve `Git y GitHub - Flujo de Cambios.md` a `90 Archive/`, porque el flujo canónico es `Flujo de Trabajo ChatGPT Work Codex GitHub.md`.
7. Mueve `02 Hitos.rar` fuera de la carpeta activa después de confirmar que ya existe un respaldo.
8. Completa por separado las notas vacías que todavía sean útiles; no deben aparecer en el MOC mientras sigan vacías.
9. No copies el historial crudo de `90 Archive/` hacia las notas activas.

## Fuente de verdad

Cuando exista una contradicción, usar este orden:

1. Código y migraciones de `main`.
2. Pull Requests y GitHub Actions.
3. `AGENTS.md`.
4. ADR aceptado.
5. Nota del hito.
6. Panel del proyecto.
7. Documentación explicativa.
8. Archivo histórico.

## Archivos incluidos

- MOC actualizado.
- Panel actualizado.
- Estado verificable del Hito 4.1.
- Definición propuesta del Hito 4.2.
- ADR de proveedores de IA.
- ADR de administración segura del inventario.
- ADR de reportes deterministas.
- Visión y roadmap revisados.
- Arquitectura revisada.
- Modelo de datos actual y futuro.
- Diseño de inventario por WhatsApp.
- Diseño de reportes para Samuel.
- Diagramas principales.
- Prompt maestro para el nuevo chat de Work.

## Regla final

> [!important]
> Las notas explican el sistema, pero no deben afirmar que una tabla, módulo, migración, prueba o PR existe si no fue comprobado en el repositorio.
