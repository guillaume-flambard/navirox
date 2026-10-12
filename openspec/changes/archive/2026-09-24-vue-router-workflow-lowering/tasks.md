## 1. Route contract

- [x] 1.1 Add versioned route records, parameters, screen references and navigation action targets to Workflow IR schema 4; verify route/navigation round-trip, both navigation link forms and migration refusal with `corepack pnpm --filter @memolabs-apps/workflow test`.
- [x] 1.2 Add neutral route facts, optional names, parameters and stable route identifiers to the App Graph contract; verify `corepack pnpm --filter @memolabs-apps/graph test`.

## 2. Vue router lowering

- [x] 2.1 Add literal route, named parameter, `RouterLink` and `router.push` positive/boundary fixtures; verify `corepack pnpm --filter @memolabs-apps/source-vue test`.
- [x] 2.2 Lower literal routes and both supported navigation forms into workflow route/navigation records linked to existing screen ids; verify workflow hashes, explicit action links and source locations.
- [x] 2.3 Add computed route, guard, plugin, unresolved component and dynamic navigation refusal fixtures; verify no partial route, action or screen is emitted.

## 3. Target and workspace

- [x] 3.1 Emit deterministic route metadata and navigation actions from the IR without reading the source SFC; verify `corepack pnpm --filter @memolabs-apps/target-native test`.
- [x] 3.2 Generate a route-aware workspace entry for both navigation forms and verify route identifiers in the workspace test; verify `corepack pnpm --filter @memolabs-apps/cli test`.

## 4. Baseline

- [x] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-router-workflow-lowering --strict` and `corepack pnpm exec openspec validate --all`.
- [x] 4.2 Record the exact supported router profile and all refusal classes in evidence before opening the T3 device change.
