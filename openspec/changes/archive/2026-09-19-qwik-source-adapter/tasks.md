## 1. Add the Qwik adapter

- [x] 1.1 Create `packages/source-qwik` as `@memolabs-apps/source-qwik` with dependencies on `@memolabs-apps/graph`, `@memolabs-apps/source` and `@memolabs-apps/source-react`, a `tsconfig.json` referencing the three, and the usual package scripts. Verify with `corepack pnpm install` and `corepack pnpm --filter @memolabs-apps/source-qwik build`.
- [x] 1.2 Write `src/detect.ts` with `FRAMEWORK = '@builder.io/qwik'`, `ADAPTER_ID = 'qwik'`, `DISPLAY_NAME = 'Qwik'`, `TESTED_VERSIONS = ['^1.20.0']`, and the native refusal imported from the React adapter. Verify on three fixtures: a Qwik project, a project without Qwik, and a project declaring `@symbiote-native/vue`.
- [x] 1.3 Write `src/components.ts` and `src/inspect.ts` so a module declaring `component$` is a unit of kind `component` carrying its store and signal usage as metadata, and so no unit of kind `state-module` is produced. Verify by inspecting the fixture and finding one component unit per component file with no `state-module` among the kinds.
- [x] 1.4 Write `src/routes.ts` reading `src/routes` with the documented conventions: directory segments, `(name)` pathless, trailing `index`, `[param]`, `[...catchall]`, an `@name` suffix that is not part of the path, and Markdown pages as routes without units. Verify with a test asserting the exact route set and the parameters of the parameterised ones.
- [x] 1.5 Report the unmodelled surface: `index.ts` endpoints, `404.tsx`, `plugin.ts` and `plugin@name.ts`, any other file under `src/routes` that is none of those, and a `rewriteRoutes` declaration in the Vite config. Verify with a test asserting one finding per case and no route and no unit for the first four.
- [x] 1.6 Report a layout file under `src/routes` as a unit of kind `layout`. Verify with a test asserting one layout unit per layout file.
- [x] 1.7 Build the fragment with the neutral mapper and report an untested major. Verify with `verifyAdapterContract` returning no violation on both fixtures and with two inspections producing the same fragment.

## 2. Add the fixtures

- [x] 2.1 Create `fixtures/qwik-app` as the mirror of the shared journey: a `package.json` declaring `@builder.io/qwik ^1.20.0` and `@builder.io/qwik-city ^1.20.0`, components under `src/components`, a state file, a layout, and pages under `src/routes` covering a pathless directory, a parameter, a rest segment, a named layout suffix and a Markdown page. Verify that the capability multiset equals the Vue fixture's.
- [x] 2.2 Create `fixtures/qwik-bad` declaring a major outside the tested range. Verify that its inspection reports `version-untested`.

## 3. Extend the gate

- [x] 3.1 Register the adapter in `SOURCE_ADAPTER_PACKAGES` and add `@memolabs-apps/source-qwik` as a workspace dependency of `packages/cli`. Verify that the registry lists ten adapters in alphabetical order with `qwik` between `nuxt` and `react`.
- [x] 3.2 Add a block to `packages/cli/src/adapters.test.ts` comparing the Qwik report to the Vue one: the same capabilities, kinds equal to the Vue kinds with `state-module` removed and `layout` added, and the schema still at version 1. Verify by breaking one capability in the fixture and confirming the test fails, then restoring it.

## 4. Position and record

- [x] 4.1 Add `./packages/source-qwik` to the root `tsconfig.json` references and refresh the lockfile. Verify with `corepack pnpm build`.
- [x] 4.2 Update the README: the adapter count in the prose, a row in the support matrix, and a row in the package table. Verify that the matrix claims detection and inspection only.
- [x] 4.3 Write `docs/evidence/qwik-reading.md` recording what the reading answers, why the state usage is metadata rather than a unit, why the route table is read from the documented conventions, and what was deliberately not done.

## 5. Verify and close

- [x] 5.1 Run the full root gate: `corepack pnpm build`, `typecheck`, `test`, `lint`, `format:check` and `deps:check`. Verify that every command exits zero and record the counters.
- [x] 5.2 Run the acceptance journey 4/4 on Android and 4/4 on iOS, killing any leftover Metro first. Verify that the canary is untouched by checking that no file under `examples/` changed.
- [x] 5.3 Run `openspec validate qwik-source-adapter --strict`, tick these boxes, archive the change, and commit. Verify that the canonical specs go from 22 to 23 and the archived changes from 17 to 18, then report the commit.
