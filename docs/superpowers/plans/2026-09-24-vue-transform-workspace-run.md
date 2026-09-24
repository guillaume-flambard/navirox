# Vue Transform Workspace Run Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the real Vue lowering and neutral target into the delivered `navirox transform` command, then prove that the command generates a Vue workspace whose generated screens pass a reproducible workspace test without fake providers or manual screen replacement.

**Architecture:** Keep `transform()` as the deep, injectable orchestration module. Add a CLI composition root that selects the Vue adapter, `createVueLowering()`, `createNativeTarget()`, and a generated Vue workspace scaffold when no test context is supplied. Keep source knowledge in `source-vue`, keep the target dependent only on `workflow`, and make the scaffold own the generated Vue runtime and verification entrypoint. This change proves generated-workspace syntax and reproducibility only; it does not claim native iOS/Android behavior or visual fidelity.

**Tech Stack:** TypeScript 6.0.x, pnpm 11, Vue 3.5.43, `@vue/compiler-sfc` 3.5.43, Vitest 5, OpenSpec.

**Spec:** `openspec/changes/vue-transform-workspace-run/design.md` and `openspec/changes/vue-transform-workspace-run/specs/transform-workspace-run/spec.md`.

## Global Constraints

- Source framework knowledge stays in `packages/source-vue`; a target may not import `@memolabs-apps/source` or any `@memolabs-apps/source-*` package.
- `@memolabs-apps/target-native` may import only Node built-ins and `@memolabs-apps/workflow` for the target contract.
- Every non-generated screen is refused; generated output is never manually patched in the proof.
- The delivered CLI path uses real providers; fakes remain available only through explicit test dependency injection.
- The generated workspace uses Vue `3.5.43` and `@vue/compiler-sfc` `3.5.43`; no native device, visual-fidelity, or broad framework-support claim is added.
- The workspace remains buildable after every task; no task may be marked complete without its named test or command.
- Do not commit changes. Leave the working tree for review.

---

### Task 1: Define the OpenSpec change and its proof boundary

**Files:**

- Create: `openspec/changes/vue-transform-workspace-run/proposal.md`
- Create: `openspec/changes/vue-transform-workspace-run/design.md`
- Create: `openspec/changes/vue-transform-workspace-run/tasks.md`
- Create: `openspec/changes/vue-transform-workspace-run/specs/transform-workspace-run/spec.md`
- Create: `packages/cli/fixtures/vue-transform-workspace/vue/package.json`
- Create: `packages/cli/fixtures/vue-transform-workspace/vue/src/main.js`
- Create: `packages/cli/fixtures/vue-transform-workspace/vue/src/router.js`
- Create: `packages/cli/fixtures/vue-transform-workspace/vue/src/views/Home.vue`
- Create: `packages/cli/fixtures/vue-transform-workspace/vue/src/views/About.vue`
- Create: `packages/cli/fixtures/vue-transform-workspace-refused/vue/package.json`
- Create: `packages/cli/fixtures/vue-transform-workspace-refused/vue/src/main.js`
- Create: `packages/cli/fixtures/vue-transform-workspace-refused/vue/src/router.js`
- Create: `packages/cli/fixtures/vue-transform-workspace-refused/vue/src/views/Home.vue`
- Create: `packages/cli/fixtures/vue-transform-workspace-refused/vue/src/views/Refused.vue`

**Interfaces:**

- Produces the stable capability `transform-workspace-run` and two deterministic Vue fixtures: one fully supported workflow for the delivered CLI proof, and one refusal fixture for the no-file guarantee.
- The positive fixture must contain literal routes and supported screen constructs. The refusal fixture must contain one supported screen and one screen with an explicitly refused construct. Neither fixture may contain credentials, external URLs, or copied product data.

- [ ] **Step 1: Write the OpenSpec proposal and design**

State the stage as the next Vue T2 increment, the affected layers (`cli`, `source-vue`, `target-native`, generated workspace), the dependency on `vue-workflow-lowering-core` and `vue-native-target-emission`, and the non-goals: no native device proof, no visual parity, no general Vue support. The design must name the composition root and explain why `transform()` remains injectable.

