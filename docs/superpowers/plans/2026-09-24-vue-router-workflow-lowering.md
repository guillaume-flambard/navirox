# Vue Router Workflow Lowering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bounded literal Vue Router profile that carries routes, parameters, resolved screens and navigation actions into a versioned Workflow IR and generated workspace.

**Architecture:** Keep Vue Router syntax and refusal policy in `source-vue`, route facts in the framework-neutral App Graph, and route/navigation data in the neutral Workflow IR. Keep `state-update` actions unchanged; add a separate `navigation-actions` collection whose IDs share the event `actionId` namespace. The target emits neutral route metadata, while the source-owned Vue workspace provider turns that metadata into a deterministic Vue Router entry.

**Tech Stack:** TypeScript 6, pnpm 11, Vitest, Vue 3 compiler, Vue Router 4 fixtures, OpenSpec.

**Spec:** `openspec/changes/vue-router-workflow-lowering/proposal.md`, `openspec/changes/vue-router-workflow-lowering/design.md`, and the delta specs under `openspec/changes/vue-router-workflow-lowering/specs/`.

## Global Constraints

- Support only literal Vue Router route objects, literal nested route arrays, literal string paths, named parameters and statically resolved component modules.
- Navigation actions accept both literal `RouterLink`/`router-link` targets and named no-argument `router.push(...)` calls with literal path or named-route objects; dynamic route expressions remain refusals.
- Refuse computed route tables, route expressions or spreads, guards, plugin-dependent route behavior and unresolved components with source-located findings.
- Keep source framework imports out of neutral packages and keep target code independent of `source-vue`.
- Preserve all-or-nothing lowering: a refused route or screen emits no partial route or screen.
- Do not add Nuxt, SSR, authentication, middleware, device execution or visual claims.
- Do not commit or push without an explicit user request.

---

### Task 1: Route contracts in App Graph and Workflow IR

**Files:**

- Modify: `packages/source/src/types.ts`
- Modify: `packages/source/src/fragment.ts`
- Modify: `packages/graph/src/types.ts`
- Modify: `packages/workflow/src/index.ts`
- Test: `packages/source/src/fragment.test.ts`
- Test: `packages/graph/src/index.test.ts`
- Test: `packages/workflow/src/index.test.ts`

**Interfaces:**

- `DiscoveredRoute` gains optional `name?: string` and keeps its existing stable `key`, `pathPattern`, `params` and `source`.
- `RouteNode` gains optional `name?: string` and a deterministic existing `id`.
- Workflow schema becomes version `4` and exports `Route`, `NavigationAction` and `NAVIGATION_ACTION_KINDS`.
- `Route` is `{ id, pathPattern, name?: string, params: readonly string[], deepLink: string, screenId: string, source: SourceRef }`.
- `NavigationAction` is `{ id, kind: 'navigate', event, handler, routeId, deepLink, source: SourceRef }`.
- `Screen` gains `routeIds` and `navigationActions`; `Binding.actionId` resolves against state actions or navigation actions on the same screen.

- [ ] **Step 1: Write failing graph and IR contract tests.**

Add tests for route name preservation, stable route IDs, route round-trip, navigation action linkage, missing route target, and a version `3` serialized workflow receiving a versioned refusal.

```ts
const route: Route = {
  id: 'route:profile-id',
  pathPattern: '/profile/:id',
  name: 'profile',
  params: ['id'],
  deepLink: '/profile/:id',
  screenId: 'screen:profile',
  source,
}

const navigation: NavigationAction = {
  id: 'navigation:open-profile',
  kind: 'navigate',
  event: 'click',
  handler: 'openProfile',
  routeId: route.id,
  deepLink: route.deepLink,
  source,
}
```

- [ ] **Step 2: Run the focused tests and confirm the new contract fails.**

Run:

