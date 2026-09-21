# visual-benchmark Specification

## Purpose
TBD - created by archiving change vue-visual-fidelity-benchmark. Update Purpose after archive.

## Requirements

### Requirement: A visual scenario is reproducible

A visual scenario MUST declare its source identity, route, data, browser profile,
native device profiles, actions, capture moments and permitted masks.

#### Scenario: An incomplete scenario is rejected

- **WHEN** a scenario omits a required capture moment or mask declaration
- **THEN** the scenario validator rejects it before a capture runner starts

### Requirement: Web and native captures are complete

The visual harness SHALL create every capture a scenario declares for the web, iOS
and Android runs, and SHALL fail when a declared capture is absent.

#### Scenario: A complete static scenario is captured

- **WHEN** a static scenario runs on its declared browser and device profiles
- **THEN** each declared capture exists in that scenario's artifact directory

### Requirement: Differences are declared or fail

The comparison report MUST report declared masks and tolerances and MUST fail on an
undeclared layout, style or capture difference.

#### Scenario: An undeclared difference fails the scenario

- **WHEN** normalized measurement finds a difference outside declared tolerances
- **THEN** the report marks the scenario failed and names the difference

### Requirement: Motion has temporal evidence

An interruptible visual scenario MUST capture rest, first meaningful, midpoint,
settled and interrupted states in that order.

#### Scenario: An interruptible action is captured

- **WHEN** a scenario declares an interruptible animation or gesture
- **THEN** its artifact report contains all five temporal capture labels in order
