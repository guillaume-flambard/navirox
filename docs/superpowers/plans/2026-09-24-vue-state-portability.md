# Vue State Portability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move only evidence-approved Vue Pinia setup stores and pure composables unchanged, verify their behavior in a generated Pinia workspace, and report every moved, manual, unknown, or unresolved unit atomically.

**Architecture:** `source-vue` parses state/composable syntax and attaches a neutral evidence record to the graph. A source-layer Vue planner rule consumes that record, while the neutral migration engine performs byte-preserving copies. The CLI composition stages generated, shared, and workspace files, runs the Vue behavior verifier in the staging workspace, and commits the complete transform transactionally.

**Tech Stack:** TypeScript 6, Vue 3, Pinia 4.0.3, Node test scripts, TypeScript AST parsing, Vitest, pnpm 11, Turbo, OpenSpec.

**Spec:** `docs/superpowers/specs/2026-09-24-vue-state-portability-design.md`; active change artifacts in `openspec/changes/vue-state-portability/`.

## Global Constraints

- Keep Vue and Pinia knowledge in `source-vue` or the declared CLI composition edge; `planner` and `migrate` remain framework-neutral.
- Use the all-or-nothing refusal rule: a failed evidence, behavior, write, or manifest step leaves the output unchanged.
- Move approved units byte-for-byte; do not add import rewrites to this profile.
- The generated workspace uses Pinia `4.0.3`; record the version and reason in the workspace and manifest.
- Pinia setup stores and pure composables are the only approved first-profile state units; async, dynamic import, network, storage, timer, subscription, plugin, and unresolved relative imports remain manual or unknown.
- Do not claim device behavior, visual fidelity, offline synchronization, persistence, or broad framework support.
- Do not commit or push changes; leave the worktree uncommitted for review.

---

## File Map

- `packages/source-vue/src/state-portability.ts`: AST parsing and the typed evidence contract for Pinia setup stores and pure composables.
- `packages/source-vue/src/inspect.ts`: attach evidence metadata to discovered units and emit source-located findings for unsupported state shapes.
- `packages/source-vue/src/index.ts`: export the evidence types, parser, rule, and migration provider used by the CLI composition.
- `packages/source-vue/src/state-portability.test.ts`: fixture-level parser, purity, import, effect, and determinism tests.
- `packages/source-vue/fixtures/vue-state-portability/`: pure, impure, dynamic-import, unresolved-import, and pure-composable fixtures.
- `packages/planner/src/classes.ts` and `packages/planner/src/rules.ts`: carry rule evidence/blockers and make unproven state modules non-portable by default.
- `packages/planner/src/plan.ts`: preserve rule-provided evidence and blockers in `MigrationDecision`.
- `packages/planner/src/plan.test.ts`: prove parsing alone no longer produces portable state decisions.
- `packages/source-vue/src/state-rule.ts`: the Vue source-layer `MigrationRule` that reads the neutral evidence metadata.
- `packages/migrate/src/engine.ts`: candidate/report fields, verification hook, byte-preserving migration path, and complete rollback.
- `packages/migrate/src/render.ts`: moved, manual, unknown, unresolved, and behavior evidence in the human report.
- `packages/migrate/src/engine.test.ts`: byte identity, verification failure, state-write failure, and directory rollback tests.
- `packages/source-vue/src/migration.ts`: source-owned migration provider and Pinia staging behavior verifier.
- `packages/source-vue/src/migration.test.ts`: provider output, Pinia runtime, fixture pass/fail, and unresolved/manual report tests.
- `packages/source/src/transform-seam.ts`: optional migration/workspace evidence inputs without importing Vue.
- `packages/source/src/workspace.ts` and `packages/source-vue/src/workspace.ts`: accept migration-owned runtime/verification metadata and generate the Pinia entrypoint and verifier.
- `packages/cli/src/default-transform.ts`: compose the real Vue planner rule and migration provider.
- `packages/cli/src/transform.ts`: pass plans and staged files through migration, verify before commit, and make final writes transactional.
- `packages/cli/src/transform-delivered.test.ts`: real production transform coverage and manifest ownership.
- `packages/cli/src/transform.test.ts`: failure and rollback coverage at the CLI seam.
- `docs/evidence/vue-state-portability.md`: exact commands, fixture hashes, outcomes, and limitations.
- `openspec/changes/vue-state-portability/`: approved Pinia profile, evidence contract, migration behavior, and task completion updates.

