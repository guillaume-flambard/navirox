## Why

The visual benchmark can capture the web side of a scenario and compare captures, but it cannot capture a device: `captureNativeDevice` in `@memolabs-apps/visual-benchmark` always reports the iOS and Android captures unavailable, so the native half of the capture requirement is unimplemented and no gate above V1 can advance. The device pipeline now works in this repository (Detox drives both platforms in CI after the stream-json repair, and the generated records screen is installed and bundled by `scripts/verify-records-screen.mjs`), so the missing piece is the driver, not the infrastructure.

## What Changes

- `@memolabs-apps/visual-benchmark` gains a real native capture driver: it prepares a fixture application from the target compiler output, writes the Detox harness into it, builds and installs it on a simulator or an emulator, drives each declared capture action on the generated test identifiers, and writes one screenshot per capture and platform.
- The capture run records the device profile it used (platform, device or AVD name, operating system version) and refuses to capture a screen whose fresh compiler output no longer matches the emitted file, so a native capture is attributable to a compiler revision.
- A cross-platform comparison stays a measurement: with no cross-platform tolerance declared, the comparison is recorded as an undeclared difference rather than a pass, and this change claims no visual parity. Gate V2 stays not started.
- A CI job runs the native capture for iOS and Android and keeps the captures and the run report as build artifacts.
- `docs/VISUAL-FIDELITY.md` and an evidence report record what the driver measured and what it could not do.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-benchmark`: "Web and native captures are complete" now requires the iOS and Android captures to come from a device driver that builds, installs and launches the application, and the capability gains requirements for device attribution and for capturing only the target compiler output.

## Impact

- Layer: verification and product orchestration, per `docs/repositioning/AGENT-GUIDE.md` section 4. The change stays inside the benchmark package and the CI workflow; it adds no framework or provider knowledge to a neutral package, and it consumes the target compiler output as a file and a manifest.
- `packages/visual-benchmark`: the native driver, the device harness templates, the run report and their tests.
- `scripts/`: the fixture application helpers are shared with `verify-records-screen.mjs` instead of duplicated.
- `.github/workflows/ci.yml`: a native capture job per platform with an artifact upload step.
- `docs/evidence/` gains a capture report, and `docs/VISUAL-FIDELITY.md` records the new state of V1.
- No shared contract changes: the scenario schema, the App Graph and the inspection report are untouched, and the run report is this package's own artifact.
