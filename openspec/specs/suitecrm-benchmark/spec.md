# suitecrm-benchmark Specification

## Purpose
Keep one large real-world application analyzable from a pinned revision alone.
The SuiteCRM benchmark MUST pin one public full commit SHA, MUST analyze only the
configured frontend source without installation, execution, credentials or writes
to the external project, and MUST derive its counts from the analysis rather than
from a hand-written expectation, so that a number in a report always traces back
to the revision and command that produced it.

## Requirements

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
