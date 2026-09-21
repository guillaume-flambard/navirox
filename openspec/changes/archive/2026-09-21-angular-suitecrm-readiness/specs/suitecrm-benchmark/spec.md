## ADDED Requirements

### Requirement: SuiteCRM benchmark analysis is reproducible and read-only

The SuiteCRM benchmark SHALL pin one public full commit SHA and SHALL analyze only
the configured frontend source without installation, execution, credentials or
writes to the external project.

#### Scenario: The pinned profile passes its baseline

- **WHEN** the SuiteCRM benchmark runs against the configured commit
- **THEN** it reports the configured adapter and route and unit counts at or above its recorded baselines

#### Scenario: A source access failure fails visibly

- **WHEN** the SuiteCRM repository or pinned revision cannot be read
- **THEN** the benchmark command fails rather than skipping the profile

