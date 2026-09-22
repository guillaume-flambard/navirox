# Design

## Context

The device capture path already works end to end for the records fixture. `packages/visual-benchmark/scripts/capture-records-native.mjs` prepares a fixture application, installs the Detox harness, starts and warms the packager once, drives each declared capture's actions through `captureNativeDevice`, writes `<key>.<platform>.png` beside the web capture, evaluates the declared tolerance and writes an evidence report. The record fixture's generation is permanent evidence and must not move.

Three facts shape this change.

First, the capture script is written around the records fixture: it scaffolds `RECORDS_FIXTURE.appName`, passes `RECORDS_FIXTURE` to `installGeneratedScreen`, hardcodes `ROOT_TEST_ID = 'records-screen'`, declares its two scenarios inline and polls `/records` while waiting for the harness. A second companion cannot be captured without generalising those points.

Second, the compiled field-workflow screen imports `./fieldLogic` and `./fieldRecords`, because the target compiler emits the SFC script block verbatim, and `installGeneratedScreen` writes the compiled code to `<app>/App.vue`. The prepared application must therefore also contain `fieldLogic.ts` and `fieldRecords.ts` beside `App.vue`, or Metro cannot resolve the imports and the bundle fails. The companion assembly already solved this by copying the planner-approved shared units with `copyFixtureUnit`; the capture path needs the same step.

Third, the declared acceptance scenario already exists as data at `packages/visual-benchmark/src/scenarios/field-workflow.ts` (name `field-workflow`, route `/field-work`, five declared moments, four declared identifiers and a declared tolerance), the vite harness already maps `/field-work` to the fixture screen, and `scripts/lib/fixture-app.mjs` already carries `FIELD_WORKFLOW_FIXTURE`. The missing piece is the capture path, not a new scenario.

## Goals / Non-Goals

- Goals
  - Generalise the device capture path so a declared scenario is the only place its fixture, route, root identifier, identifiers and tolerance live.
  - Prepare a companion that can actually run, including the moved shared units the generated screen imports.
  - Capture the field-workflow scenario on iOS and Android from the compiled companion and keep every artifact with its provenance.
  - Fail a run whose declared capture is absent, naming the capture and the cause.
  - Keep the records capture evidence unchanged and re-run it as a regression.
- Non-Goals
  - No cross-platform tolerance model and no visual-fidelity pass; the comparison stays a measurement and V2 is not advanced beyond the records fixture.
  - No change to the scenario schema, the App Graph, the inspection report, the source adapter contract or either target schema version.
  - No Android capture on this machine: the local emulator is unusable, so Android evidence belongs to continuous integration.
  - No new scenario: the declared acceptance scenario is consumed as data.

## Decisions

### The capture path takes a fixture record instead of the records constants

The script's fixture, application name, root test identifier, route, identifiers and tolerance move into a small record per scenario, defaulting to the records values so the existing evidence reproduces exactly.

Rejected: a second capture script for the field-workflow fixture. Two scripts would drift, and the second could silently skip a step the first performs (the packager warm-up, the tolerance evaluation, the fail-on-absent rule).

### The prepared companion receives the moved shared units

Before the harness is installed, the capture path copies every unit the planner classified `shared` beside `App.vue`, exactly as the assembly script does.

Rejected: relying on the workspace fixture directory being reachable from the prepared application. The application is scaffolded outside the checkout and installed from packed tarballs, so a relative path into the repository would not exist. Rejected: importing the units through the packed workspace. The units are not a package.

### The scenario data drives the capture, and the harness reads one root identifier per run

The script reads the declared scenario from the built package and passes its route, identifiers and root identifier into the driver, so a scenario change is the only place a workflow's shape changes.

Rejected: one script per scenario, which would multiply the records-specific code. Rejected: generating a Detox configuration per scenario, which would create a second format for the same information.

### Provenance is written beside the capture, and one report distinguishes behaviour from measurement

The evidence report keeps, per capture, the platform, the device, the operating system when known, the source revision, the compiler version, the generated screen manifest hash and the artifact path, and it states the behavioural result (the actions ran, every capture exists, the identifiers were asserted) as a separate finding from the measured comparison.

Rejected: a sidecar file per capture, which is a second place to look and does not fail when absent. Rejected: folding the behavioural result into the comparison, which would let a passing measurement hide an absent capture.

### An unavailable capture fails the run

A declared capture that is not produced is an error with its cause, not a warning.

Rejected: a partial run that reports the captures it managed, which would look complete while a platform is missing.

### Android evidence comes from continuous integration

The Android capture is produced by the continuous integration job that already owns the emulator; the local machine cannot host it (the emulator wedged repeatedly and the Pixel 7 profile needs disk the machine does not have).

Rejected: attempting the Android capture locally and recording a degraded result, which would be an unreliable capture presented as evidence.

## Contract change questions

- Why the current arrangement is insufficient: the capture path hardcodes the records fixture, so no other companion can be captured at all.
- Which real consumer demonstrated the need: the Vue proof journey's contracted workflow, whose companion is assembled and bundled but never driven on a device.
- Why adapter-owned metadata is not enough: the missing piece is a driver that consumes a scenario and a fixture record, not a record about a source adapter or the App Graph.
- Whether the schema version changes: no. The scenario schema already declares routes, actions, moments, identifiers and tolerances; the run report is the benchmark package's own artifact. The App Graph, the inspection report, the source adapter contract and both target schema versions stay at 1.

## Risks / Trade-offs

- Refactoring the capture script could move the records evidence. The records capture command is re-run as a regression and its numbers are compared with the committed report.
- A scenario-specific root identifier could be wrong and the device run would fail to settle. The identifier is declared in the scenario and the failure names it.
- The Android emulator is slow and occasionally flakes. The capture job keeps its own emulator setup and its teardown trap, and an absent capture fails loudly rather than quietly.
- A behavioural pass near a sizeable measured difference could be read as fidelity. The report states the behavioural result and the measurement as separate findings and makes no fidelity claim.

## Migration Plan

None. The records capture keeps its defaults, so its existing command produces the same evidence, and the field-workflow capture is a new run over an already-assembled companion.