- [ ] **Step 2: Write the requirement delta**

Use these requirements and scenarios:

```markdown
## ADDED Requirements

### Requirement: The delivered transform command composes real providers

The `navirox transform` command MUST compose the registered Vue source lowering and the neutral native target when no test context supplies dependencies. It MUST NOT require callers to inject providers for the delivered CLI path.

#### Scenario: A Vue repository is transformed by the delivered command

- **WHEN** a user runs `navirox transform <vue-repository> --profile <profile> --out <workspace> --write`
- **THEN** the command uses the real Vue lowering and target and writes the planned workspace

### Requirement: A generated workspace carries its own runnable verification

A generated workspace MUST contain a package manifest, a Vue entrypoint, a generated runtime registration, an application entrypoint, and a verification command that compiles every generated Vue SFC. The verification command MUST fail on an SFC parse or template compilation error.

#### Scenario: The generated workspace verifies itself

- **WHEN** the generated workspace runs its package test command
- **THEN** every generated SFC parses and compiles and the command exits 0

### Requirement: Refused source remains absent from the workspace

A screen with non-generated coverage MUST produce a finding and MUST NOT produce a generated screen file. A generated workspace MUST never require a hand-written replacement for a refused screen.

#### Scenario: A refused screen is not silently replaced

- **WHEN** lowering refuses one screen and generates another
- **THEN** only the generated screen is present and the refusal is recorded in the transform result
```

- [ ] **Step 3: Write the task checklist with verification commands**

Each task in `tasks.md` must name its test or generated artifact, including the final `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, and `corepack pnpm exec openspec validate vue-transform-workspace-run --strict` commands.

- [ ] **Step 4: Add the fixture and validate the change**

The positive fixture's `Home.vue` and `About.vue` use literal routes, `ref`, interpolation, a button event, and `v-model`. The separate refusal fixture's `Refused.vue` uses one construct covered by the lowering refusal fixtures. Run:

```bash
corepack pnpm exec openspec validate vue-transform-workspace-run --strict
```

Expected: `Change 'vue-transform-workspace-run' is valid`.

---

### Task 2: Make the emitted Vue representation syntactically valid

**Files:**

- Modify: `packages/source-vue/src/lower.ts:648-663`
- Modify: `packages/target-native/src/index.ts:60-95`
- Modify: `packages/source-vue/src/lower.test.ts`
- Modify: `packages/target-native/src/index.test.ts`

**Interfaces:**

- `buildNode()` emits static text as `{ name: 'text', expression: content }` instead of dropping it.
- `renderNode()` consumes `Binding[]` and renders Vue-valid attributes: `v-if`, `v-else-if`, `v-else`, `v-for`, `v-model`, `@event`, and bound props.
- `screenFileStem()` derives an import-safe, deterministic file stem from `screen.name`, falling back to the source basename and then the screen id; duplicate stems receive a numeric suffix.
- Text nodes render `{{ expression }}`; screen-level action attachment is removed because event bindings already carry their node location.
- No target import from `source`, `source-vue`, Vue compiler, or a source adapter is introduced.

- [ ] **Step 1: Add failing assertions**

Extend the Vue lowering test to assert that a non-empty static text node produces a `text` binding. Extend the target test to assert that a text binding appears as interpolation, an `on-click` binding appears as `@click`, a `v-model` binding appears as `v-model`, a `testID` binding remains present without an unresolved marker, and real graph-style screen ids containing `:` produce import-safe file stems with deterministic collision suffixes.

- [ ] **Step 2: Run the focused tests and confirm failure**

```bash
corepack pnpm --filter @memolabs-apps/source-vue test
corepack pnpm --filter @memolabs-apps/target-native test
```

Expected: the new assertions fail because the current lowering drops static text and the target renders bindings as literal attributes.

- [ ] **Step 3: Implement the minimal lowering change**

Change the `NODE_TEXT` branch in `buildNode()` to retain trimmed content in a `Binding`:

```ts
return {
  id: nodeId(screenId, path),
  primitive: 'text',
  source: sourceOf(file, child['loc']),
  coverage: { kind: 'generated' },
  bindings: [{ name: 'text', expression: content }],
  children: [],
}
```

- [ ] **Step 4: Implement deterministic target rendering**

In `target-native/src/index.ts`, replace literal attribute rendering with a binding renderer. The renderer must:

1. Render `text` bindings as interpolation, not attributes.
2. Render `on-*` as `@<event>`.
3. Render known Vue directives unchanged.
4. Render `v-bind` and named bound props with `:`.
5. Render `testID` as `testID` with its expression preserved.
6. Escape nothing by accident and emit the same bytes for the same IR.

Use this shape so the mapping is testable and does not depend on screen-level action order:

````ts
function screenFileStem(screen: Screen): string {
  const sourceName = screen.source.file.split('/').at(-1)?.replace(/\.vue$/, '') ?? ''
  const candidate = screen.name || sourceName || screen.id
  return candidate.replace(/[^A-Za-z0-9_-]+/g, '-') || 'screen'
}

function uniqueScreenFileStem(screen: Screen, used: Set<string>): string {
  const base = screenFileStem(screen)
  let candidate = base
  let suffix = 2
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  used.add(candidate)
  return candidate
}

```ts
function renderBinding(binding: Binding): string {
  if (binding.name === 'text') return `{{ ${binding.expression} }}`
  if (binding.name === 'testID') return `testID="${binding.expression}"`
  if (binding.name.startsWith('on-')) return `@${binding.name.slice(3)}="${binding.expression}"`
  if (binding.name === 'v-if' || binding.name === 'v-else-if' || binding.name === 'v-else' || binding.name === 'v-for' || binding.name === 'v-model') {
    return `${binding.name}="${binding.expression}"`
  }
  if (binding.name === 'v-bind') return `:value="${binding.expression}"`
  return `:${binding.name}="${binding.expression}"`
}

