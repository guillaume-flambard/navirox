## 1. Vue state evidence

- [ ] 1.1 Add pure, impure, dynamic-import and unresolved-import state fixtures; verify `corepack pnpm --filter @memolabs-apps/source-vue test` and fixture findings.
- [ ] 1.2 Add a Vue-specific planner evidence rule that refuses portable classification without purity, import and behavior evidence; verify `corepack pnpm --filter @memolabs-apps/planner test`.

## 2. Migration behavior

- [ ] 2.1 Move an approved pure unit unchanged through the existing migration engine and verify byte identity with `corepack pnpm --filter @memolabs-apps/migrate test`.
- [ ] 2.2 Verify the output behavior fixture passes before the unit is marked moved; verify the failure path rolls back with no partial output.
- [ ] 2.3 Report moved files, unresolved imports and manual or unknown units in the transform result; verify `corepack pnpm --filter @memolabs-apps/cli test`.

## 3. Production composition

- [ ] 3.1 Add the Vue migration provider to the production transform composition without importing Vue into the neutral engine; verify the dependency boundary test.
- [ ] 3.2 Generate the shared and manual report entries from the migration result and verify manifest file ownership.

## 4. Baseline and evidence

- [ ] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-state-portability --strict` and `corepack pnpm exec openspec validate --all`.
- [ ] 4.2 Record moved, manual, unknown and unresolved-import outcomes with fixture hashes before opening T3 device proof.