---

### Task 1: Reconcile the OpenSpec contract with the approved Pinia profile

**Files:**

- Modify: `openspec/changes/vue-state-portability/proposal.md`
- Modify: `openspec/changes/vue-state-portability/design.md`
- Modify: `openspec/changes/vue-state-portability/specs/vue-state-portability/spec.md`
- Modify: `openspec/changes/vue-state-portability/specs/migration-classification/spec.md`
- Modify: `openspec/changes/vue-state-portability/specs/migration-engine/spec.md`
- Modify: `openspec/changes/vue-state-portability/tasks.md`

**Interfaces:**

- Produces: the normative `StatePortabilityEvidence` profile names, Pinia `4.0.3` runtime version, candidate-versus-moved distinction, and manual/unknown refusal codes consumed by later tasks.

- [ ] **Step 1: Update the proposal and design with the approved scope**

Record that Pinia setup stores and pure composables are included, Pinia `4.0.3` is supplied to the generated workspace, only `vue` and `pinia` imports are allowed in the first profile, and relative imports remain manual until a later closure contract exists.

- [ ] **Step 2: Add the behavior-gate scenarios to the delta specs**

Add scenarios for a pending behavior result, a passing generated-workspace fixture, a failed fixture with no final output, and separate moved/manual/unknown reporting. Keep the existing “parsing is not portability” requirement normative.

- [ ] **Step 3: Validate the reconciled artifacts**

Run:

```bash
corepack pnpm exec openspec validate vue-state-portability --strict
corepack pnpm exec openspec validate --changes --strict
```

Expected: both commands exit 0 and the change remains nine tasks with no invented capability.

---

### Task 2: Build the source-vue state evidence parser and fixtures

**Files:**

- Create: `packages/source-vue/src/state-portability.ts`
- Create: `packages/source-vue/src/state-portability.test.ts`
- Create: `packages/source-vue/fixtures/vue-state-portability/pure-store/src/stores/counter.ts`
- Create: `packages/source-vue/fixtures/vue-state-portability/pure-store/package.json`
- Create: `packages/source-vue/fixtures/vue-state-portability/impure-store/src/stores/remote.ts`
- Create: `packages/source-vue/fixtures/vue-state-portability/impure-store/state-portability.json`
- Create: `packages/source-vue/fixtures/vue-state-portability/dynamic-import/src/stores/lazy.ts`
- Create: `packages/source-vue/fixtures/vue-state-portability/dynamic-import/state-portability.json`
- Create: `packages/source-vue/fixtures/vue-state-portability/unresolved-import/src/stores/missing.ts`
- Create: `packages/source-vue/fixtures/vue-state-portability/unresolved-import/state-portability.json`
- Create: `packages/source-vue/fixtures/vue-state-portability/pure-composable/src/composables/useCounter.ts`
- Create: `packages/source-vue/fixtures/vue-state-portability/pure-composable/state-portability.json`
- Create: `packages/source-vue/fixtures/vue-state-portability/pure-store/state-portability.json`
- Modify: `packages/source-vue/src/inspect.ts:172-200,343-373`
- Modify: `packages/source-vue/src/index.ts:56-58`

**Interfaces:**

- Produces:

