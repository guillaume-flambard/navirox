## Why

The plan reports fourteen dependencies as unknown, each with the same reason:
whether a dependency works on a native surface needs a compatibility record, and
none exists. That is the honest answer and it is also the biggest single block of
ignorance in the product, because a team's real question about a web project is
usually about its dependencies.

`@memolabs-apps/compat` has been a declared surface since the beginning and has never
held a fact. This change gives it one, and makes the planner read it, so the
unknown block shrinks by exactly as much as the evidence justifies and not one
package more.

## What Changes

- Implement `@memolabs-apps/compat`: the compatibility record model, the closed status
  and evidence sets, a declared seed of facts this repository can actually
  support, and a deterministic lookup.
- Add a compatibility rule to the planner, at the rule layer reserved for it, so a
  package with a record is classified from that record and a package without one
  stays unknown.
- Prove the difference on the acceptance app: the plan's unknown count falls for
  the packages that have evidence behind them and does not move for the rest.

## Capabilities

### New Capabilities

- `compatibility-registry`
- `compatibility-informed-planning`

### Modified Capabilities

- None

## Impact

- `packages/compat`: from a declared surface to an implementation.
- `packages/planner`: a compatibility rule and an optional registry input. The
  planner stays a function of the graph and its inputs; it does not read files.
- `packages/cli`: the composition root loads the seed and passes it to the plan.
- `README.md`, `docs/evidence/`.
- Not touched: the adapters, the inspection pipeline, the runtime packages, the
  acceptance app, the CI workflows.
- Out of scope: a hosted registry, contribution flow, version range resolution
  against real semver, and any fact this repository cannot demonstrate.
