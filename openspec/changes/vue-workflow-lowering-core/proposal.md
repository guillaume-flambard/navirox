# vue-workflow-lowering-core

## Why

The Workflow IR and the lowering seam exist, and `transform-orchestrator-contract`
sequences the path, but nothing in production produces the IR. `source-vue` stops
at detection, inspection and the App Graph, so `navirox transform` can only run
against fake providers and the golden path is a contract with no producer.

This change adds the first real producer: a Vue lowering that turns a selection of
an analysed Vue application into the framework-neutral Workflow IR. It covers the
declared template and `<script setup>` profile, refuses everything else with a
finding, and keeps the source seam intact.

## What Changes

- Add `createVueLowering()`, a `SourceTransformProvider` whose `lower(selection,
  snapshot, profile)` reads the screen units named by the App Graph, parses their
  single file components, and produces a `Workflow`.
- Cover the declared profile: `<script setup>` state (`ref`, `reactive`,
  `computed`, `defineProps`, `defineEmits`), template interpolation, property
  bindings, `v-if`/`v-else`, `v-for`, event handlers and `v-model`.
- Give every emitted node an exhaustive coverage and a source location, and refuse
  a construct outside the profile with a finding and no partially emitted node.
- Make the lowering deterministic: the same input yields the same IR and the same
  hash.
- Add positive, boundary and refused fixtures plus contract tests that prove the
  adapter imports no target and no renderer.

## Capabilities

### New Capabilities

- `vue-workflow-lowering`: how the Vue source adapter lowers a selection of an
  analysed Vue application into the Workflow IR, what it covers, and how it
  refuses what it does not.

### Modified Capabilities

None.

## Impact

Touches `@memolabs-apps/source-vue` (a new lowering module and its fixtures) and
consumes the existing `@memolabs-apps/workflow` IR and
`@memolabs-apps/source` seam. It changes no IR schema version, no public
`@memolabs-apps/*` type name, no target package and no runtime seam.