```ts
export type StatePortabilityProfile = 'pinia-setup' | 'composable-pure'
export type StatePortabilityStatus = 'approved' | 'manual' | 'unknown'
export type BehaviorStatus = 'pending' | 'passed' | 'failed'

export interface StatePortabilityFixtureSpec {
  readonly id: string
  readonly assertions: readonly {
    readonly expression: string
    readonly expected: string
  }[]
}

export interface StatePortabilityEvidence {
  readonly profile: StatePortabilityProfile
  readonly syntax: string
  readonly imports: readonly {
    readonly specifier: string
    readonly status: 'allowed' | 'unresolved' | 'disallowed'
  }[]
  readonly effects: readonly string[]
  readonly fixture: {
    readonly id: string
    readonly sourceHash: string
    readonly status: BehaviorStatus
    readonly assertions: readonly {
      readonly expression: string
      readonly expected: string
    }[]
  }
  readonly status: StatePortabilityStatus
  readonly blockers: readonly string[]
}

export function inspectStatePortability(
  file: string,
  text: string,
  fixtureText?: string,
): StatePortabilityEvidence | undefined
```

- [ ] **Step 1: Write parser tests before implementation**

Cover these exact cases:

```ts
expect(inspectStatePortability('pure.ts', pureStore)?.profile).toBe('pinia-setup')
expect(inspectStatePortability('pure.ts', pureStore)?.status).toBe('approved')
expect(inspectStatePortability('remote.ts', impureStore)?.status).toBe('manual')
expect(inspectStatePortability('lazy.ts', dynamicImport)?.status).toBe('manual')
expect(inspectStatePortability('missing.ts', unresolvedImport)?.status).toBe('unknown')
expect(inspectStatePortability('useCounter.ts', pureComposable)?.profile).toBe('composable-pure')
```

Also assert the source hash is stable, a valid sibling fixture descriptor produces deterministic `pending` evidence and declared assertions, a missing or invalid descriptor is `manual`, `defineStore` setup syntax is recognized only when the `defineStore` import comes from `pinia`, and every blocker names the source file and line.

- [ ] **Step 2: Run the parser tests red**

Run:

```bash
corepack pnpm --filter @memolabs-apps/source-vue test -- --run src/state-portability.test.ts
```

Expected: FAIL because the parser and evidence type do not exist.

- [ ] **Step 3: Implement the AST parser**

Use the TypeScript compiler API already pinned in `source-vue`. Recognize a `defineStore(id, setupFunction)` call, a setup arrow/function body, and exported `useX` composables. Collect static import specifiers and dynamic import expressions. Mark only `vue` and `pinia` as allowed, reject relative imports in this profile, and record network/storage/timer/async/subscription/plugin effects as blockers. Read an optional sibling `state-portability.json` fixture descriptor, hash the source, and copy its declared assertions into the evidence; without a valid descriptor, the candidate is `manual` rather than silently approved. Set `fixture.status` to `pending`; the output verifier will promote it to `passed` or `failed`.

- [ ] **Step 4: Attach evidence to `DiscoveredUnit.metadata`**

In `readModule`, attach `metadata.statePortability` for every recognized state/composable unit. Keep ordinary utilities without evidence eligible only for the existing generic rules, not for the new Vue rule. Emit source-located findings for impure, dynamic, or unresolved state units instead of silently dropping them.

- [ ] **Step 5: Run the source-vue fixture suite green**

Run:

```bash
corepack pnpm --filter @memolabs-apps/source-vue test
```

Expected: all state-portability and existing Vue tests pass, with fixture findings preserved.

---

### Task 3: Add the neutral planner evidence contract and Vue source rule

**Files:**

- Modify: `packages/planner/src/classes.ts:33-49`
- Modify: `packages/planner/src/rules.ts:47-52,162-170`
- Modify: `packages/planner/src/plan.ts:181-210`
- Modify: `packages/planner/src/plan.test.ts:69-95`
- Create: `packages/source-vue/src/state-rule.ts`
- Modify: `packages/source-vue/src/index.ts`
- Modify: `packages/source-vue/package.json`

**Interfaces:**

