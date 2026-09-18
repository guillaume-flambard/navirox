## Purpose

Define the evidence that decides whether the source seam is real: two different
frameworks, one feature journey, one neutral model, and no adapter specific
concept anywhere in the shared layer.

## ADDED Requirements

### Requirement: The comparison runs two adapters over equivalent projects

The repository MUST carry two fixture projects that implement the same journey
(a list, a detail view, shared state, storage, geolocation, an API call and a
validated input), one in each framework, and a test that inspects both through
the same pipeline and compares the reports.

#### Scenario: Both projects are inspected through one pipeline

- **WHEN** the comparison runs
- **THEN** each fixture is inspected by its own adapter through the neutral pipeline and each produces a report

### Requirement: The two reports are structurally comparable

The comparison MUST hold the two reports to the same shape: the same set of unit
kinds, the same set of capability names and usage kinds, the same dependency
handling, and findings drawn from the same code vocabulary. Neither report may
contain a concept the other framework could not express.

#### Scenario: Capability readings agree

- **WHEN** the two fixtures use the same browser capabilities
- **THEN** both reports list the same capability names with the same usage kinds

#### Scenario: Neither report introduces a private concept

- **WHEN** the two reports are compared node kind by node kind
- **THEN** every kind present in one is a kind the shared model defines

### Requirement: The core needed no framework specific change to pass

Passing the comparison MUST NOT have required a framework condition in a neutral
package, a new graph node type named after a framework, or a new shared concept
that only one adapter produces. What the two adapters share MUST be shared
through the neutral packages, and the framework boundary check MUST still report
no violation.

#### Scenario: The boundary check stays green

- **WHEN** the framework boundary check runs after the second adapter exists
- **THEN** it reports no violation

#### Scenario: A shared concept arrived by rule

- **WHEN** a concept was moved into the neutral core for the second adapter
- **THEN** the move is documented as required by a second adapter rather than as a convenience, and both adapters use it

### Requirement: The outcome of the gate is recorded

The result MUST be recorded as evidence, including what the second adapter could
not do and whether the shared model had to be extended. A gate whose outcome is
not written down is not a gate.

#### Scenario: The evidence names the limits

- **WHEN** the gate evidence is read
- **THEN** it states which capabilities the second adapter implements, which it does not, and what was moved into the neutral core
