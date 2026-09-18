## 1. Move the shared scan into the core

- [x] 1.1 Move the capability scan from `packages/source-vue/src/capabilities.ts`
      into `packages/source/src/capabilities.ts` unchanged in behaviour, and
      export it from the neutral package. Verify with
      `pnpm --filter @navirox/source build` and the existing Vue adapter tests,
      which must still pass without edits to their assertions.
- [x] 1.2 Have the Vue adapter import the scan from the neutral package and keep
      re-exporting it, so nothing that used it changes. Verify with
      `pnpm --filter @navirox/source-vue test`.
- [x] 1.3 Add a test in the neutral package that pins the scan's vocabulary: the
      declared capability names, the usage kinds, and the rule that a capabibility
      used without a direction is unknown. Verify with
      `pnpm --filter @navirox/source test`.
- [x] 1.4 Confirm the framework boundary check still reports no violation after a
      second adapter exists. Verify with `pnpm --filter @navirox/source test`.

## 2. Add the Svelte adapter

- [x] 2.1 Create `packages/source-svelte` with the package conventions, a
      dependency on `@navirox/graph` and `@navirox/source`, and the two tsconfig
      references. Verify with `pnpm --filter @navirox/source-svelte build`.
- [x] 2.2 Implement detection over the manifest, with evidence naming the file
      and the field, and no throw on a missing or malformed manifest. Verify with
      a fixture project and an empty directory.
- [x] 2.3 Implement component discovery over `.svelte` files, with script block
      detail as adapter owned metadata and every component reported once. Verify
      with the fixture.
- [x] 2.4 Implement store module discovery, reporting a declaration and not an
      import. Verify with both kinds of fixture module.
- [x] 2.5 Wire the neutral capability scan into the inspection, with the same
      evidence shape the Vue adapter produces. Verify with a fixture that reads
      and writes storage and calls geolocation.
- [x] 2.6 Implement the version check, dependency reporting and the unmodelled
      construct findings, and the graph fragment with deterministic identifiers.
      Verify with the fixture and a negative fixture.
- [x] 2.7 The Vue adapter's own assertions changed only where the fixture grew
      (two components and one API module added) and its determinism test still
      passes; no assertion about adapter behaviour moved. Add the mirrored fixture
      projects: one under `source-vue/fixtures` and
      one under `source-svelte/fixtures`, implementing the same journey (list,
      detail, state, storage, geolocation, API call, validated input). Verify
      that the Vue fixture inspection still produces the same report as before
      the fixture was extended.

## 3. Add the SvelteKit adapter

- [x] 3.1 Create `packages/source-sveltekit`, depending on the two neutral
      packages and nothing else, declaring that it composes the Svelte adapter.
      Verify with `pnpm --filter @navirox/source-sveltekit build`.
- [x] 3.2 Implement detection over the SvelteKit manifest entry. Verify with a
      SvelteKit fixture and with a plain Svelte project, which must not match.
- [x] 3.3 Implement route extraction from page files: root path, nested path,
      dynamic segment as a parameter, with the page file as the source location.
      Verify with a fixture whose routes are known.
- [x] 3.4 Implement the findings for server routes, layouts, and route files the
      adapter does not model, and prove that a page outside the routes directory
      produces no route. Verify with the negative fixture.
- [x] 3.5 Prove the registry prefers the meta-framework over the adapter it
      composes, through the neutral selection rule and without the registry
      naming either framework. Verify with a unit test over the two real
      adapters.

## 4. Run the gate

- [x] 4.1 Register both new adapters at the composition root in
      `packages/cli/src/cli.ts`. Verify with `pnpm --filter @navirox/cli test`.
- [x] 4.2 Write the comparison test: both fixtures through one pipeline, the same
      unit kinds, the same capabilities with the same usage kinds, every node
      kind drawn from the shared schema, and no adapter specific concept. Verify
      with `pnpm --filter @navirox/cli test`.
- [x] 4.3 Make the comparison's assertions fail on purpose once, by breaking one
      fixture, and confirm the test reports the divergence rather than passing.
- [x] 4.4 Declare package fixtures as `inputs` on the `test` task in
      `turbo.json` if the existing inputs do not cover them, and prove the cache
      invalidates on a fixture change.

## 5. Position and record

- [x] 5.1 Add both packages to the root `tsconfig.json` references and to
      `pnpm-lock.yaml`. Verify with a root `pnpm build`.
- [x] 5.2 Update `README.md`: the package table gains both adapters, and the
      support matrix moves Svelte and SvelteKit to the level their inspection
      actually reaches, leaving every other framework unclaimed.
- [x] 5.3 Record the gate outcome in `docs/evidence/`: what the second adapter
      implements, what it does not, what moved into the neutral core and why, and
      whether the App Graph schema version changed.

## 6. Verify

- [x] 6.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 6.2 Inspect real projects with `navirox inspect -C` and record the output:
      the upstream Svelte and Vue examples both read cleanly, and the Svelte
      reading found a real defect (the unmodelled scan did not strip comments and
      reported two files that only mention the construct in a comment), which was
      fixed in both adapters. No real SvelteKit project exists on this machine and
      none is claimed. Recorded in
      `docs/evidence/svelte-cross-adapter-gate.md`.
- [x] 6.3 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 6.4 Run `openspec validate svelte-source-proof --strict` and confirm the
      change is complete.