- `RuleDecision` gains optional `evidence: readonly Evidence[]` and `blockers: readonly string[]`.
- `plan()` uses rule-provided evidence/blockers when present and otherwise keeps the existing evidence fallback.
- `createVueStatePortabilityRule(): MigrationRule` is exported from `source-vue` and reads `unit.metadata.statePortability` without importing Vue into `planner` or `migrate`.

- [ ] **Step 1: Add planner contract tests**

Change the existing “state module is portable” test to assert `unknown` without Vue evidence. Add a test that an approved evidence record produces `portable`, a rejected record produces `manual`, and both decisions contain framework-profile and behavior evidence entries.

- [ ] **Step 2: Run planner tests red**

```bash
corepack pnpm --filter @memolabs-apps/planner test -- --run src/plan.test.ts
```

Expected: the old unconditional portable assertion fails and the new evidence assertions cannot compile until the contract is added.

- [ ] **Step 3: Extend `RuleDecision` and `plan()`**

Add:

```ts
export interface RuleDecision {
  readonly classification: MigrationClass
  readonly confidence: Confidence
  readonly message: string
  readonly evidence?: readonly Evidence[]
  readonly blockers?: readonly string[]
}
```

In `plan()`, use `decision.evidence ?? evidenceFor(...)` and copy `decision.blockers` into the final `MigrationDecision`. Change the generic `unit-state-module` rule to `unknown` with a message that a source-specific evidence gate is required.

- [ ] **Step 4: Implement the Vue rule in `source-vue`**

The rule applies only when `unit.metadata.statePortability` exists. It returns `portable` for `status === 'approved'`, even when the behavior fixture is `pending`, because the unit is a migration candidate; it returns `manual` for known unsupported effects and `unknown` for unresolved/dynamic evidence. Every decision includes an evidence entry naming the profile and a behavior entry naming the pending fixture.

- [ ] **Step 5: Run planner and source-vue tests green**

```bash
corepack pnpm --filter @memolabs-apps/planner test
corepack pnpm --filter @memolabs-apps/source-vue test
```

Expected: no neutral rule approves an unproven state module and the Vue rule is deterministic over identical graphs.

---

### Task 4: Make neutral migration verification and rollback explicit

**Files:**

- Modify: `packages/migrate/src/engine.ts:42-92,118-279`
- Modify: `packages/migrate/src/render.ts:20-62`
- Modify: `packages/migrate/src/index.ts`
- Modify: `packages/migrate/src/engine.test.ts`

**Interfaces:**
Add the following report contracts beside the existing `MigrationReport` fields:

```ts
export interface MigrationManualUnit {
  readonly unit: NodeId
  readonly reason: string
}

export interface MigrationUnknownUnit {
  readonly unit: NodeId
  readonly reason: string
}

export interface MigrationBehaviorResult {
  readonly unit: NodeId
  readonly fixtureId: string
  readonly sourceHash: string
  readonly status: 'passed' | 'failed'
}

export interface MigrationVerificationInput {
  readonly report: MigrationReport
  readonly outputRoot: string
}

export interface MigrationVerificationResult {
  readonly passedUnitIds: readonly NodeId[]
  readonly failedUnitIds: readonly NodeId[]
  readonly fixtureIds: readonly string[]
  readonly sourceHashes: Readonly<Record<string, string>>
}
```

Extend `MigrationReport` with readonly `manual`, `unknown`, and `behavior` arrays, and add `readonly verify?: (input: MigrationVerificationInput) => MigrationVerificationResult` to the existing `MigrationOptions` interface without removing its current fields.

- [ ] **Step 1: Write failing engine tests**

Add tests for a passing verification hook, a failed hook restoring an existing output file, a failure while writing `.navirox/migration.json`, and removal of a newly created directory. Assert that a failed unit is named and no manifest/state file remains.

- [ ] **Step 2: Run the migration tests red**

```bash
corepack pnpm --filter @memolabs-apps/migrate test -- --run src/engine.test.ts
```