function renderNode(node: ViewNode): string {
  const attrs = node.bindings.filter((binding) => binding.name !== 'text').map(renderBinding).join('')
  const text = node.bindings.filter((binding) => binding.name === 'text').map((binding) => `{{ ${binding.expression} }}`).join('')
  const children = node.children.map(renderNode).join('')
  return `<${node.primitive}${attrs}>${text}${children}</${node.primitive}>`
}
````

The `text` binding is rendered as the node's content rather than an attribute, so `renderNode` must place a text binding inside the element body and omit it from the attribute string. `testID` is an explicit exception: emit it as `testID="expression"` so the generated runtime can consume the test hook. The screen renderer must call `renderNode(node)` for every node and must not attach all screen actions to the first root node.

- [ ] **Step 5: Run the focused tests and boundary tests**

```bash
corepack pnpm --filter @memolabs-apps/source-vue test
corepack pnpm --filter @memolabs-apps/target-native test
corepack pnpm --filter @memolabs-apps/source test
```

Expected: all package tests pass, including the static import-boundary test.

---

### Task 3: Add the generated Vue workspace scaffold

**Files:**

- Create: `packages/cli/src/vue-workspace.ts`
- Modify: `packages/cli/src/transform.ts:143-150,635-662`
- Modify: `packages/cli/src/transform.ts:638-648`
- Modify: `packages/cli/src/transform.test.ts`
- Modify: `packages/cli/src/index.ts`

**Interfaces:**

- Extend `TransformDeps.scaffold` options with `lowering: LoweringResult` and `emission: EmissionResult`; export the complete input as `TransformScaffoldInput` from `transform.ts`.
- Export `createVueWorkspaceScaffold(): NonNullable<TransformDeps['scaffold']>`.
- The scaffold returns planned files only; `transform()` remains the single writer and path-safety boundary.

- [ ] **Step 1: Write failing scaffold tests**

