## 1. Route contract

- [ ] 1.1 Add versioned route records, parameters, screen references and navigation action targets to the Workflow IR; verify round-trip and migration refusal with `corepack pnpm --filter @memolabs-apps/workflow test`.
- [ ] 1.2 Add neutral route facts to the App Graph contract and stable route identifiers; verify `corepack pnpm --filter @memolabs-apps/graph test`.

## 2. Vue router lowering

- [ ] 2.1 Add literal route, named parameter and deep-link positive fixtures; verify `corepack pnpm --filter @memolabs-apps/source-vue test`.
- [ ] 2.2 Lower literal routes into workflow route records linked to the existing screen ids; verify workflow hashes and source locations.
- [ ] 2.3 Add computed route, guard, plugin and unresolved component refusal fixtures; verify no partial route or screen is emitted.

## 3. Target and workspace

- [ ] 3.1 Emit route metadata and navigation actions from the IR without reading the source SFC; verify `corepack pnpm --filter @memolabs-apps/target-native test`.
- [ ] 3.2 Generate a route-aware workspace entry and verify route identifiers in the workspace test; verify `corepack pnpm --filter @memolabs-apps/cli test`.

## 4. Baseline

- [ ] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-router-workflow-lowering --strict` and `corepack pnpm exec openspec validate --all`.
- [ ] 4.2 Record the exact supported router profile and all refusal classes in evidence before opening the T3 device change.