Expected: the new verification and rollback assertions fail because `MigrationOptions` has no hook and state-write failure currently leaves earlier files behind.

- [ ] **Step 3: Track created directories and make state-write rollback complete**

Extend the held-write bookkeeping with created directory paths. On any file or state write error, restore held files, remove directories created by this run, and throw `MigrationError` containing the failed unit and restored paths.

- [ ] **Step 4: Add verification before the report is considered successful**

When `write: true` and `verify` is present, call the hook after writes and before returning. Remove failed units from `moved`, restore every write from the run (including the state file if it was already created), and return a report whose `skipped` entry names the failed fixture; the hook result must never leave a partial output tree. A dry run calls no verifier and leaves the output untouched.

- [ ] **Step 5: Render all outcome classes**

Update `renderMigration` to print separate `Moved`, `Manual`, `Unknown`, `Unresolved imports`, and `Behavior verification` sections using stable sorted records.

- [ ] **Step 6: Run migration tests and typecheck**

```bash
corepack pnpm --filter @memolabs-apps/migrate test
corepack pnpm --filter @memolabs-apps/migrate typecheck
```

Expected: all engine, state, render, and rollback tests pass.

---

### Task 5: Implement the Vue migration provider and Pinia behavior verifier

**Files:**

- Create: `packages/source-vue/src/migration.ts`
- Create: `packages/source-vue/src/migration.test.ts`
- Modify: `packages/source-vue/src/workspace.ts`
- Modify: `packages/source-vue/src/workspace.test.ts`
- Modify: `packages/source/src/transform-seam.ts:70-107`
- Modify: `packages/source/src/index.ts:91-107`
- Modify: `packages/source-vue/package.json` (add the already-used workspace dependencies `@memolabs-apps/planner` and `@memolabs-apps/migrate` only if the provider imports them directly)

**Interfaces:**

- Export:

```ts
export interface VueStateMigrationInput {
  readonly sourceRoot: string
  readonly graph: AppGraph
  readonly plan: MigrationPlan
  readonly readText: (path: string) => string | undefined
  readonly generatedFiles: readonly { readonly path: string; readonly content: string }[]
  readonly workspaceFiles: readonly { readonly path: string; readonly content: string }[]
}

export interface VueStateMigrationResult {
  readonly files: readonly { readonly path: string; readonly content: string }[]
  readonly moved: readonly string[]
  readonly manual: readonly { readonly unit: string; readonly reason: string }[]
  readonly unknown: readonly { readonly unit: string; readonly reason: string }[]
  readonly unresolved: readonly {
    readonly unit: string
    readonly specifier: string
    readonly reason: string
  }[]
  readonly behavior: readonly {
    readonly unit: string
    readonly fixtureId: string
    readonly sourceHash: string
    readonly status: 'passed' | 'failed'
  }[]
}

export function createVueStateMigrationProvider(): {
  readonly id: string
  readonly migrate: (input: VueStateMigrationInput) => Promise<VueStateMigrationResult>
}
```

`WorkspaceScaffoldInput` gains optional `migration?: { readonly piniaVersion: string; readonly verification: string; readonly hasPinia?: boolean }` so the source-owned workspace can add Pinia only when a Pinia candidate exists; an explicit `hasPinia: false` keeps composable-only scaffolds Pinia-free.

- [ ] **Step 1: Write provider and workspace tests**

Cover pure Pinia setup, pure composable, impure store, unresolved import, byte-identical shared output, Pinia `4.0.3` package output, and a failed behavior fixture that returns no moved file.

- [ ] **Step 2: Run provider tests red**

```bash
corepack pnpm --filter @memolabs-apps/source-vue test -- --run src/migration.test.ts
```

Expected: FAIL because the provider, migration seam input, and Pinia workspace metadata do not exist.

- [ ] **Step 3: Implement source-owned migration orchestration**

