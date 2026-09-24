## ADDED Requirements

### Requirement: A lowering or emission refusal blocks the transaction

When lowering or emission reports any refused, manual-required or excluded screen, `transform` MUST return a non-success result and MUST NOT write any planned file or manifest, including generated files for other screens.

#### Scenario: A mixed result leaves the output intact

- **WHEN** a workflow contains one generated screen and one refused screen and write is requested
- **THEN** the output directory contains no new file and the result names every refusal
