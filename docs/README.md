**English | [Español](README.es.md)**

# Documentation as Code

This folder makes the Copiloto WhatsApp Samuel documentation a verifiable part of the repository.

## Source of truth

- `obsidian/Copiloto WhatsApp Samuel/`: notes opened from Obsidian.
- `control/`: policy and human criteria that govern automation.
- `obsidian/Copiloto WhatsApp Samuel/_generated/`: facts derived from code and GitHub.
- [ChatGPT Work → Codex CLI → PowerShell Operating Guide](obsidian/Copiloto%20WhatsApp%20Samuel/04%20Docs/Flujo%20de%20Trabajo%20ChatGPT%20Work%20Codex%20GitHub.md): execution rules specific to the Copiloto.

Code and GitHub prove what exists. ADRs, scope, vision and roadmap express human decisions.

## Document classes

| Class | Can change automatically | Examples |
| --- | --- | --- |
| `generated` | Entire file | Status, evidence, architecture and next action |
| `mixed` | `AUTO` blocks only | Dashboard, MOC, active milestone and technical maps |
| `human` | No | Vision, scope, functional design and guides |
| `protected` | Never | ADR and historical archive |

The exact classification is in `control/documentation-policy.json`.

## Reproducible technical evidence

The cross-cutting rule `FD-EVIDENCIA-01` is in `control/documentation-policy.json`, under `technicalEvidenceContract`. Every audit, code review or runtime, Docker, Supabase, pipeline or documentation validation must record reproducible, sanitized and traceable evidence.

Use the [Reproducible Technical Evidence Standard](obsidian/Copiloto%20WhatsApp%20Samuel/04%20Docs/Estándar%20de%20Evidencia%20Técnica%20Reproducible.md) template. The contract requires the objective, scope, Git and environment context, action, sanitized original output, expected/observed results, status, risks, decision, next checkpoint and authorization when applicable. The only valid statuses are `PASS`, `PASS_WITH_WARNINGS`, `FAIL`, `BLOCKED`, `NOT_RUN` and `UNKNOWN`.

Do not invent evidence or retain raw logs, secrets, personal data, sensitive payloads or real lead data. If evidence does not exist, record `UNKNOWN`, `BLOCKED` or `NOT_RUN`.

## One next action

The canonical note is:

```text
Copiloto WhatsApp Samuel/_generated/Siguiente accion.md
```

The Project Dashboard already transcludes it. In `Panel Principal - Pensar-Hacer v1.md`, add it only once:

```md
![[Copiloto WhatsApp Samuel/_generated/Siguiente accion]]
```

Do not manually copy the action to other dashboards.

## Obsidian synchronization

The `docs/obsidian/Copiloto WhatsApp Samuel/` folder must be visible from the vault through a directory link or a one-way synchronization process from the repo to the vault. Do not maintain two independent editable copies.

## Expected workflow

1. Code is merged into `main`.
2. CI tests the backend and collects technical facts.
3. Scripts regenerate only the managed area.
4. Validation confirms that ADRs, the archive, scope and roadmap have not changed.
5. GitHub opens a documentation PR.
6. When it is merged, Obsidian shows the new status and next action.
