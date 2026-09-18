## 1. Teach the shared vocabulary the framework spellings

- [x] 1.1 Add the framework data helpers to the neutral capability patterns as a
      network request with the invoke usage, without adding a capability name.
      Verify with the neutral capability test, including that the same call in a
      plain project and a Nuxt project yields the same capability and usage.
- [x] 1.2 Confirm no adapter regression: the Vue and Svelte suites still pass
      unchanged. Verify with `pnpm --filter @navirox/source-vue test` and
      `pnpm --filter @navirox/source-svelte test`.

## 2. Add the Nuxt adapter

- [x] 2.1 Create `packages/source-nuxt` with the package conventions, depending on
      the two neutral packages and on `@navirox/source-vue`, and declaring that it
      composes the Vue adapter. Verify with
      `pnpm --filter @navirox/source-nuxt build`.
- [x] 2.2 Implement detection over the manifest with evidence, and no throw on a
      missing or malformed one. Verify with the fixture and an empty directory.
- [x] 2.3 Implement route reading from the pages directory: the root index, a
      named directory, a dynamic segment, and an optional dynamic segment.
      Verify with a fixture whose routes are known.
- [x] 2.4 Implement layout units and composable units. Verify with the fixture,
      asserting one unit of each kind with the right source location.
- [x] 2.5 Implement the findings for the server directory, plugins, middleware and
      the runtime configuration, and prove none of them becomes a unit or a route.
      Verify with a negative fixture.
- [x] 2.6 Implement the fragment through the neutral mapper, with this adapter's
      identifier on every node. Verify that two inspections of the fixture produce
      the same fragment.
- [x] 2.7 Add the fixture projects: a Nuxt application with pages, layouts,
      composables and a server directory, and a negative fixture with the files
      the adapter refuses to model.

## 3. Compose and compare

- [x] 3.1 Register the adapter at the composition root in `packages/cli/src/cli.ts`
      and confirm the registry lists four adapters. Verify with
      `pnpm --filter @navirox/cli test`.
- [x] 3.2 Prove the composition works end to end: inspect the Nuxt fixture through
      the pipeline and confirm the report contains both the Nuxt routes and the
      component units the Vue adapter read, with this adapter's identifier on both.
      Verify with a CLI test.
- [x] 3.3 Confirm the cross-adapter gate still passes unchanged, since the two
      fixtures it compares are untouched.

## 4. Position and record

- [x] 4.1 Add the package to the root `tsconfig.json` references and to
      `pnpm-lock.yaml`. Verify with a root `pnpm build`.
- [x] 4.2 Update `README.md`: the package table gains the adapter and the support
      matrix moves Nuxt to the level its inspection reaches.
- [x] 4.3 Record the reading in `docs/evidence/`: what a Nuxt project reports, the
      real project it was taken from if one exists, and what the adapter refuses to
      model.

## 5. Verify

- [x] 5.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 5.2 Inspect a Nuxt project with `navirox inspect -C` and record the output.
      No Nuxt application exists on this machine, so the reading is taken from the
      adapter's fixture and the evidence file says exactly that. The command line
      reading found a defect the tests had not (the descriptor reported the Vue
      range under the Nuxt name); fixed, and recorded in
      `docs/evidence/nuxt-reading.md`.
- [x] 5.3 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 5.4 Run `openspec validate nuxt-source-adapter --strict` and confirm the
      change is complete.