```bash
corepack pnpm --filter @memolabs-apps/graph test
corepack pnpm --filter @memolabs-apps/source test
corepack pnpm --filter @memolabs-apps/workflow test
```

Expected: failures for missing route name fields, schema version `3` fixtures and absent navigation action validation.

- [ ] **Step 3: Implement the neutral route records and validation.**

Add deterministic serialization order, route target checks, navigation action target checks, `routeIds` consistency checks and explicit rejection of the previous schema version. Keep the existing `state-update` action validation unchanged.

- [ ] **Step 4: Map discovered route names through the neutral fragment builder.**

Copy the optional route name from `DiscoveredRoute` to `RouteNode` without deriving a route from a directory convention. Keep route IDs based on the existing adapter, source file and route key.

- [ ] **Step 5: Run the focused tests and typecheck.**

Run:

```bash
corepack pnpm --filter @memolabs-apps/graph test
corepack pnpm --filter @memolabs-apps/source test
corepack pnpm --filter @memolabs-apps/workflow test
corepack pnpm --filter @memolabs-apps/workflow typecheck
```

Expected: all focused tests and typecheck pass.

---

### Task 2: Vue literal route lowering and refusals

**Files:**

- Modify: `packages/source-vue/src/routes.ts`
- Modify: `packages/source-vue/src/inspect.ts`
- Modify: `packages/source-vue/src/lower.ts`
- Create: `packages/source-vue/fixtures/vue-router-workflow/positive/`
- Create: `packages/source-vue/fixtures/vue-router-workflow/boundary/`
- Create: `packages/source-vue/fixtures/vue-router-workflow/refused/`
- Test: `packages/source-vue/src/routes.test.ts`
- Modify: `packages/source-vue/src/inspect.test.ts`
- Modify: `packages/source-vue/src/lower.test.ts`

**Interfaces:**

- `readRoutes` returns literal routes with optional name, parameter names, stable source locations and existing `unitFile` resolution.
- `RouteReading.findings` adds `router-guard-not-supported`, `router-plugin-not-supported` and `router-component-unresolved` without creating a route for the offending object.
- `buildScreen` receives graph route records and emits `routeIds` plus route-linked `navigationActions` for literal template router bindings.

- [ ] **Step 1: Add positive, boundary and refusal fixtures.**

The positive fixture contains a root route and a nested `/profile/:id` route with a literal name and static component imports, plus one literal `RouterLink` and one named no-argument `router.push` navigation. The boundary fixture contains a route without a name. The refused fixture contains a computed route table, a guard, an unresolved component and a dynamic navigation expression.

- [ ] **Step 2: Add failing route parser tests.**

Assert that literal names and parameters survive, nested paths are stable, and each unsupported shape yields a source-located finding while `routes` remains empty or excludes the offending route.

- [ ] **Step 3: Implement literal route names and refusal detection.**

Read only string-literal `name` and `path` properties. Reject guard properties and plugin/router hooks, unresolved component expressions, non-literal `children`, computed route tables and spreads. Preserve the existing deterministic route sort and source positions.

- [ ] **Step 4: Add failing lowering tests for route and navigation records.**

Lower a graph with a literal route, a literal `RouterLink` target and a named `router.push` call, then assert the workflow route id, `routeIds`, `deepLink`, both navigation actions, explicit event `actionId` values and source locations. Repeat the lower call and assert identical serialization and hash.

- [ ] **Step 5: Implement route collection lowering.**

Map graph route nodes to neutral `Route` records only when the referenced screen exists. Map literal `RouterLink` targets and named no-argument `router.push` calls to `NavigationAction` records; leave arbitrary or dynamic navigation expressions as `unsupported-navigation-handler` findings and clear the whole screen when any route refusal occurs.

- [ ] **Step 6: Run Vue route and lowering tests.**

Run:

```bash
corepack pnpm --filter @memolabs-apps/source-vue test
corepack pnpm --filter @memolabs-apps/source-vue typecheck
```

