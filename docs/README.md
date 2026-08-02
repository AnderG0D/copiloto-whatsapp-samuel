# Documentación como código

Esta carpeta convierte la documentación del Copiloto WhatsApp Samuel en una parte verificable del repositorio.

## Fuente de verdad

- `obsidian/Copiloto WhatsApp Samuel/`: notas que se abren desde Obsidian.
- `control/`: política y criterios humanos que gobiernan la automatización.
- `obsidian/Copiloto WhatsApp Samuel/_generated/`: hechos derivados del código y GitHub.

El código y GitHub prueban qué existe. Los ADR, el alcance, la visión y el roadmap expresan decisiones humanas.

## Clases de documento

| Clase | Puede cambiar automáticamente | Ejemplos |
| --- | --- | --- |
| `generated` | Archivo completo | Estado, evidencia, arquitectura y siguiente acción |
| `mixed` | Solo bloques `AUTO` | Panel, MOC, hito activo y mapas técnicos |
| `human` | No | Visión, alcance, diseño funcional y guías |
| `protected` | Nunca | ADR y archivo histórico |

La clasificación exacta vive en `control/documentation-policy.json`.

## Una sola siguiente acción

La nota canónica es:

```text
Copiloto WhatsApp Samuel/_generated/Siguiente accion.md
```

El Panel del proyecto ya la transcluye. En `Panel Principal - Pensar-Hacer v1.md` basta agregar una sola vez:

```md
![[Copiloto WhatsApp Samuel/_generated/Siguiente accion]]
```

No copies la acción manualmente a otros paneles.

## Sincronización con Obsidian

La carpeta `docs/obsidian/Copiloto WhatsApp Samuel/` debe verse desde el vault mediante un enlace de directorio o un proceso de sincronización unidireccional desde el repo hacia el vault. No mantengas dos copias editables independientes.

## Flujo esperado

1. Se fusiona código en `main`.
2. CI prueba el backend y recolecta hechos técnicos.
3. Los scripts regeneran únicamente la zona administrada.
4. La validación confirma que ADR, archivo, alcance y roadmap no cambiaron.
5. GitHub abre un PR documental.
6. Al fusionarlo, Obsidian muestra el estado y la siguiente acción nuevos.
