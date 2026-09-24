# vue-workflow-lowering-core tasks

## 1. The lowering entry point

- [x] 1.1 Add `createVueLowering(): SourceTransformProvider` in
  `packages/source-vue/src/lower.ts` and re-export it from
  `packages/source-vue/src/index.ts` beside `buildGraph`. Done:
  `corepack pnpm --filter @memolabs-apps/source-vue build` exits 0 and the
  contract tests import the factory and call `lower` on temporary projects.
- [x] 1.2 Lower one screen unit into one IR `Screen`: read the unit file from
  `selection.rootDir`, parse the single file component, derive the screen id from
  the graph screen id. Done: the positive fixture yields one screen whose id
  contains the graph screen id.

## 2. The covered profile

- [x] 2.1 Lower `<script setup>` state: `ref`, `reactive`, `computed`,
  `defineProps`, `defineEmits` into `StateModel` entries. Done: the positive
  fixture's screen declares each covered state member (`ref`, `computed`, `props`,
  `emits`) with its kind.
- [x] 2.2 Lower the template: interpolation, `:prop` bindings, `v-if`/`v-else`,
  `v-for`, `@event`/`v-on`, `v-model` and known primitives into `ViewNode`s,
  `Binding`s and `Action`s, in document order. Done: the positive fixture's
  flattened node tree (primitives and binding names) and its actions are asserted
  exactly.
- [x] 2.3 Give every emitted node a source location and a `generated` coverage.
  Done: `validateWorkflow` returns no finding for the positive fixture and every
  node carries a `source.line`.

## 3. Refusals and boundaries

- [x] 3.1 Refuse a screen that uses a construct outside the profile (render
  function, dynamic component, watcher, a `<script>` without `setup`): set the
  screen coverage to `refused`, emit no node, and record one finding per refused
  construct with its source location. Done: the refused fixture yields refused
  screens with empty nodes and the expected finding codes, each message carrying
  `<file>:<line>`.
- [x] 3.2 Cover the boundary: a screen that mixes covered and refused constructs
  is refused as a whole, and a screen whose file cannot be read is refused with a
  finding. Done: the boundary fixture and a missing-file case both yield a refused
  screen with empty nodes.
- [x] 3.3 Refuse a screen whose script uses a Vue macro the lowering cannot
  classify (`withDefaults`, `defineModel`, `defineOptions`, `defineExpose`,
  `defineSlots`, or a destructured `reactive`/`props`) with the
  `unsupported-state-macro` finding, so a `generated` screen is never silently
  missing declared state. Done: the `unsupported-state-macro` fixture yields a
  refused screen, and `unsupported-element`/`unsupported-directive` fixtures cover
  the other two codes.

## 4. Determinism and the seam

- [x] 4.1 Make the lowering deterministic: the same input yields the same
  `serializeWorkflow` bytes and the same `hashWorkflow`. Done: the determinism
  test lowers the positive fixture twice and compares bytes and hash.
- [x] 4.2 Keep the source seam intact: the adapter imports no target and no
  renderer. Done: `lower.ts` imports only node builtins, `@vue/compiler-sfc` and
  `@memolabs-apps/{workflow,source,graph}`; `source-vue/tsconfig.json` references
  `graph`, `source` and `workflow`; the import-boundary tests still pass.

## 5. Validation

- [x] 5.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`; verify all exit 0. Done: build 35/35, test
  64/64, lint clean, format:check clean.
- [x] 5.2 Run `corepack pnpm exec openspec validate vue-workflow-lowering-core
  --strict`; verify it exits 0. Done: the change validates strictly.
