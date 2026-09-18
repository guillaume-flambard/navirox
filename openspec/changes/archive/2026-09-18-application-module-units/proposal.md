## Why

The migration engine copies the units the plan classified as `shared`, and the
first real runs moved nothing: no adapter reports a plain application module as a
unit. The Vue adapter reports components and store declarations, the Svelte adapter
the same, and every other module is read for capability use and then ignored as
far as the graph is concerned.

That is a gap with consequences past the engine. The shared class has no producer
on a real project, the plan's summary reports a project's logic as absent rather
than as portable, and the largest body of code a migration can keep unchanged is
invisible in the report that exists to surface it.

## What Changes

- The adapters report plain application modules as units, with the exclusions that
  make the word "application" mean something: test files, configuration files,
  entry points and declaration files are not application logic.
- The Nuxt adapter stops reporting composables itself, because its base adapter now
  reports them, and composition is supposed to remove duplication rather than
  create it.
- The migrate command's real run starts moving files, and the previous evidence
  files that record unit counts gain a note saying what superseded them.

## Capabilities

### New Capabilities

- `application-modules`

### Modified Capabilities

- None

## Impact

- `packages/source`: the shared file predicates gain the notion of an application
  module, because more than one adapter needs the same answer.
- `packages/source-vue`, `packages/source-svelte`, `packages/source-nuxt`: module
  discovery and the removal of the duplicated composable rule.
- `packages/planner`, `packages/migrate`: no code change. Their tests and evidence
  move because the graphs they receive now contain the missing units.
- `docs/evidence/`: a new reading, and a note on the older ones.
- Not touched: `examples/vue-basic`, the runtime packages, the CI workflows.
- Out of scope: classifying a module more precisely than `utility` and
  `state-module`, and reporting declaration files as units.