Add tests that call `transform()` with a fake lowering/emission and a scaffold callback, then assert the callback receives both values and that scaffold files appear in `plannedPaths`. Add a second test for a workflow with no generated screen: the scaffold returns a `scaffold-no-screens` finding and the transform result is not `ok`.

- [ ] **Step 2: Run the focused CLI tests**

```bash
corepack pnpm --filter @memolabs-apps/cli test -- transform.test.ts
```

Expected: the new assertions fail because `scaffold` receives no lowering/emission and no generated workspace implementation exists.

- [ ] **Step 3: Extend the scaffold callback contract**

Add the two fields to the existing `scaffold` options type and pass `lowering` and `emission` at the call site. Keep all existing fake-provider tests unchanged except for the new required fields in their scaffold callback types.

- [ ] **Step 4: Implement the generated workspace files**

`createVueWorkspaceScaffold()` must produce these deterministic files:

- `package.json` with private ESM settings, `vue: 3.5.43`, `@vue/compiler-sfc: 3.5.43`, and `scripts.test = "node scripts/verify-generated.mjs"`.
- `index.html` with `<div id="app"></div>` and `<script type="module" src="/src/main.ts"></script>`.
- `src/main.ts` importing `createApp`, `App`, and `registerNativePrimitives`, registering primitives before `app.mount('#app')`.
- `src/native.ts` registering `view`, `text`, `pressable`, `text-input`, `image`, `link`, `picker`, `picker-item`, and `scroll-view` as Vue components backed by ordinary HTML elements; `text-input` must implement `modelValue` and `update:modelValue`.
- `src/App.vue` importing and rendering every screen whose coverage is `generated`, in workflow order.
- `scripts/verify-generated.mjs` recursively finding `.vue` files, parsing each with `parse`, compiling `<script setup>` with `compileScript`, compiling the template with `compileTemplate`, and exiting nonzero on any compiler error.

No generated file may contain a hand-authored replacement for a refused screen. The generated runtime is part of the target workspace contract, not a source migration.

- [ ] **Step 5: Run the focused CLI tests**

```bash
corepack pnpm --filter @memolabs-apps/cli test -- transform.test.ts
corepack pnpm --filter @memolabs-apps/cli build
```

Expected: scaffold contract and file generation tests pass and the CLI package compiles.

---

### Task 4: Compose the real providers in the delivered CLI

**Files:**

