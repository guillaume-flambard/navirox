## Context

See `proposal.md` for the motivation. The state that shapes the approach:

- The web half of a scenario already runs end to end. `runScenario` writes one file per declared capture, the scenario schema already declares device profiles, ordered actions and capture moments, and the comparison is normalized measurement rather than pixel equality.
- `captureNativeDevice` in `packages/visual-benchmark/src/drivers.ts` always throws `CaptureUnavailableError`, so no device capture has ever been produced.
- The device pipeline itself works in this repository: Detox drives `examples/vue-basic` and `examples/vue-pilot` on an Android emulator and an iOS simulator in CI, and `scripts/verify-records-screen.mjs` already packs the workspace, scaffolds an application outside the checkout, compiles the records fixture with the target compiler, refuses to continue when the fresh output differs from the emitted file, installs from the packed tarballs, asserts a single runtime copy and bundles both platforms.
- The scaffolded application template carries no Detox wiring (no config, no test directory, no test dependencies), so a capture driver must add that wiring to the application it prepares.
- The CI workflow uploads no artifacts today, and every Android job downloads the Gradle distribution without a cache.

## Goals / Non-Goals

**Goals:**

- Produce real iOS and Android captures of a declared scenario, driven by the generated screen's own test identifiers, so the native half of the capture requirement is satisfied.
- Make every native capture attributable: the compiler revision, the manifest hash of the captured screen and the device profile it ran on.
- Keep the captures and the run report from a CI run so a capture can be inspected after the fact.
- Leave gate V1 complete in `docs/VISUAL-FIDELITY.md` and record what was measured.

**Non-Goals:**

- No tolerance model, no cross-platform pass and no V2 claim. A web-against-device comparison is recorded as a measurement.
- No animation timing or frame cadence measurement; motion frames are captured as states, exactly as the web runner does.
- No change to the scenario schema, the App Graph or the inspection report.
- No hand-written native screen and no second hand-maintained host application.
- No new device matrix: one declared simulator and one declared emulator, named by the environment.

## Decisions

**1. Detox drives the capture, from the application the compiler produced.** The generated screen already carries `testID` attributes (the compiler renames `data-testid` to the native prop), the scenario already declares actions by identifier, and Detox already runs on both platforms in this repository. Alternatives rejected: raw `adb shell input tap` coordinates (no identifier semantics, iOS `simctl` offers no input at all, and the earlier header-tap investigation showed how brittle coordinates are); Appium (a second, heavier driver for a capability Detox already provides); a custom native screenshot module (native code in a verification package, and it would still need a driver for the actions).

**2. The capture reuses the fixture application helper instead of duplicating it.** `scripts/verify-records-screen.mjs` already establishes the guarantees a capture depends on: packed workspace artifacts, a scaffolded application outside the checkout, fresh compiler output that must equal the emitted screen file, a single runtime copy, and lint. Those helpers move into a module that both scripts import, so a capture can never run against an application the verified path would have refused. Alternative rejected: a capture-only preparation path (two truths about what a valid fixture application is).

**3. The capture test reads the scenario from the environment.** The prepared application receives the scenario file path, the artifact directory and the platform, drives the actions declared for each capture and writes one screenshot per capture. The scenario stays the single source of truth for actions and moments, and the semantics match the web driver, which also executes the declared actions before capturing. Alternatives rejected: one test per scenario (the harness would have to be regenerated per scenario), a generated Detox configuration per run (more moving parts for no gain).

**4. The run report carries the device profile and the manifest hash.** A capture without the device it ran on and the compiler revision that produced the screen is not evidence, which is what the new requirements ask for. This is the benchmark package's own artifact type, not a shared contract. Alternative rejected: a separate sidecar file per capture (a second place to look, and it would not fail when absent).

**5. A cross-platform comparison stays a measurement.** With no cross-platform tolerance declared, the comparison verdict remains undeclared and the run reports it as a measured difference. `docs/VISUAL-FIDELITY.md` rejects pixel equality between a browser and a device as an oracle, and the tolerance model that V2 needs is deliberately a later change. Alternative rejected: declaring a tolerance now to make the comparison pass (that would be a parity claim without a basis).

**6. The capture runs in its own CI job per platform.** The job prepares the fixture application, builds and installs it, runs the capture and uploads the artifact directory and the run report. The Android job follows the existing journey job's emulator setup, including the stay-awake and animation-scale steps and the teardown trap. Alternative rejected: extending the existing scaffold jobs, which verify the scaffolding contract rather than the benchmark fixture and would blur two contracts; also rejected: running the capture inside the fast verify job, where a device build would slow the gate that must stay quick.

## Contract change questions

No shared contract changes. The scenario schema already declares device profiles, actions and capture moments; the device profile and the manifest hash land in the benchmark package's own run report; the App Graph, the inspection report and every neutral contract are untouched. The existing scenario and run types are sufficient because the missing piece is a driver, not a model.

## Risks / Trade-offs

- [A device build costs 15 to 30 minutes per platform] -> the capture lives in its own job, so a capture failure never blocks the fast gate.
- [Gradle downloads are uncached and `services.gradle.org` returned a transient HTTP 504 twice, killing both Android jobs in one run] -> the Android capture job caches the Gradle distribution and its own failure prints the emulator log, as the journey job already does.
- [A device screenshot contains platform chrome such as the status bar or a display cutout] -> the capture is stored raw and any mask is declared in the scenario and applied at comparison time, never baked into the file.
- [Native font rasterisation and safe areas differ from the browser] -> the comparison is reported as a measurement and never as a pass.
- [A slow or flaky device can make a capture disappear] -> a missing capture fails the scenario loudly, exactly as the web path already does, rather than producing a partial run that looks complete.
- [The local machine cannot reliably host the Android emulator] -> the iOS capture is verified locally and both platforms are verified by the CI job, which is the reproducible path.

## Migration Plan

No migration. The driver replaces a placeholder that always reported the native captures unavailable, so a scenario that previously recorded two absences now records captures when a device is reachable and keeps recording the absence with a reason when it is not.
