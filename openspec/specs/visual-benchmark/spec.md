# visual-benchmark Specification

## Purpose
Make a visual comparison repeatable enough to be evidence. A visual scenario MUST
declare its source identity, route, data, browser profile, native device profiles,
actions, capture moments and permitted masks, so that a capture can be reproduced
from its declaration and a difference between mobile and web is attributed to the
port rather than to an undocumented change of setup.

## Requirements

### Requirement: A visual scenario is reproducible

A visual scenario MUST declare its source identity, route, data, browser profile,
native device profiles, actions, capture moments and permitted masks.

#### Scenario: An incomplete scenario is rejected

- **WHEN** a scenario omits a required capture moment or mask declaration
- **THEN** the scenario validator rejects it before a capture runner starts

### Requirement: Web and native captures are complete

The visual harness SHALL create every capture a scenario declares for the web, iOS
and Android runs, and SHALL fail when a declared capture is absent. A native capture
MUST come from a device driver that builds, installs and launches the application on
the declared device profile, and MUST drive the scenario's declared actions before the
capture is taken.

#### Scenario: A complete static scenario is captured

- **WHEN** a static scenario runs on its declared browser and device profiles
- **THEN** each declared capture exists in that scenario's artifact directory

#### Scenario: A device that never runs the application is not a capture

- **WHEN** a device driver cannot build, install or launch the application on the declared profile
- **THEN** the run records that capture as unavailable with the reason and fails the scenario

### Requirement: Differences are declared or fail

The comparison MUST report every declared mask and every declared tolerance, and
MUST fail on an undeclared layout, style or capture difference. When a scenario
declares a cross-platform tolerance, the comparison MUST return a verdict of
`pass` or `fail` against that declaration and MUST name every check it
evaluated. A pixel difference ratio MUST NOT be the value that decides a pass: a
run reports it as a measurement beside the verdict.

#### Scenario: An undeclared difference fails the scenario

- **WHEN** normalized measurement finds a difference outside declared tolerances
- **THEN** the report marks the scenario failed and names the difference

#### Scenario: A declared tolerance returns a verdict

- **WHEN** a scenario declares a cross-platform tolerance and a run compares its captures
- **THEN** the run reports `pass` or `fail` with the check that decided it, and reports the pixel ratio as a measurement beside that verdict

### Requirement: Motion has temporal evidence

An interruptible visual scenario MUST capture rest, first meaningful, midpoint,
settled and interrupted states in that order.

#### Scenario: An interruptible action is captured

- **WHEN** a scenario declares an interruptible animation or gesture
- **THEN** its artifact report contains all five temporal capture labels in order

### Requirement: A native capture is attributable to a compiler revision

A native capture run MUST record the target compiler revision and the manifest hash of
the screen it captured, and MUST refuse to capture when a fresh compilation of the
source no longer matches the emitted screen file.

#### Scenario: A stale emitted file stops the run

- **WHEN** the fresh compiler output differs from the emitted screen file
- **THEN** the capture run fails before it installs anything on a device

### Requirement: A device capture run names its device

A device capture run MUST record, for every capture it produced, the platform, the
device or emulator name and the operating system version it ran on, and MUST record
every capture it could not produce together with its reason.

#### Scenario: A run on one platform leaves the other recorded

- **WHEN** a scenario is captured on one platform only
- **THEN** the report names the profile of that platform and records the other platform's captures as unavailable with a reason

### Requirement: A cross-platform comparison is a measurement

A comparison between a web capture and a native capture MUST be reported as a
measurement, and MUST NOT be reported as a pass while the scenario declares no
cross-platform tolerance.

#### Scenario: No declared tolerance means no pass

- **WHEN** a scenario compares a web capture against a native capture and declares no cross-platform tolerance
- **THEN** the report records the measured difference as undeclared rather than passed

### Requirement: A scenario declares the cross-platform differences it accepts

A scenario MAY declare a cross-platform tolerance. A declared tolerance MUST
state the maximum relative difference between the two normalized grids and the
test identifiers the scenario requires on both platforms. A scenario that
declares no tolerance MUST keep the measurement-only behaviour. A declared
identifier MUST be checked where it exists, on the served web page and in the
running device application, and a missing identifier MUST fail the capture that
declared it.

#### Scenario: A missing identifier fails the capture

- **WHEN** a declared identifier is absent from the served web page or from the running device application
- **THEN** the capture fails and names the missing identifier instead of reaching the comparison

#### Scenario: A grid difference inside the tolerance passes

- **WHEN** both platforms produced every declared capture and their normalized grids differ by no more than the declared tolerance
- **THEN** the run reports a passing verdict and names the grid difference it accepted
