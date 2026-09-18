## 1. The shared predicate

- [x] 1.1 Add the application module predicate to the neutral package: the
      extensions it accepts and the declared exclusions for tests, configuration,
      entry points and declarations. Verify with unit tests over each exclusion.
- [x] 1.2 Export it and add a test that two callers asking about the same path get
      the same answer by construction. Verify with `pnpm --filter @navirox/source test`.

## 2. The adapters

- [x] 2.1 Report plain application modules as units in the Vue adapter, with a
      store declaration still winning the more specific kind. Verify with the
      fixture tests, which must now count the modules.
- [x] 2.2 Do the same in the Svelte adapter. Verify with its fixture.
- [x] 2.3 Remove the composable rule from the Nuxt adapter and prove the composable
      is still reported, by composition, with the same identifier. Verify with the
      Nuxt tests.

## 3. The consequences

- [x] 3.1 Confirm the cross-adapter gate still passes: both fixtures must gain the
      same unit kinds.
- [x] 3.2 Prove the reading reaches the plan: a module with no capability use is
      classified as shared on the fixture.
- [x] 3.3 Prove it reaches the engine: `navirox migrate` on a fixture writes the
      shared module, and a second run reports it as already migrated.
- [x] 3.4 Record the new reading under `docs/evidence/` and add a note to the older
      evidence files whose unit counts this change supersedes.

## 4. Verify

- [x] 4.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 4.2 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 4.3 Run `openspec validate application-module-units --strict`.
