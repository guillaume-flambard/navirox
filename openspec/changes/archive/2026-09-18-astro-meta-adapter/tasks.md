## 1. Add the Astro adapter

- [x] 1.1 Create `packages/source-astro` as `@navirox/source-astro`, version
  `0.0.0`, depending on `@navirox/graph`, `@navirox/source`,
  `@navirox/source-vue`, `@navirox/source-react` and `@navirox/source-svelte`,
  all as `workspace:*`, with the package conventions of the repository and a
  `tsconfig.json` referencing those five packages. Verify with
  `corepack pnpm install` then `corepack pnpm --filter @navirox/source-astro build`.
- [x] 1.2 Write the detection: one candidate at high confidence when the
  manifest declares `astro`, with evidence naming the manifest and the range, no
  candidate when it does not, and no candidate when the manifest declares a
  native dependency. Verify with a test over three fixtures: an Astro project, a
  Vue only project, and a project declaring `@symbiote-native/vue`.
- [x] 1.3 Read routes from `src/pages`: `.astro`, `.md` and `.mdx` files, index
  naming its directory, nested directories as segments, `[param]` as a
  parameter, `[...rest]` as a parameter, several parameters in one segment, and
  no route for a path segment prefixed with an underscore. Verify with a test
  asserting the exact route set and parameter list of the fixture.
- [x] 1.4 Report the server surface rather than reading it: an endpoint in
  `src/pages` gets a finding and no route and no unit, `src/middleware.ts` gets a
  finding, `astro.config.mjs` gets a finding. Verify with a test asserting the
  three findings and the absence of units and routes for those files.
- [x] 1.5 Read islands: parse the hydration directives of a file, record each
  island on the unit of that file with the component name and the directive
  (verified by a test on a page carrying two directives), and report a finding
  when the directive names a component that resolves to nothing in the project or
  to a project `.astro` file.
- [x] 1.6 Delegate the island components: hand the composed adapters a context
  whose file list is narrowed to their own framework, and merge their units,
  capabilities, dependencies and routes, keeping their findings. Verify with a
  test that a `.vue` island appears as a unit whose id begins with `astro:` and
  whose source names the Astro adapter, and that a finding produced by the Vue
  adapter still carries the Vue adapter id.
- [x] 1.7 Build the fragment through the neutral mapper so every id is prefixed
  with `astro:` and the reading is deterministic. Verify with a test that two
  inspections of the same fixture are equal and that
  `verifyAdapterContract` reports no violation on both fixtures.

## 2. Extend the gate

- [x] 2.1 Register the adapter in `SOURCE_ADAPTER_PACKAGES` and add
  `@navirox/source-astro` to the dependencies of `packages/cli`, then extend the
  composition root assertion to the eight adapters in alphabetical order.
  Verify with `corepack pnpm --filter @navirox/cli test`.
- [x] 2.2 Add a gate test proving selection prefers Astro over Vue for a project
  that declares both, on the model of the SvelteKit selection test. Verify that
  the test fails if the ASTRO adapter drops `composes`.
- [x] 2.3 Add a gate test comparing the Astro report to the Vue report on the
  mirrored fixture: the same capabilities, the same unit kinds with no addition
  (where Next added `layout`, Astro adds nothing), and `schemaVersion` at 1.
  Verify that the comparison can fail by breaking a capability in the fixture and
  restoring it.

## 3. Position and record

- [x] 3.1 Add `./packages/source-astro` to the references of the root
  `tsconfig.json` and check the lockfile is current after `corepack pnpm install`.
- [x] 3.2 Update `README.md`: a row for `@navirox/source-astro` in the package
  table, the adapter count in the source support prose, and an Astro row in the
  support matrix that claims detection and inspection only, at Experimental.
- [x] 3.3 Write `docs/evidence/astro-gate-reading.md` recording the measured
  answers: what the gate said about composition of several adapters, why the
  Astro unit kinds are equal to the Vue kinds where Next added a layout, why the
  islands are adapter metadata, and the attribution asymmetry between nodes and
  findings.

## 4. Verify

- [x] 4.1 Run the full gate: `corepack pnpm build`, `typecheck`, `test`, `lint`,
  `format:check`, `deps:check`. All green, with no change under `examples/`.
- [x] 4.2 Run the acceptance journey on both platforms: kill any leftover Metro
  first, then Detox on the Android emulator and on the iOS simulator, four of
  four on each.
- [x] 4.3 `openspec validate astro-meta-adapter --strict`, then archive the
  change, then commit and push, then read the CI run on `main` and confirm all
  five jobs are green.