The provider receives the source root, graph, `MigrationPlan`, reader, and planned generated/workspace files. It runs the neutral engine in a temporary output directory with only `copyMovableUnit`, reads the copied state files, and returns their bytes as planned shared files. It never imports a target provider or changes source bytes.

- [ ] **Step 4: Generate and run the Pinia fixture**

When a `pinia-setup` candidate exists, add exact dependencies `pinia: 4.0.3` and `typescript: 6.0.3` to the staged package, register `createPinia` in the staged entrypoint, transpile the moved TypeScript store with the workspace’s TypeScript dependency, import it with an active Pinia instance, and assert the fixture’s initial state and declared action transition. A failed assertion returns `status: 'failed'`, marks the unit manual/unknown, and causes the provider to return no moved store file.

- [ ] **Step 5: Keep route-free workspaces safe**

Only add `createPinia` and the Pinia dependency when `migration.hasPinia === true` (or the legacy metadata explicitly supplies a non-empty Pinia version). A workflow without a Pinia candidate, or with `hasPinia: false`, keeps the existing Vue/Router entrypoint and does not import Pinia at runtime.

- [ ] **Step 6: Run source-vue and source boundary tests**

```bash
corepack pnpm --filter @memolabs-apps/source-vue test
corepack pnpm --filter @memolabs-apps/source test -- --run src/boundary.test.ts
```

Expected: provider tests pass and no source-vue import of a target provider is introduced.

---

### Task 6: Compose the real provider in the CLI and make transform commit atomic

**Files:**

- Modify: `packages/cli/src/default-transform.ts`
- Modify: `packages/cli/src/transform.ts:100-189,600-779`
- Modify: `packages/cli/src/cli.ts` (adapter-aware `plan`/`migrate` composition)
- Modify: `packages/cli/src/transform.test.ts`
- Modify: `packages/cli/src/transform-delivered.test.ts`
- Modify: `packages/cli/src/migrate.test.ts` (honest unproven-state expectations)

**Interfaces:**

- `TransformMigrateOutcome` adds sorted `manual`, `unknown`, `unresolved`, and `behavior` records, plus the provider's `moved` and verification file paths.
- `TransformInspectPlan.plan` carries the real `MigrationPlan` returned by the production planner composition.
- The migration callback receives the plan plus planned generated/workspace files and a source text reader.
- `TransformManifestDocument.migration` records candidate, moved, manual, unknown, unresolved, behavior, and conditional Pinia version/reason; the human report repeats the same records.
- The final writer is `commitPlannedFiles(outputRoot, files, manifestPath, manifestContent): void` and restores every prior file and created directory on failure.

- [ ] **Step 1: Add CLI failure and production tests**

Add tests for a real default transform with a pure Pinia store, an impure store appearing in `manual/REPORT.md`, a failed behavior fixture with exit code 1 and no output, a write failure restoring an existing output file, and manifest ownership of the shared and verification files.

- [ ] **Step 2: Run CLI tests red**

```bash
corepack pnpm --filter @memolabs-apps/cli test -- --run src/transform.test.ts src/transform-delivered.test.ts
```

Expected: new tests fail because the default transform has no planner/migrate provider and the final writer is not transactional.

- [ ] **Step 3: Compose the real rule and provider**

In `default-transform.ts`, call `plan(outcome.report.graph, { rules: [createVueStatePortabilityRule()] })`, return that plan, and install `createVueStateMigrationProvider()` as `migrate`. In `cli.ts`, use the same source rule for the standalone `plan` and `migrate` commands when the inspected adapter is Vue; an unproven non-Vue state module must stay unknown rather than regain unconditional portable behavior.

- [ ] **Step 4: Pass staged files through the provider**

