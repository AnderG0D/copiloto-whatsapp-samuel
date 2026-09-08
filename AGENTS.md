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
- Codex is the executor for repository work; the active prompt defines the concrete checkpoint and its allowed scope.
- Do not touch files outside that checkpoint without explicit authorization.
- Do not refactor unrelated modules.
- Preserve existing architecture unless the task explicitly authorizes an architectural change.
- Add or update tests for behavior changes.
- Mock AI SDK clients in unit tests. Do not make real model requests during automated tests.
- Before adding a dependency, confirm why it is needed and limit changes to the relevant manifest and lockfile.
- Review the complete diff before declaring the task complete.
- Do not commit, push, open a pull request or merge unless the task explicitly requests it.
- The `npm run lint` script applies automatic fixes. If it is used, inspect every resulting change before keeping it.

## Protected main and worktree lifecycle

- `C:\Users\manzo\Desktop\Freelance\Copilot` is exclusively the clean local mirror of `origin/main`; it is never a development, test or editing checkout.
- Before and after every cycle, work from that canonical path, confirm branch `main`, a clean worktree and no local commits, run `git fetch origin main`, then compare both `git rev-parse HEAD` and `git rev-parse origin/main`. They must match exactly.
- If local `main` is behind with no local commits, update only with a safe fast-forward (`git merge --ff-only origin/main`). If it is ahead, divergent, dirty or ambiguous, stop and report the blocker. Never use `git reset --hard`, `git clean`, force, destructive rebase or discard local commits.
- Every `feature`, `fix`, `test`, `docs` or `chore` change requires a new branch and descriptive worktree created from synchronized `origin/main`. Use branches such as `feature/<description>` and worktrees such as `C:\Users\manzo\Desktop\Freelance\Copilot-feature-<description>`.
- Each checkpoint records its concrete objective, allowed scope and files, expected behavior, validations, sanitized reproducible evidence, risks and exactly one next action. Before advancing, update the relevant source documentation and evidence, run available documentation checks, review the diff, and confirm code and documentation agree.
- Before a commit, run the validations applicable to the change. For documentation use only scripts that exist, currently `npm run test:docs`, `npm run docs:check`, `npm run docs:handoff:check`, and `git diff --check`; backend work also requires the documented unit, e2e and build validations.
- After local validation, inspect `git status` and `git diff`, and confirm only authorized files changed. Commit, push, PR creation, remote reruns and merge each require separate explicit authorization. Do not include secrets, real data, logs, `node_modules` or `dist`.
- Do not merge until required PR checks are green. On failure, stop, preserve sanitized output, classify it as route/worktree, configuration, code, documentation, test or permissions, correct only the active PR scope, repeat related validation and review the diff. Never use rerun, auto-merge or automatic merge without explicit authorization.
- After authorized **merge commit** integration, confirm the remote `main` SHA, safely fast-forward the clean canonical checkout, and again prove `HEAD` equals `origin/main`. The cycle remains open until both SHAs match. Review any automatic documentation PR as part of that cycle; it needs its own scope/check review and separate merge authorization.
- Report every handoff with: worktree path, branch, HEAD, Git status, completed checkpoint, remaining work, blocker, next action, and the exact `Set-Location '<active-worktree-path>'` command. Do not end with an unspecified continuation.
- Propose cleaning a worktree or local branch only after its PR merged, the worktree is clean, there are no uncommitted or unique patches and no open PR, the remote branch will remain, and explicit authorization exists to remove both local items. Never clean `main`, protected worktrees or branches, remote branches, or anything with unique work; never use `--force`, `git reset --hard` or `git clean` for normal cleanup.

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
- Apply FD-EVIDENCIA-01: every audit, code review, runtime, Docker, Supabase, pipeline, or documentation validation must produce reproducible, sanitized, traceable evidence according to `docs/control/documentation-policy.json`.
- Evidence must record the objective, scope, project, milestone, environment, branch, commit, action, sanitized original output, expected and observed results, status, findings and risks, decision, next checkpoint, and any required authorization. Use only `PASS`, `PASS_WITH_WARNINGS`, `FAIL`, `BLOCKED`, `NOT_RUN`, or `UNKNOWN`.
- Never invent evidence. Missing evidence is `UNKNOWN`, `BLOCKED`, or `NOT_RUN`; never persist raw logs, secrets, tokens, passwords, personal data, sensitive payloads, or real lead data. Automation must not change ADRs, roadmap, scope, human decisions, or archival history, and no milestone may advance without explicit human approval.

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

## Continuity and ADHD-friendly execution

- Treat the repository documentation as external memory; do not require Hiram to remember the whole project or conversation.
- At the beginning of each work cycle, identify the current state, completed work, active result, remaining work, blocker and next physical action.
- Keep one active result and one next action at a time.
- Execute one command or one physical action per turn, then wait for and inspect the complete output.
- When a command fails, stop additional changes, classify the failure, apply one scoped correction and repeat the related validation.
- After each meaningful result, record the checkpoint and update the project state or next action.
- Do not restart Docker, change branches, edit unrelated files or run destructive cleanup merely because the first attempt failed.
- Preserve the receive-only and no-send invariants during development.

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
