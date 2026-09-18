## Why

Four adapters produce a graph and nothing decides anything about it. The gap is
deliberate so far: classification was forbidden until compatibility facts existed,
and it stayed forbidden while the reading was unproven. The reading is now proven
by two frameworks through one pipeline, so the next layer can be built on facts.

This is the layer that turns a reading into a readiness answer. It is also the
first place where the product says something about a project rather than about
its files, so the rules have to be conservative in a specific way: a class is
always accompanied by the reason it was chosen and the evidence behind it, and
"unknown" is a valid, expected answer rather than a failure.

## What Changes

- Add `@navirox/planner`: the decision model, the rule engine, and the first
  generic rules drawn from the App Graph.
- Every decision carries a classification from the closed set, a confidence, at
  least one reason and at least one piece of evidence. There is no class without
  a reason.
- Precedence is declared and total: a user override wins over everything, a known
  blocker wins over a rule, a rule specific to a target wins over a rule specific
  to a source, and anything no rule matched is `unknown` rather than a guess.
- Add `navirox plan`, which runs the same inspection and reports the plan.

## Capabilities

### New Capabilities

- `migration-classification`
- `migration-plan`

### Modified Capabilities

- None

## Impact

- New package: `packages/planner`.
- `packages/cli`: a fourth command, its arguments and its tests.
- `packages/inspect`: untouched. The command composes the pipeline it already has.
- Root `tsconfig.json`, `pnpm-lock.yaml`, `README.md`, `docs/evidence/`.
- Not touched: `examples/vue-basic`, the runtime packages, the CI workflows, the
  adapters, and the cross-adapter gate.
- Out of scope: target providers, transforms, the migration state file, and any
  code generation. This change decides; it does not move code.