- Create: `packages/cli/src/default-transform.ts`
- Modify: `packages/cli/src/cli.ts:409-420`
- Modify: `packages/cli/src/index.ts`
- Modify: `packages/cli/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Export `createDefaultTransformDeps(): TransformDeps`.
- The returned dependency object registers only the Vue adapter for this bounded change and returns `createVueLowering()`, `createNativeTarget()`, the real inspection plan, and the Vue workspace scaffold.
- `runCli()` uses `context.transform ?? createDefaultTransformDeps()` for the transform command.
- Explicit test context remains authoritative and keeps fake-provider tests isolated.

- [ ] **Step 1: Write the composition test**

Add a test that runs `runCli(['transform', fixture, '--profile', 'vue-mobile', '--out', output, '--write', '--json'])` with no `context.transform`. Assert exit code 0, a real `workflowHash`, `generated/` screen files, `src/main.ts`, and `navirox.manifest.json`.

The test must fail if the result contains `missing-provider`.

- [ ] **Step 2: Run the focused test and confirm failure**

```bash
corepack pnpm --filter @memolabs-apps/cli test -- transform.test.ts
```

Expected: the no-context test fails with `missing-provider` before the composition root exists.

- [ ] **Step 3: Implement `createDefaultTransformDeps()`**

Use a `SourceAdapterRegistry` containing `createVueAdapter()`. Implement `inspectPlan` with `runInspection({ rootDir: root, registry })`; if inspection fails, throw an error containing its reason and message. Return `{ adapterId: outcome.report.source.adapterId, graph: outcome.report.graph, plan: { decisions: [] } }`. Return `createVueLowering()`, `createNativeTarget()`, and `createVueWorkspaceScaffold()`.

Do not import any source package into `target-native`, and do not move framework knowledge into `transform.ts`.

- [ ] **Step 4: Wire the composition root into `runCli()`**

At the transform command branch, create the default dependencies only when `context.transform` is absent. Do not create the registry for unrelated commands. Keep the current JSON rendering and exit code behavior unchanged.

- [ ] **Step 5: Add the CLI dependency and run install**

Add `@memolabs-apps/source-vue` and `@memolabs-apps/target-native` to `packages/cli/package.json` if not already present, then run:

```bash
corepack pnpm install
corepack pnpm --filter @memolabs-apps/cli test -- transform.test.ts
```

Expected: the real-provider CLI test passes and the lockfile is updated without unrelated dependency drift.

---

### Task 5: Prove the delivered CLI output and workspace test

**Files:**

- Create: `packages/cli/src/transform-delivered.test.ts`
- Modify: `packages/cli/src/transform.test.ts`
- Create: `docs/evidence/vue-transform-workspace-run.md` only after the command has produced a real artifact

**Interfaces:**

- The test invokes the exported `runCli()` path, not `transform()` with a fake provider.
- The evidence file records the exact command, fixture path, generated hashes, workspace test output, the separate refusal result, and limitations; it must not claim device or visual evidence.

- [ ] **Step 1: Add the real positive CLI e2e test**

The test must use `packages/cli/fixtures/vue-transform-workspace/vue`:

1. Create a temporary output directory.
2. Run `runCli()` without a transform context.
3. Assert `result.ok`, `dryRun === false`, and `stages` includes `discovery`, `inspect-plan`, `lower`, `emit`, `scaffold`.
4. Assert the manifest lists `generated/Home.vue`, `generated/About.vue`, `src/main.ts`, and `package.json`.
5. Run the generated workspace's package manager install/test command from the output directory using the repository's pinned pnpm via `corepack`.
6. Assert the generated workspace test exits 0.

The test must use the fixture's supported Vue version and must not mock discovery, lowering, emission, or scaffold.

- [ ] **Step 2: Add the separate refusal e2e assertion**

Run the same delivered `runCli()` path against `packages/cli/fixtures/vue-transform-workspace-refused/vue` in dry-run mode. Assert the result contains the expected refusal finding, contains no `Refused.vue` planned path, and writes no output manifest. This keeps the positive workspace proof complete while proving that a refused screen is not replaced.

- [ ] **Step 3: Run the e2e tests and inspect the output**

```bash
corepack pnpm --filter @memolabs-apps/cli test -- transform-delivered.test.ts
```

Expected: both tests pass and the positive generated workspace's own test command exits 0. If package installation cannot run offline, record the exact unavailable command and do not mark the evidence complete.

- [ ] **Step 4: Record reproducible evidence**

Write `docs/evidence/vue-transform-workspace-run.md` with:

- the exact positive `navirox transform` command;
- positive fixture path and content hash;
- `navirox.manifest.json` and per-screen manifest hashes;
- generated workspace test command and exit code;
- the separate refusal command, finding code, and no-file result;
- limitations: no iOS/Android run, no visual fidelity, no claim beyond the exact Vue profile and fixtures.

- [ ] **Step 5: Run the full baseline**

```bash
corepack pnpm build
corepack pnpm test
corepack pnpm lint
corepack pnpm format:check
corepack pnpm exec openspec validate vue-transform-workspace-run --strict
corepack pnpm exec openspec validate --all
```

Expected: all commands exit 0, the generated workspace test exits 0, and the evidence names every unavailable proof rather than inferring it.

---

## Self-review checklist

- [ ] The CLI path has a test with no `context.transform` and no fake provider.
- [ ] The target has no `source` or `source-vue` import.
- [ ] The target output is parsed and template-compiled by the generated workspace verifier.
- [ ] Static text is not silently dropped by the lowering.
- [ ] A refused screen produces a finding and no file.
- [ ] Dry-run writes no manifest.
- [ ] The evidence states no native/device/visual claim.
- [ ] No commit is created.
