# Visual tolerance pass

## Context

The capture path is complete: `packages/visual-benchmark/scripts/capture-records-native.mjs`
prepares the fixture application from the target compiler output, drives the
declared actions on the device, and writes one web capture and one device
capture per declared moment. `src/measure.ts` decodes those PNGs, normalizes
both to a grid whose longest side is 256, and reports how many pixels differ,
how many of those a declared mask covers, and a verdict of `identical`,
`masked-differences` or `undeclared-differences`.

That verdict is the problem. It has no passing value for a cross-platform pair,
so the release gate that asks for one scenario to pass on iOS and Android cannot
advance. The measured numbers also show that a pixel verdict would be
dishonest: the iOS pair differs on 27782 of 30208 normalized pixels and the
Android pair does not normalize to the same grid at all (115 columns against
118), because the emulator screen is 2.222 times taller than it is wide while
the browser viewport is 2.164.

`docs/VISUAL-FIDELITY.md` already forbids the shortcut: a browser page and a
native application are not pixel-comparable, the comparison must combine
normalized measurement, state assertions and screenshot review with explicitly
declared tolerances, and only the same platform and profile may be compared by
exact pixels.

## Goals / Non-Goals

Goals:

- A scenario declares the cross-platform differences it accepts, and a run
  returns a verdict against that declaration.
- The declared identifiers are checked where they exist on each platform, so a
  screen missing a declared element fails before anything is compared.
- A scenario that declares no tolerance behaves exactly as it does today.
- The records scenario passes on both platforms, and the evidence says exactly
  what passed and what did not.

Non-Goals:

- No per-identifier layout rectangle measurement. Comparing a browser rectangle
  with a native bounds rectangle needs two new measurement paths and belongs to
  its own change.
- No pixel ratio gate, and no visual parity claim of any kind.
- No change to the target compiler, the App Graph, the inspection report or any
  neutral contract.
- No V3 or V4 claim.

## Decisions

### The tolerance is declared, never defaulted

A run with no declared tolerance keeps reporting a measurement. A default
tolerance would let a run pass without anyone having said what it accepted,
which is the failure mode the release gate exists to prevent.

Rejected: a built-in tolerance that applies when the scenario is silent. It
would turn every existing scenario into a passing one overnight.

### The tolerance covers the capture set, the grid, the identifiers and the labels

Four checks, each a fact the pipeline already produces:

1. every declared capture exists for both platforms;
2. the two normalized grids differ by no more than the declared relative
   difference;
3. every declared identifier was found on both platforms;
4. the motion labels are recorded in order when the scenario declares motion.

Rejected: gating on the pixel difference ratio. A ratio near 0.92 is not a
fidelity result, and a ratio threshold loose enough to pass it would pass
anything. Rejected: gating on the difference bounding box, which for the iOS
pair is the whole frame.

### Identifiers are checked at their source, not inferred from an image

The web side is inspected by loading the same served page and reading the DOM,
and the device side is asserted by the capture test in the running application.
Reading identifiers out of a screenshot would need image analysis and would be
wrong exactly when the screen is wrong.

Rejected: inferring identifiers from the captured pixels. Rejected: checking
identifiers only in the comparison stage, which would leave an untrustworthy
capture in the artifact directory and report the problem one step too late.

### A missing identifier fails the capture

The capture test knows which identifiers the scenario requires, because the
driver passes them through the environment like the scenario path and the
capture key. A missing one fails that capture, so the run reports an absent
capture with its reason instead of comparing a screen that is missing an
element.

Rejected: a warning that lets the capture through. The gate is about what a
scenario declares, so an unmet declaration has to be a failure.

### The verdict belongs to the benchmark package

The scenario, the run report and the capture evidence are this package's own
artifacts. No shared contract is involved, so nothing outside
`@memolabs-apps/visual-benchmark` changes.

Rejected: adding a neutral tolerance contract. There is no second consumer and
no adapter metadata question.

### The records scenario declares a five percent grid tolerance

The measured Android difference is 115 columns against 118, which is 2.5
percent, and the iOS pair is exact. A tolerance of five percent covers the
Android aspect ratio with room for a differently shaped device, and it is
recorded beside the verdict so a reader sees what was accepted.

Rejected: a one percent tolerance, which would encode this machine's emulator
skin into the scenario and fail on the next device.

## Risks / Trade-offs

- **A tolerance loose enough to pass anything.** It is a declared number in the
  scenario, reported beside the verdict, and the pixel ratio and the grid sizes
  stay in the evidence, so a reader can see how much slack a pass used.
- **The web identifier probe costs another browser run.** It is headless and
  bounded, and it is the only way to check the page the captures came from.
- **A missing identifier may be a harness defect rather than a screen defect.**
  The failure names the identifier and the platform, and the capture fails
  loudly, so it is diagnosable either way.
- **A pass could be claimed from one platform.** The verdict requires both
  platforms' captures, so a single-platform run reports the other platform as
  unavailable and cannot pass.
- **V2 could be read as a fidelity claim.** The verdict covers the capture set,
  the grid, the identifiers and the labels. The evidence document states in its
  opening line and in a closing section that no visual parity is claimed.

## Contract change questions

No shared contract changes.

- **Why the current arrangement is insufficient:** it is not. The scenario and
  the run report are the benchmark package's own types and the optional
  tolerance belongs to them.
- **Which real consumer demonstrated the need:** the records scenario, whose
  captures exist on both platforms while no gate can pass.
- **Why adapter owned metadata is not enough:** not applicable. No source
  adapter is involved.
- **Whether the schema version changes:** no. The tolerance is optional in the
  scenario, and the App Graph, the inspection report and the target provenance
  manifest keep their versions.

## Migration Plan

No migration. A scenario without a tolerance behaves exactly as before, and the
only scenario that declares one is the records fixture in this repository.
