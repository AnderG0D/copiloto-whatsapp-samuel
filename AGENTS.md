# Copiloto WhatsApp Samuel

## Project scope

- The backend lives in `agent-core/` and uses NestJS.
- Run backend commands from `agent-core/` unless a task explicitly says otherwise.
- Keep milestone status, current branches and temporary implementation plans out of this file. Document them in the project notes instead.

## Architecture

- The main flow is WhatsApp -> Evolution API -> NestJS -> Supabase.
- AI providers must implement the provider-neutral `AiProvider` contract.
- Gemini is the initial primary provider. Groq is complementary or may be used as a fallback.
- Provider implementations must remain independently testable and replaceable.
- AI providers generate candidate output only. They must not perform business side effects.
- NestJS controls inventory, prices, files, permissions, business rules, conversation state and human handoff.
- Never invent inventory, prices, vehicle details, files, permissions or business information that is not provided by a trusted application source.

## Safety and privacy

- Never open, print, edit or commit the contents of `.env`.
- Never expose or commit credentials, API keys, tokens, personal data, customer data or raw customer payloads.
- `.env.example` may be updated only with safe placeholders when configuration documentation is required.
- Keep `AUTO_SEND_MESSAGES=false` during development.
- Never send real WhatsApp messages unless the task explicitly authorizes the exact action.
- Do not connect AI generation to the Evolution webhook without explicit approval.
- Unit and e2e tests must use mocks, fakes or documented dummy values.
- Tests must not call Gemini, Groq, Supabase, Evolution API or other external services with real credentials.
- Do not run destructive Git, Docker or Supabase commands without explicit authorization.
- Do not apply database migrations or modify remote infrastructure unless the task explicitly requires it.

## Engineering workflow

- Before editing, inspect the current branch and working tree with:
  - `git branch --show-current`
  - `git status --short --branch`
- Read the relevant files and the closest applicable `AGENTS.md` before making changes.
- Keep each change scoped to one small, reviewable result.
- Do not refactor unrelated modules.
- Preserve existing architecture unless the task explicitly authorizes an architectural change.
- Add or update tests for behavior changes.
- Mock AI SDK clients in unit tests. Do not make real model requests during automated tests.
- Before adding a dependency, confirm why it is needed and limit changes to the relevant manifest and lockfile.
- Review the complete diff before declaring the task complete.
- Do not commit, push, open a pull request or merge unless the task explicitly requests it.
- The `npm run lint` script applies automatic fixes. If it is used, inspect every resulting change before keeping it.

## Documentation governance

- The repository copy under `docs/obsidian/Copiloto WhatsApp Samuel/` is the source of truth for project documentation.
- Follow `docs/control/documentation-policy.json` when changing project notes.
- Treat `03 Decisions/` as human-owned. Never create, accept, supersede or rewrite an ADR automatically.
- Treat `90 Archive/` as immutable history. Do not modernize old examples, model names, branches or conversations there.
- Do not change product vision, milestone scope, acceptance criteria or roadmap order unless Hiram explicitly approves that decision.
- Automated documentation may replace only complete files classified as `generated` or content inside matching `<!-- AUTO:BEGIN name -->` and `<!-- AUTO:END name -->` markers in `mixed` files.
- Never perform a global search-and-replace for providers, models, milestone states or PR numbers.
- Derive code, dependency, module, model, commit, PR and CI facts from the repository and GitHub. Do not infer them from chat memory.
- Do not mark a milestone `DONE` unless its configured acceptance evidence, merge state and required checks are verifiably complete.
- Technology reviews create recommendations only. They must not change dependencies, model defaults, ADRs or roadmap items automatically.
- Keep exactly one canonical next action in `_generated/Siguiente accion.md`; other Obsidian panels must transclude it instead of copying it.

## Validation

For backend code or dependency changes, run from `agent-core/`:

```bash
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

- Use only documented dummy environment values when the e2e baseline requires configuration.
- Never load real credentials merely to make a test pass.
- Do not claim a validation passed unless the command was actually executed successfully.
- If a command cannot run, report the exact command, failure and remaining unverified risk.
- For documentation-only changes, tests and build may be skipped when clearly reported as not applicable.
- For documentation automation changes, run `npm run docs:check` from the repository root once that script is available.

## Definition of done

A backend behavior or dependency change is complete only when:

1. The requested behavior is implemented.
2. Relevant unit tests pass.
3. The e2e baseline passes.
4. The build passes.
5. The final diff contains only intended changes.
6. No unauthorized external calls or message sending were introduced.
7. Remaining risks, assumptions and skipped validations are reported.

A documentation-only change is complete when its content and final diff have been reviewed and no unrelated files are included.
