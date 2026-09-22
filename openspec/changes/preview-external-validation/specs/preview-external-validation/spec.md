# preview-external-validation Specification

## ADDED Requirements

### Requirement: An external read of the report is run and recorded

The developer preview SHALL record a validation in which the analyzer runs
against external public repositories pinned to a commit, naming the command and
the report each run produced, before any usefulness claim is made.

#### Scenario: The validation names an external repository

- **WHEN** a validation of report usefulness is recorded
- **THEN** it names at least one public repository outside this workspace pinned
  to a commit, the analyzer command that ran, and the report it produced

#### Scenario: A local fixture is not external evidence

- **WHEN** a run used only a fixture inside this workspace
- **THEN** it is not recorded as an external validation

### Requirement: The record may not claim more than its status allows

The developer preview SHALL state one status for each external validation drawn
from the declared vocabulary, and SHALL NOT claim customer demand, support, or a
partnership from it.

#### Scenario: A self-run validation is a hypothesis

- **WHEN** only the analyzer run exists and no consented conversation informed it
- **THEN** the recorded status is `unvalidated hypothesis`

#### Scenario: A consented conversation informs but does not prove

- **WHEN** a consented conversation informs a validation without credentials or
  customer data
- **THEN** the recorded status is `practitioner-informed` and the record states it
  is still not customer demand

#### Scenario: An unsupported status is rejected

- **WHEN** a recorded validation names a status outside the declared vocabulary
- **THEN** a check fails
