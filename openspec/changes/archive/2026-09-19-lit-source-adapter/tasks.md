## 1. Add the Lit adapter

- [x] 1.1 Create `packages/source-lit` with a package manifest that depends on `@memolabs-apps/graph`, `@memolabs-apps/source` and `@memolabs-apps/source-react` in `workspace:*`, a `tsconfig.json` referencing the three, and the repository conventions (version `0.1.0`, `type: module`, build and typecheck by `tsc --build`, tests by `vitest run`). Verify with `corepack pnpm install` then `corepack pnpm --filter @memolabs-apps/source-lit build`, which must finish with no output.
- [x] 1.2 Write `src/detect.ts` with `FRAMEWORK = 'lit'`, `ADAPTER_ID = 'lit'`, `DISPLAY_NAME = 'Lit'` and `TESTED_VERSIONS = ['^3.0.0']`, detection from the manifest through `readManifest` and `declaredRange`, and the native refusal imported from `@memolabs-apps/source-react`. Verify on three fixtures: a Lit project yields one `high` candidate whose evidence names the manifest and the range, a project that declares only `vue` yields no candidate, and a project that declares `react-native` yields no candidate.
- [x] 1.3 Write `src/components.ts`: a component is a class extending `LitElement` or `ReactiveElement`, and the declaration records the registration form (decorator or `customElements.define`), whether a reactive property is declared, and the tag name when it could be read. Verify by asserting one detection per documented form and none for a plain class.
- [x] 1.4 Write `src/routes.ts`: read the `path` strings of `Routes` and `Router` configurations, convert `:name` segments to parameters, keep a trailing wildcard as the fact that a parent mounts a child, and emit a finding for a `URLPattern` route and for an `enter` callback instead of guessing. Verify by asserting the exact route set of the fixture, and by asserting that a URLPattern route contributes no path pattern but one finding.
- [x] 1.5 Write `src/inspect.ts`: units for elements and application modules, the declaration flags in metadata, capabilities from the shared scanner, dependencies from `productionDependencies`, and the version finding. Verify by asserting that no unit of kind `state-module` is ever produced for the fixture.
- [x] 1.6 Write `src/graph.ts` and `src/index.ts` with `createLitAdapter`, and build the fragment through the neutral mapper. Verify with two equal inspections and `verifyAdapterContract` returning no violation on both fixtures.

## 2. Add the fixtures

- [x] 2.1 Add `fixtures/lit-app`, a mirror of the shared journey, with `lit ^3.3.3`, a class per documented registration form, two reactive property declarations, a route configuration with a parameter and a trailing wildcard, a `URLPattern` route and an `enter` callback, `fetch`, a bare storage export, and a geolocation call. Verify that its capability multiset equals the Vue fixture's.
- [x] 2.2 Add `fixtures/lit-bad`, on an untested major, which must produce the version finding and no claim of support.

## 3. Extend the gate

- [x] 3.1 Register the adapter in `SOURCE_ADAPTER_PACKAGES` and add `@memolabs-apps/source-lit` to the CLI dependencies, which brings the registry to eleven. Verify that `corepack pnpm --filter @memolabs-apps/cli test` passes and that both listing assertions name the eleven adapters in alphabetical order, with `lit` between `astro` and `next`.
- [x] 3.2 Add a Lit block to `adapters.test.ts` that compares its report to the Vue one: the same capabilities, the kinds equal to the Vue kinds minus `state-module`, the version at 1, and the routes the fixture declares. Verify by breaking one capability in the fixture, seeing the comparison fail, and restoring it.

## 4. Position and record

- [x] 4.1 Add `./packages/source-lit` to the root `tsconfig.json` references and keep the lockfile current. Verify by building at the root.
- [x] 4.2 Update `README.md`: the adapter count in the prose, a row in the support matrix, a row in the package table. Verify that `prettier --check` stays green.
- [x] 4.3 Write `docs/evidence/lit-reading.md` with the measured reading, the two decisions that differ from the other adapters (no store module and no framework router), the word trap of the shared scanner, and what was deliberately not read.

## 5. Verify and close

- [x] 5.1 Run the full root gate (`corepack pnpm build`, `typecheck`, `test`, `lint`, `format:check`, `deps:check`) and record each result.
- [x] 5.2 Run the acceptance journey on both platforms, 4 out of 4 on each, after killing any leftover Metro process. The canary must be untouched.
- [x] 5.3 Run `openspec validate lit-source-adapter --strict`, check every box in this file, archive the change, and commit locally. Do not push unless asked.
