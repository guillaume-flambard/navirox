## Why

The preview's decision policy allows an optional LLM to second-guess the
subjects the deterministic plan cannot decide, but only as an opt-in, labelled
suggestion that never becomes a decision. That behaviour already exists in
`@memolabs-apps/planner` (`suggestForUndecided`, `createTypeSafeJudge`) and in
`navirox plan --semantic`, yet no capability states it. The guarantee a reader
needs, that a suggestion can never change compatibility, portability or support,
is therefore undocumented and unproven at the spec level.

## What Changes

- Declare a new capability, `llm-assistance`, that records the opt-in suggestion
  path as observable behaviour: only subjects the plan left `manual` or
  `unknown` are submitted, every answer is validated against the plan's closed
  class set, a suggestion never rewrites a decision, and the deterministic
  preview works with no key and no network.
- Require the provider to stay behind an injected judge seam so the behaviour is
  exercised without a network, and require that only names and kinds leave the
  process, never source content.
- Keep every other LLM role the contract permits (explaining reports, proposing a
  workflow, drafting scaffolding) out of scope; this change declares only the
  suggestion path that exists.
- No new package and no public `@memolabs-apps/*` type: the capability lives in
  `@memolabs-apps/planner` and is surfaced by `@memolabs-apps/cli`.

## Capabilities

### New Capabilities

- `llm-assistance`: an opt-in, labelled, deterministically validated second
  opinion on the subjects a plan cannot decide, which never changes a decision
  and is never required for the deterministic preview.

### Modified Capabilities

None.

## Impact

This adds a capability spec and its verification. It touches
`@memolabs-apps/planner` (the judge seam and the suggestion mapping) and
`@memolabs-apps/cli` (the `--semantic` flag and its rendering). It records the
`@typesafe-ai/sdk` dependency and its reason. It changes no source adapter, no
target provider, no runtime seam, no public type name and no schema version, and
it makes no claim that the LLM decides anything.
