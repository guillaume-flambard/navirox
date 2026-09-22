# preview-ci-baseline Specification

## Purpose
Keep a red continuous-integration run from being argued about from memory. A
repair SHALL name the failing run, its commit and each failing job with the cause
its log shows, a job that printed a warning but succeeded SHALL NOT be counted as
a blocker, and the developer-preview claim SHALL stay blocked until a run exists
in which every previously failing job succeeds.

## Requirements

### Requirement: A red run is diagnosed before it is repaired

Before a repair to continuous integration is recorded, the failing run SHALL be
identified by its run id and commit, and every failing job SHALL be linked to a
cause read from its log.

#### Scenario: A failing job is not left unexplained

- **WHEN** a repair for a red run is proposed
- **THEN** the change names the run, the commit and each failing job with the
  cause its log shows

#### Scenario: A passing job is not claimed as a blocker

- **WHEN** a job in the failing run concluded successfully but printed a warning
- **THEN** the change records the warning without counting the job as a failing
  gate

### Requirement: The preview claim stays blocked until CI is green

The developer-preview claim SHALL remain blocked while any job in the run fails,
and SHALL be unblocked only by a run in which every previously failing job
succeeds.

#### Scenario: One job remains red

- **WHEN** the Angular companion captures pass and the pilot journey still fails
- **THEN** the preview claim remains blocked and the remaining failure is the
  named blocker
