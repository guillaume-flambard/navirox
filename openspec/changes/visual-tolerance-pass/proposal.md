# Visual tolerance pass

## Why

The visual benchmark can capture the records fixture in a browser, on an iOS
simulator and on an Android emulator, and it compares two captures by
normalizing them to a common grid and measuring the difference. That comparison
only ever reports a measurement. A scenario that declares no tolerance can never
pass, so the release gate that asks for one scenario to pass on iOS and Android
cannot advance even though every capture now exists.

The measurement also shows why a raw pixel verdict would be dishonest. The iOS
pair normalizes to the same grid and reports 27782 of 30208 pixels differing.
The Android pair does not even normalize to the same grid, 118x256 against
115x256, because the emulator screen is taller than the browser viewport. Font
rasterization, the device status bar and the fixture's own lack of safe-area
padding differ between a browser and an application. Reporting a pass on those
numbers would be a visual parity claim with no basis.

What is missing is not a smaller difference. It is a declared tolerance: a
scenario says which differences it accepts and which identifiers it requires,
and the comparison returns a verdict against that declaration instead of a bare
measurement.

## What Changes

- A scenario may declare a `tolerance`: the maximum relative difference between
  the two normalized grids and the test identifiers it requires on both
  platforms. A scenario that declares none keeps today's behaviour exactly.
- The comparison gains a verdict. With a declared tolerance a run reports `pass`
  or `fail` and names the check that decided it; without one it keeps reporting
  the measurement and `undeclared-differences` as it does today.
- The declared identifiers are checked where they exist rather than inferred
  from an image: the served web page is inspected for them, and the device
  capture test asserts them in the running application, so a missing identifier
  fails the capture instead of reaching the comparison.
- The pixel ratio stays measured and never gates. A declared tolerance covers
  the capture set, the normalized grid, the required identifiers and the motion
  labels.
- The capture run records the verdict beside its captures, and the evidence
  document plus `docs/VISUAL-FIDELITY.md` record the result. V2 advances only if
  the records scenario passes on both platforms.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-benchmark`: the requirement that differences are declared or fail now
  defines what a declared cross-platform tolerance is, what a run reports
  against it, and that a pixel difference ratio is never the value that passes.

## Impact

The layer is verification, inside `@memolabs-apps/visual-benchmark`, which
already owns the scenario and the run report. No source adapter, no neutral
package and no target provider is touched. The scenario contract gains an
optional tolerance, the comparison gains a verdict, the web driver and the
device harness each gain an identifier check, and the capture script records the
verdict. The App Graph, the inspection report, the source adapter contract and
the target provenance manifest are untouched, and both target schema versions
stay at 1.
