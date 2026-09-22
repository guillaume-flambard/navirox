## MODIFIED Requirements

### Requirement: A proof workflow fixture is original and credential-free

A proof workflow's source fixture, its data and its assets MUST be created for
this project. They MUST NOT copy the benchmark project's interface, assets or
data, and MUST NOT contain real records, credentials or an implied customer
relationship. The ordered actions that drive the workflow and the test
identifiers they act on MUST be declared as data beside the fixture, so a
reviewer can compare the contract with the fixture. When the journey has a target
path, one acceptance scenario MUST name those ordered actions and MUST be
executable on the web, iOS and Android paths without an account, a credential or
a real service. When the journey has no target path yet, the declared actions
MUST state that they are not yet executable and MUST NOT claim a run that does
not exist.

#### Scenario: The fixture is independent of the benchmark

- **WHEN** the fixture, its data or its assets are compared with the benchmark project
- **THEN** each is original to this project and none is copied from the benchmark

#### Scenario: The acceptance scenario needs no account

- **WHEN** the acceptance scenario is validated before implementation begins
- **THEN** its actions, data and devices require no credential and no real service

#### Scenario: A journey without a target path declares its actions

- **WHEN** a proof journey has no target path that can execute its workflow
- **THEN** the record declares the ordered actions and states that they are not yet executable instead of claiming a scenario that was never run

## ADDED Requirements

### Requirement: A benchmark-derived workflow keeps the benchmark's uncertainty

A workflow contract derived from a benchmark whose routing could not be read MUST
record the unresolved surface and MUST NOT invent routes, screens or units the
analysis did not establish. The contract MUST name the readable fixture its
workflow was selected from, and when that fixture is shaped after the benchmark
project it MUST state that the workflow is this project's own hypothesis rather
than the benchmark project's workflow.

#### Scenario: The unread routing stays a finding

- **WHEN** a workflow contract is derived from a benchmark whose routing the analysis could not read
- **THEN** the contract names the unread surface and claims no route, screen or unit the analysis did not establish

#### Scenario: The workflow is this project's own

- **WHEN** the workflow contract is read next to the benchmark revision it came from
- **THEN** it states that the workflow is this project's own hypothesis and not the benchmark project's chosen workflow