Expected: positive, boundary and refusal tests pass with no partial route or screen output.

---

### Task 3: Target route metadata and route-aware workspace

**Files:**

- Modify: `packages/target-native/src/index.ts`
- Modify: `packages/target-native/src/index.test.ts`
- Modify: `packages/source-vue/src/workspace.ts`
- Modify: `packages/source-vue/src/workspace.test.ts`
- Modify: `packages/cli/src/transform-delivered.test.ts`
- Test fixture: `packages/cli/fixtures/vue-transform-workspace/vue/src/router/index.ts`

**Interfaces:**

- `createNativeTarget().emit` emits deterministic route metadata beside generated screens without importing `source-vue` or reading the source SFC.
- The source-owned workspace provider reads the neutral lowering route records and emits `src/router.ts` using literal Vue Router configuration.
- Generated `src/App.vue` uses `RouterView`; generated navigation handlers are linked to route ids and deep-link patterns.

- [ ] **Step 1: Add failing target tests.**

Use a hand-written Workflow IR with two routes, a named parameter and one navigation action. Assert emitted route metadata, deterministic output and refusal for missing route targets. Keep an import-boundary assertion for the target package.

- [ ] **Step 2: Implement neutral target route metadata.**

Serialize route ids, path patterns, names, parameters, deep links, screen ids and navigation actions in a fixed field order. Do not add Vue Router imports to `target-native`.

- [ ] **Step 3: Add failing workspace tests.**

Assert the generated workspace contains `createRouter`, `createWebHistory`, `RouterView`, the literal route ids and the navigation handler. Run the generated verifier and assert it checks route identifiers and navigation functions.

- [ ] **Step 4: Implement the route-aware workspace entry.**

Generate a route module from workflow route records, map components by screen manifest output path, and render the generated App through `RouterView`. Keep the workspace verifier framework-aware only inside `source-vue`.

- [ ] **Step 5: Extend the CLI transform regression.**

Run the real Vue transform fixture and assert the generated route module, route identifiers and workspace `pnpm test` command. Confirm the refused route fixture writes no replacement output.

- [ ] **Step 6: Run target, workspace and CLI tests.**

Run:

```bash
corepack pnpm --filter @memolabs-apps/target-native test
corepack pnpm --filter @memolabs-apps/source-vue test
corepack pnpm --filter @memolabs-apps/cli test
```

Expected: all route metadata, workspace and transform tests pass.

---

### Task 4: Baseline, evidence and OpenSpec closure

**Files:**

- Create: `docs/evidence/vue-router-workflow-lowering.md`
- Modify: `openspec/changes/vue-router-workflow-lowering/tasks.md`
- Modify: `docs/OPENSPEC-BACKLOG.md` only after evidence is complete

**Interfaces:**

- Evidence names the exact supported literal route profile, refusal codes, commands, workflow hash and remaining device limitation.
- OpenSpec tasks are marked complete only after their focused tests and final baseline pass.

- [ ] **Step 1: Run focused tests and the full baseline.**

```bash
corepack pnpm build
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm exec openspec validate vue-router-workflow-lowering --type change --strict
corepack pnpm exec openspec validate --changes --strict
corepack pnpm exec openspec validate --specs
corepack pnpm exec openspec validate --all
git diff --check
```

- [ ] **Step 2: Record evidence.**

Document literal route support, route names and parameters, deterministic hashes, all refusal codes, generated workspace verification, and the fact that no iOS, Android, browser or visual behavior is proven.

- [ ] **Step 3: Complete task checkboxes and reconcile the backlog.**

Mark all 9 OpenSpec tasks complete only after their verification commands pass. Keep T3 device proof and T4 visual fidelity gated.

- [ ] **Step 4: Archive only after all tasks and evidence are complete.**

Run the OpenSpec archive workflow without committing or pushing, then verify `openspec validate --all` and `git diff --check` again.
