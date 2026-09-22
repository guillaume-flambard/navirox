# Tasks

## 1. Establish the execution entry point

- [x] 1.1 Add `docs/EXECUTION-CHARTER.md` with source precedence, current
  verified-state boundaries, decision rules, and stop conditions. Verify that it
  links product direction, pilot, visual, evidence, roadmap, and backlog sources
  without changing their claims.
- [x] 1.2 Link the charter from `AGENTS.md` and OpenSpec configuration. Verify
  `rg -n "EXECUTION-CHARTER|PROOF-ROADMAP|OPENSPEC-BACKLOG" AGENTS.md
  openspec/config.yaml` returns the navigation pointers.

## 2. Make the program executable

- [x] 2.1 Add `docs/PROOF-ROADMAP.md` with staged exits for both proof journeys
  and a shared definition of done. Verify every stage names its evidence and an
  explicit non-claim.
- [x] 2.2 Add `docs/OPENSPEC-BACKLOG.md` with dependency-ordered future changes,
  atomic tasks, verification, and out-of-scope boundaries. Verify it does not
  authorize a real benchmark integration, copied product UI, WebView, visual
  parity, or public npm claim.

## 3. Validate

- [x] 3.1 Run `pnpm format:check` and `openspec validate
  proof-journey-execution-system --strict`. Verify both exit 0, then mark this
  task complete.
