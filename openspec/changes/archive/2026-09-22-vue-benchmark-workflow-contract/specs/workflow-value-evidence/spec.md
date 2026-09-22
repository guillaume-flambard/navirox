## MODIFIED Requirements

### Requirement: A proof workflow has explicit value evidence

Before an independent proof companion is implemented, its workflow MUST record
the source finding, operator and mobile context, trigger, success result, the
ordered actions the workflow performs, the minimum data each action reads or
writes, the failure state the workflow must surface, bounded data assumptions,
the desktop-only remainder, confidence, and unresolved risks.

#### Scenario: A workflow is proposed from a benchmark

- **WHEN** a proof uses a benchmark finding to propose a workflow
- **THEN** the workflow record distinguishes the source fact from the unvalidated product hypothesis

#### Scenario: The workflow contract is implementable without deciding scope

- **WHEN** the workflow record is reviewed before implementation begins
- **THEN** it names the ordered actions, the minimum data and the failure state, so implementation does not have to decide product scope

## ADDED Requirements

### Requirement: A proof workflow fixture is original and credential-free

A proof workflow's source fixture, its data and its assets MUST be created for
this project. They MUST NOT copy the benchmark project's interface, assets or
data, and MUST NOT contain real records, credentials or an implied customer
relationship. One acceptance scenario MUST name the ordered actions that drive
the workflow and MUST be executable on the web, iOS and Android paths without an
account, a credential or a real service.

#### Scenario: The fixture is independent of the benchmark

- **WHEN** the fixture, its data or its assets are compared with the benchmark project
- **THEN** each is original to this project and none is copied from the benchmark

#### Scenario: The acceptance scenario needs no account

- **WHEN** the acceptance scenario is validated before implementation begins
- **THEN** its actions, data and devices require no credential and no real service
