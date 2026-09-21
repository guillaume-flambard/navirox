## MODIFIED Requirements

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

## ADDED Requirements

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
