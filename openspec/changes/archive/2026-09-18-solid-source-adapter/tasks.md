## 1. Add the Solid adapter

- [x] 1.1 Create `packages/source-solid` (`@memolabs-apps/source-solid`, version `0.1.0`,
      dependencies `@memolabs-apps/graph`, `@memolabs-apps/source` and `@memolabs-apps/source-react` as
      `workspace:*`, the repository package conventions, and a `tsconfig.json` referencing
      those three). Verify with `corepack pnpm install` and
      `corepack pnpm --filter @memolabs-apps/source-solid build`.
- [x] 1.2 Write detection: one high confidence candidate when the manifest declares
      `solid-js`, evidence naming the manifest field, and no candidate when the manifest
      declares a native runtime or no Solid at all. Verify against three fixtures: a Solid
      project, a Vue project, and a project declaring `@symbiote-native/vue`.
- [x] 1.3 Read a component by what a module exports, reusing the React reader's rule (a
      function returning elements, read on source with the comments stripped). Verify that a
      module exporting such a function is a `component` unit and a module exporting none is
      not.
- [x] 1.4 Read a store as a `state-module` when the module takes `createStore` or
      `createMutable` from `solid-js/store`, and only then. Verify with a fixture that
      declares each and a module that imports the package without declaring anything.
- [x] 1.5 Read routes from the literal `path` values of both documented shapes, the JSX
      `Route` element and the object array passed to `defineRoutes` or `createRouter`,
      turning a parameter segment into a parameter and a wildcard segment into the route it
      matches. Verify with a route file that uses both shapes and asserts the exact route set.
- [x] 1.6 Report what could not be resolved: nested routes, a lazily loaded route, and a
      non-literal path, each as a finding naming the file, with no invented route. Verify by
      asserting the finding codes and that no route exists for any of them.
- [x] 1.7 Build the fragment through the neutral mapper and add the version finding for an
      untested major. Verify with two identical inspections and
      `verifyAdapterContract` returning no violations on both fixtures.

## 2. Add the fixtures

- [x] 2.1 `fixtures/solid-app` mirrors the shared journey: a list, a detail, a store, a
      storage helper, a geolocation call, an API client and a validated input, with
      `solid-js ^1.9.0` and `@solidjs/router ^1.0.0` declared. Verify that the capability
      multiset equals the one the Vue fixture produces.
- [x] 2.2 `fixtures/solid-bad` declares an untested major (or a native runtime, for the
      refusal half) with the smallest tree that exercises it. Verify the expected finding and
      the expected absence of a candidate.

## 3. Extend the gate

- [x] 3.1 Register the adapter in `SOURCE_ADAPTER_PACKAGES` in `packages/cli/src/cli.ts` and
      add `@memolabs-apps/source-solid` as `workspace:*` to `packages/cli/package.json`. Verify the
      registry lists nine adapters in alphabetical order, with `solid` between `sveltekit`
      and `vue`.
- [x] 3.2 Add a Solid block to `packages/cli/src/adapters.test.ts` comparing the Solid report
      to the Vue report: the same capability set, the same unit kinds, and
      `schemaVersion` still `1`. Verify by breaking a capability in the fixture, watching the
      assertion fail, and restoring it.

## 4. Position and record

- [x] 4.1 Add `./packages/source-solid` to the root `tsconfig.json` references and confirm
      the lockfile is current. Verify with `corepack pnpm build`.
- [x] 4.2 Update `README.md`: the adapter count in the source support prose, the support
      matrix row, and the package table row. Verify that no row claims more than detection
      and inspection.
- [x] 4.3 Write `docs/evidence/solid-reading.md`: what the reader establishes, why the store
      reading needed no new concept, why the wildcard segment is not carried through, and
      what the adapter deliberately does not do.

## 5. Verify and close

- [x] 5.1 Run the full gate at the root: `corepack pnpm build`, `typecheck`, `test`, `lint`,
      `format:check`, `deps:check`. Verify all six exit 0.
- [x] 5.2 Run the acceptance journey on both platforms as a regression check, killing any
      leftover Metro first. Verify four of four on Android and on iOS.
- [x] 5.3 Run `openspec validate solid-source-adapter --strict`, check every box here,
      archive the change, and make a local commit. Verify the canonical specs count went from
      21 to 22 and that nothing was pushed.
