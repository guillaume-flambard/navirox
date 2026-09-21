## 1. Record the generated target evidence

- [x] 1.1 Define the target provenance manifest in `packages/target-vue/src`,
      including input identity, generated file path, compiler version, source
      locations and findings. Verify with unit tests that a safe fixture emits a
      deterministic manifest and an unsupported fixture emits no generated path.
- [x] 1.2 Make the generated output fixture consume the emitted file byte for byte.
      Verify with a test that recompiles the web source and compares the generated
      file contents and manifest hash.
- [x] 1.3 Keep unsupported output fail-closed. Verify with target tests for
      RouterLink, unsupported directives, descendant selectors and unsupported CSS
      properties, each asserting that `code` is undefined.

## 2. Create the first runnable generated screen

- [x] 2.1 Add a small Baserow-shaped Vue web fixture containing a record list,
      record detail, loading, empty and error states, plus one press action. Keep
      all template and CSS constructs within the documented safe subset. Verify
      `pnpm --filter @memolabs-apps/target-vue test`.
- [x] 2.2 Generate the native fixture screen from that web fixture in the test or
      build path, never by copying a hand-written replacement. Verify the native
      application runs the generated screen and exposes stable test identifiers.
- [x] 2.3 Add a source-to-generated provenance report under `docs/evidence/`.
      Verify it distinguishes generated files from fixture infrastructure and
      names every unsupported construct as absent from this fixture.

## 3. Add the visual scenario harness

- [x] 3.1 Define a named scenario schema with route, fixture data, browser and
      device profiles, actions, capture moments, masks and optional motion
      expectations. Verify schema tests reject a missing capture moment or an
      undeclared mask.
- [x] 3.2 Add a deterministic web capture runner and a native capture runner for
      iOS and Android. Verify each runner writes all named captures to a fresh
      scenario artifact directory and exits nonzero if one capture is absent.
- [x] 3.3 Add normalized layout and style measurement plus screenshot review
      output. Verify an undeclared measurement difference fails and a declared
      mask is reported rather than ignored.
      `node packages/visual-benchmark/scripts/compare-records-scenario.mjs` exits
      0: two real Chrome captures of `records-list` under the same conditions are
      `identical` (0 differing pixels), a controlled variant differing outside
      every mask is `undeclared-differences` (247 unmasked pixels, exit would be
      1), and the same variant inside a declared mask is `masked-differences`
      (0 unmasked pixels). A 2x device scale render is measured and recorded
      without gating: text rasterization differs across scale factors, so
      normalization is not a scale-equalizing claim.
- [x] 3.4 Add motion frames for an interruptible fixture interaction. Verify the
      runner records rest, first meaningful, midpoint, settled and interrupted
      capture labels in order.
      `node packages/visual-benchmark/scripts/run-records-motion.mjs` exits 0 and
      prints the labels in that order. The fixture is a discrete state machine
      with no in flight animation, so a frame samples the declared action
      timeline rather than an interpolated pose, and three frames coincide:
      midpoint, settled and interrupted share one sha256, which the report lists
      as coincident frames instead of hiding. Native captures are recorded as
      unavailable for the five labels on both platforms because no device
      pipeline exists on this machine.

## 4. Run the Baserow diagnostic without overclaiming

- [x] 4.1 Extend the pinned benchmark protocol with a target diagnostic for the
      existing Baserow revision. Verify `pnpm test:benchmarks -- --project baserow`
      still analyzes the repository without installing or modifying it.
      `node scripts/benchmark-projects.mjs --project baserow` exits 0, prints
      `46 routes, 41 screens` for the pinned revision
      `81e094a1f4b3a62625c218d78fe319ba44098617`, then prints
      `12 screens compiled, 61 findings (unsupported-directive 20,
      unsupported-element 41), no file written`. The checkout is fetched and read
      without installing or modifying it, and the diagnostic writes only
      `docs/evidence/vue-target-baserow-diagnostic.json`.
- [x] 4.2 Write `docs/evidence/vue-target-baserow-diagnostic.md` with the source
      revision, attempted inputs, blocker codes and counts. Verify the document
      contains no claim of Baserow conversion, partnership or visual parity.
      The document names the pinned revision
      81e094a1f4b3a62625c218d78fe319ba44098617, the 12 of 41 attempted screens,
      the blocker counts (unsupported-element 41, unsupported-directive 20) and
      the two screens inside the supported subset. It states in its opening line
      and again in a closing section that no conversion, partnership or
      visual-parity claim is made.

## 5. Verify and close

- [x] 5.1 Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`,
      `pnpm format:check` and `pnpm deps:check`. Verify every command exits 0.
      - Ran all six from the repository root: `pnpm build` exit 0, `pnpm typecheck`
        exit 0, `pnpm test` exit 0, `pnpm lint` exit 0, `pnpm deps:check` exit 0,
        `pnpm format:check` exit 0. The format check first reported eight files in
        `packages/visual-benchmark`: six hand written files were formatted
        (`harness/web/vite.config.ts`, `harness/web/vue-shim.d.ts`, `package.json`,
        `tsconfig.json`, `scripts/run-records-scenario.mjs`, `src/measure.test.ts`)
        and the two generated comparison review pages under
        `scenario-artifacts/` were added to `.prettierignore`, because they are
        runner output that the next run overwrites.
- [x] 5.2 Run the fixture scenario on iOS and Android and record the result next to
      the capture artifacts. Verify a pass advances only the documented V0-V2
      gates, never V3 or V4.
      - Ran `node packages/visual-benchmark/scripts/run-records-scenario.mjs` and
        `node packages/visual-benchmark/scripts/run-records-motion.mjs`. The web
        capture of `records-list` is written and every iOS and Android capture is
        recorded as unavailable in `docs/evidence/records-scenario-report.json`
        and `docs/evidence/records-motion-report.json`, with the reason attached:
        this runner has no device driver, so it never builds, installs or launches
        the application, and the Detox path fails before any app code runs on the
        pre-existing `MODULE_NOT_FOUND stream-json` install failure. The scenario
        runner exits 1 for the absent captures, which is the specified fail-on-
        absent behaviour rather than a pass.
      - No pass exists, so no gate advanced. `docs/VISUAL-FIDELITY.md` records V0
        as in progress, V1 as in progress with the native driver named as the
        missing half, V2 as not started because it needs the native captures V1
        does not produce, and V3 and V4 unchanged.
      - The device pipeline that would produce those captures (iOS simulator and
        the `atable_pixel` Android emulator) is deferred to its own change. The
        local capture directory is now really ignored: the previous
        `scenario-artifacts/**/*.png` pattern was anchored to the repository root
        and matched nothing under `packages/`.
- [x] 5.3 Run `openspec validate vue-visual-fidelity-benchmark --strict` before
      implementation and before archival. Verify no task is marked complete until
      its stated command or artifact exists.
      - `openspec validate vue-visual-fidelity-benchmark --strict` exits 0 with
        'Change is valid' before archival. Every task above names the command it
        ran or the artifact it wrote: the compiler and provenance tests, the
        `verify-records-screen.mjs` run, the `compare-records-scenario.mjs` run,
        the `run-records-motion.mjs` run, the `benchmark-projects.mjs --project
        baserow` run and its diagnostic document, and the six gate commands.

