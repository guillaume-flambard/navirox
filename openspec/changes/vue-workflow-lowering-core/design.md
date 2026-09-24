# vue-workflow-lowering-core design

## Context

The pieces already exist and are consumed, not changed:

- `@memolabs-apps/workflow` defines the IR: `Workflow`, `Screen`, `ViewNode`,
  `Coverage`, `StateModel`, `Action`, `Binding`, `serializeWorkflow`,
  `hashWorkflow`, `validateWorkflow`.
- `@memolabs-apps/source` defines the seam: `SourceTransformProvider.lower(
  selection, snapshot, profile) -> LoweringResult`, where `LoweringResult` carries
  the `workflow`, a `LoweringCoverage` count by kind, and `LoweringFinding`s.
- `@memolabs-apps/source-vue` already detects, inspects and builds the App Graph,
  and already depends on `@vue/compiler-sfc`.

`LoweringSnapshot` carries the `AppGraph`; `LoweringSelection` carries `rootDir`.
The graph's `units` name their file through `source.file`, and `screens` link to
units through `unitId`, so the lowering can find and read the screen files.

## Decisions

### The lowering reads files from `rootDir`, it does not extend the seam

The seam gives `selection.rootDir` and no reader. Extending the seam would change
an archived, stable contract for one adapter's convenience. The lowering reads the
screen files it needs from `rootDir` with `node:fs`, exactly as inspection does
behind `InspectContext.readText`. Tests write a temporary project, as the existing
`inspect.test.ts` already does.

### One screen unit becomes one IR screen

For each `ScreenNode` in the graph the lowering reads its unit file, parses it,
and emits one `Screen`. A screen whose file cannot be read is refused with a
finding. The screen id is derived from the graph screen id so it is stable.

### Coverage is exhaustive and refusals are whole-screen

Every emitted `ViewNode` and `Screen` carries a `Coverage` in
`generated | manual-required | excluded | refused`. A construct outside the
profile refuses the whole screen: the screen's coverage becomes `refused`, its
`nodes` are empty, and each refused construct is a finding with its source
location. Nothing is emitted partially, so no downstream target can render a
half-lowered screen.

### The covered profile is closed

Covered: `<script setup>` `ref`, `reactive`, `computed`, `defineProps`,
`defineEmits`; template interpolation; `:prop` bindings; `v-if`/`v-else`;
`v-for`; `@event`/`v-on`; `v-model`; elements with a known primitive mapping.

Refused, each with a finding: render functions (`h(`), dynamic components
(`<component :is>`), `watch(`/`watchEffect(`, a `<script>` without `setup`, and a
construct whose shape the lowering cannot classify without guessing.

### Determinism

Ids are derived from stable keys (the graph id plus a structural path), node and
state order follows document order, and no map iteration order leaks into output.
The contract test asserts that the same input yields the same
`serializeWorkflow` bytes and `hashWorkflow`.

## Rejected shortcuts

- **Reading the SFC directly in the target.** The target must consume the IR, not
  Vue syntax; the lowering is the only place Vue is known.
- **Emitting a partial screen for a partially supported component.** It would let
  a target render a screen the lowering did not actually cover.
- **Changing the IR or the seam to carry a reader.** Unnecessary for one adapter
  and it would reopen two stable contracts.
- **Lowering outside the analysed graph.** The lowering emits one IR screen per
  screen the App Graph names; it does not invent screens from a directory
  convention, and it does not lower a screen the graph never established.

## Interfaces

```ts
// packages/source-vue/src/lower.ts
export function createVueLowering(): SourceTransformProvider
```

It is re-exported from `packages/source-vue/src/index.ts` beside `buildGraph`, so
a consumer finds the producer next to the analysis it lowers.

## Fixtures and refusal codes (the contract the code and the tests share)

Fixtures live under `packages/source-vue/fixtures/vue-workflow-lowering/`, one
directory per case, each a minimal project with a `package.json` and one or more
`src/*.vue` files:

- `positive/` — uses a `ref`, a `computed`, an interpolation, a `:prop` binding,
  a `v-if`, a `v-for`, an `@click` handler and a `v-model`. Expected: one screen
  with `generated` coverage, state entries for each declared member, and nodes,
  bindings and actions for each covered construct; `validateWorkflow` reports
  nothing.
- `boundary/` — mixes a covered `ref` with a refused watcher. Expected: the screen
  is `refused`, its `nodes` are empty, and a finding names the watcher.
- `refused/` — a render function, a dynamic component and a `<script>` without
  `setup`. Expected: the screen is `refused`, no nodes, and one finding per
  construct.

Refusal codes, one per uncovered construct, recorded as the `LoweringFinding.code`
and as the finding's reason on the refused screen:

- `unsupported-render-function`
- `unsupported-dynamic-component`
- `unsupported-watcher`
- `unsupported-script-setup` (a `<script>` block without `setup`)
- `unsupported-element` (a tag outside the closed primitive map)
- `unsupported-directive` (a directive outside the covered set)
- `unsupported-state-macro` (a top-level Vue macro the lowering cannot classify,
  for example `withDefaults`, `defineModel`, `defineOptions`, `defineExpose`,
  `defineSlots`, or a destructured `reactive`/`props`)
- `unreadable-screen` (the graph names a screen unit whose file cannot be read)

The seam's `LoweringFinding` carries only `code` and `message`, so the file and,
when known, the line travel inside `message` as `<file>:<line> <detail>`. Extending
the seam is a separate decision and is not done here. A refused screen emits no
`ViewNode` at all, so a target can never render a half-lowered screen. A screen
whose script uses a Vue macro the lowering cannot classify is refused rather than
emitted with missing state, because a `generated` screen that is silently missing
a declared prop is exactly the half-lowered screen this change forbids.

The `LoweringCoverage` counters are node counts for every kind; `refused` counts
the refused screens, because a refused screen emits no node to count.