Scaffold the source-owned workspace before calling the migration callback. Compute `hasPinia` from the real plan/graph and pass `WorkspaceMigrationMetadata` only for an approved `pinia-setup` candidate (`hasPinia: true`, exact `4.0.3`, verification reason); composable-only and route-free scaffolds receive no Pinia metadata. Pass generated and scaffold files to the provider so it can construct a temporary complete workspace for the behavior fixture. Convert the provider result into `sharedFiles`, findings, manual/unknown/unresolved records, and workspace verification metadata.

- [ ] **Step 5: Make final writes transactional**

Before writing, hold every existing target file and record directories that do not yet exist. Write generated, shared, manual, scaffold, verification, and manifest files inside one try block. On any error, restore held files, remove new directories, and return a refusal with no manifest.

- [ ] **Step 6: Update manifest and human report ownership**

Add stable `migration` records to `TransformManifestDocument`: candidate/moved/manual/unknown units, output paths, unresolved imports, behavior fixture/hash/status, and Pinia version/reason. Ensure `manual/REPORT.md` repeats the same records and no placeholder report claims empty work.

- [ ] **Step 7: Run CLI tests green**

```bash
corepack pnpm --filter @memolabs-apps/cli test
corepack pnpm --filter @memolabs-apps/cli typecheck
```

Expected: real transform tests pass and the existing route/action-state transform tests remain green.

---

### Task 7: Record evidence and reconcile the active tasks

**Files:**

- Create: `docs/evidence/vue-state-portability.md`
- Modify: `openspec/changes/vue-state-portability/tasks.md`
- Modify: `docs/OPENSPEC-BACKLOG.md`

**Interfaces:**

- Evidence names the exact fixture paths, SHA-256 hashes, commands, moved/manual/unknown/unresolved records, Pinia version, behavior result, rollback result, and limitations.

- [ ] **Step 1: Run the focused baseline**

```bash
corepack pnpm --filter @memolabs-apps/source-vue test
corepack pnpm --filter @memolabs-apps/planner test
corepack pnpm --filter @memolabs-apps/migrate test
corepack pnpm --filter @memolabs-apps/cli test
```

- [ ] **Step 2: Run a real positive transform**

Use a new output directory, install the generated workspace with `--ignore-scripts`, run its state verifier, and record the command output and hashes. Do not reuse a previous output directory.

- [ ] **Step 3: Run a real refusal transform**

Run the impure, dynamic-import, unresolved-import, and failed-fixture cases. Assert exit code 1, named findings, no final manifest, and unchanged pre-existing output.

- [ ] **Step 4: Write the evidence document**

Record the profile boundary and the following outcomes separately: moved, manual, unknown, unresolved imports, behavior passed, behavior failed, rollback passed, and no output after refusal. State that no iOS/Android/device or visual evidence exists.

- [ ] **Step 5: Mark tasks only after their verification exists**

Mark tasks 1.1 through 3.2 complete only when the corresponding focused test and evidence command have fresh output. Leave the complete-baseline tasks 4.1 and 4.2 unchecked until Task 8 passes. Update the backlog to state that `vue-state-portability` is complete and `vue-native-style-profile` is next only after the final baseline and strict validation.

---

### Task 8: Run the complete baseline and strict OpenSpec validation

**Files:**

- No additional implementation files; update only evidence or task status if a command exposes a real discrepancy.

- [ ] **Step 1: Run build, tests, typecheck, lint, format, dependency drift, and OpenSpec validation**

```bash
corepack pnpm build
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm deps:check
corepack pnpm exec openspec validate vue-state-portability --strict
corepack pnpm exec openspec validate --all
rtk git diff --check
```

Expected: every command exits 0. Record exact task totals and the OpenSpec total in the evidence document.

- [ ] **Step 2: Review the final diff without committing**

Inspect `rtk git status --short`, `rtk git diff --stat`, and the generated manifest/report output. Confirm no temporary staging directory, generated dependency lockfile, or device artifact entered the repository.

- [ ] **Step 3: Stop at the review boundary**

Leave all files uncommitted and unpushed. The next permitted work is the separately scoped native style profile; do not open T3 device proof from this change.
