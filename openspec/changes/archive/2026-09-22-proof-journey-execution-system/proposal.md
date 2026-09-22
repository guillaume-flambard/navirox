# Proof-journey execution system

## Why

Navirox has canonical direction, target-specific pilot constraints, historical
implementation evidence, and many archived changes. It lacks one operational
entry point that tells a future implementation agent which source wins, what is
verified today, and which proof work may happen next. That gap invites broad
framework work, optimistic status language, or accidental benchmark misuse.

## What changes

- Add an agent-facing execution charter with source precedence, decision rules,
  current verified-state boundaries, and stop conditions.
- Add a staged roadmap whose immediate outcome is two independent, reproducible
  native proof journeys: Vue/Nuxt qualified against Baserow and Angular
  qualified against SuiteCRM.
- Add a dependency-ordered OpenSpec backlog with atomic future change briefs,
  definitions of done, verification, and out-of-scope boundaries.
- Point `AGENTS.md` and OpenSpec context at the new entry point.

## Capabilities

### New Capabilities

- `proof-journey-governance`

### Modified Capabilities

- None.

## Impact

- Documentation and OpenSpec process only.
- No source adapter, neutral model, migration behavior, target provider, runtime,
  benchmark input, package publication, or public support level changes.
- Baserow and SuiteCRM remain public benchmarks and qualification targets, not
  clients, partners, or applications to reproduce.
