---
type: checklist
project: Copiloto WhatsApp Samuel
status: active
updated: 2026-07-31
---

# Checklist de Pruebas del Webhook

## Parsing

- [ ] Ignora eventos no relacionados.
- [ ] Acepta variantes válidas de `messages.upsert`.
- [ ] Ignora `fromMe`.
- [ ] Ignora grupos no autorizados.
- [ ] Ignora mensajes sin identidad suficiente.
- [ ] Extrae texto y captions permitidos.

## Persistencia

- [ ] Resuelve negocio por instancia.
- [ ] Rechaza negocio inactivo o inexistente.
- [ ] Crea lead.
- [ ] Actualiza lead existente.
- [ ] Guarda mensaje con `business_id` y `lead_id`.
- [ ] Evita duplicados por ID externo.
- [ ] Un duplicado no suma score.

## Scoring

- [ ] Guarda score.
- [ ] Guarda clasificación.
- [ ] Guarda señales.
- [ ] Guarda razón.
- [ ] Conserva los cuatro casos de aceptación.

## Seguridad

- [ ] No imprime secretos.
- [ ] No expone payload completo.
- [ ] No llama IA en pruebas del webhook actual.
- [ ] No envía WhatsApp.
- [ ] `AUTO_SEND_MESSAGES=false`.

## Validación de cada cambio

```powershell
npm test
npm run test:e2e
npm run build
```

Además:

- ESLint de los archivos modificados.
- `git diff --check`.
- `git status --short`.
- diff completo.

