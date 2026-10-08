# Activación única del Plan A

Después de fusionar los tres cambios del Plan A, solo hace falta esta configuración inicial.

## 1. Permitir el PR documental

En GitHub abre:

```text
Settings → Actions → General → Workflow permissions
```

Selecciona **Read and write permissions** y permite que GitHub Actions cree pull requests. El workflow no fusiona nada por sí solo.

## 2. Auditoría opcional con Codex

El generador determinista no necesita una API key. Si quieres la segunda revisión de Codex, crea el secreto del repositorio:

```text
OPENAI_API_KEY
```

Sin ese secreto, la sincronización y el PR documental siguen funcionando; solo se omite el auditor de IA.

## 3. Mostrar la misma carpeta en Obsidian

Usa `docs/obsidian/Copiloto WhatsApp Samuel/` como única copia editable. En Windows puedes enlazarla dentro de MainVault con una unión de directorio.

Primero respalda o renombra la carpeta vieja del proyecto; el punto de enlace no debe existir todavía. Después ejecuta en `cmd` con tus rutas reales:

```bat
mklink /J "C:\ruta\a\MainVault\10 Projects\Copiloto WhatsApp Samuel" "C:\Users\manzo\Desktop\Freelance\Copilot\docs\obsidian\Copiloto WhatsApp Samuel"
```

No enlaces todo el repo ni `.env` al vault.

## 4. Panel Principal

Agrega una sola vez a `Panel Principal - Pensar-Hacer.md`:

```md
![[Copiloto WhatsApp Samuel/_generated/Siguiente accion]]
```

El Panel del proyecto ya usa esa misma nota. Desde entonces, un cambio en la acción canónica se refleja en ambos lugares.

## 5. Ejecución manual

En GitHub abre **Actions → Documentation sync → Run workflow**. En el selector de rama, elige **main** y confirma con **Run workflow**.

Cuando el workflow genere cambios documentales, abrirá un PR automático nuevo. No actualiza un PR documental que ya exista; cada ejecución crea su propio PR cuando detecta cambios.
