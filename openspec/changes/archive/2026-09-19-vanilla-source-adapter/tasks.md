## 1. Add the Vanilla adapter

- [x] 1.1 Create `packages/source-vanilla` with `@navirox/graph`, `@navirox/source` and
      `@navirox/source-react` as workspace dependencies, its tsconfig referencing the
      three, and the package conventions every adapter follows. Verify by
      `corepack pnpm install` and `corepack pnpm --filter @navirox/source-vanilla build`.
- [x] 1.2 Write `src/detect.ts` with `FRAMEWORK = 'html'`, `ADAPTER_ID = 'vanilla'`,
      `DISPLAY_NAME = 'Vanilla HTML/CSS/JS'`, the living-standard version range, the
      framework list imported from the neutral package, the inherited native refusal and
      the requirement for a document. Verify on three fixtures: a document project, a
      project declaring a framework, and a project with no document.
- [x] 1.3 Write `src/documents.ts`: read an HTML document as a route at the address it is
      served from, `index.html` naming its directory, the module its script names, and an
      inline script block. Verify by asserting the exact route set of the fixture, the
      `loadedBy` metadata of its entry module, and the inline finding.
- [x] 1.4 Write `src/inspect.ts`: application modules as `utility` units, capabilities
      from the shared scanner, runtime routing calls as findings, dependencies from the
      manifest, and no unit of kind `component`, `layout` or `state-module`. Verify by
      asserting the kinds and the capability multiset, including `dom:unknown`.
- [x] 1.5 Write `src/graph.ts` and `src/index.ts` with `createVanillaAdapter()`. Verify by
      two identical inspections and by `verifyAdapterContract` returning no violation on
      both fixtures.

## 2. Add the fixtures

- [x] 2.1 Write `fixtures/vanilla-app` as the mirror of the shared journey: a manifest
      declaring only a build tool, documents for a list and a detail page, an inline
      script, modules for storage, a network call and geolocation, and a module that
      routes at runtime. Verify that its capability multiset equals the Vue fixture's.
- [x] 2.2 Write `fixtures/vanilla-bad` as a library: a manifest with no framework and no
      document at all. Verify that the adapter returns no candidate for it.

## 3. Extend the gate

- [x] 3.1 Register the adapter in `SOURCE_ADAPTER_PACKAGES` and add
      `@navirox/source-vanilla` to the CLI dependencies, then extend the composition-root
      assertion to twelve adapters in alphabetical order with `vanilla` last. Verify by
      `corepack pnpm --filter @navirox/cli test`.
- [x] 3.2 Add a block comparing the vanilla report to the Vue report: the Vue capability
      multiset plus `dom:unknown`, kinds equal to the Vue kinds minus `component` and
      `state-module`, schema version 1, the exact routes, and the two findings. Verify by
      breaking one capability and restoring it.
- [x] 3.3 Add a test that the project with no document is claimed by nobody. Verify by
      asserting the adapter's own detection returns no candidate.

## 4. Position and record

- [x] 4.1 Add the package reference to the root `tsconfig.json`. Verify by
      `corepack pnpm typecheck`.
- [x] 4.2 Update `README.md`: the adapter count in the prose, a matrix line, and a package
      table line. Verify by reading the three lines.
- [x] 4.3 Write `docs/evidence/vanilla-reading.md`. Verify by reading it and by
      `corepack pnpm format:check`.

## 5. Verify and close

- [x] 5.1 Run the full root gate: `build`, `typecheck`, `test`, `lint`, `format:check`,
      `deps:check`. Record the task counts.
- [x] 5.2 Run the acceptance journey 4/4 on Android and on iOS against the untouched
      canary. Verify by the two test summaries.
- [x] 5.3 Run `openspec validate vanilla-source-adapter --strict`, check every box here,
      archive the change, and commit locally without pushing. Verify that the canonical
      spec count grows by one and that the archive count grows by one.
