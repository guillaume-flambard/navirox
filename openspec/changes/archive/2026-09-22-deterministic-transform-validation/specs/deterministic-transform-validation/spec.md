# deterministic-transform-validation Specification

## ADDED Requirements

### Requirement: A rewrite transform records its provenance

A transform that changes the bytes of a moved file MUST record, for every write,
the input it read, the rule that fired and the output it produced, and MUST
produce the same output for the same input on every run.

#### Scenario: A rewrite is reported with its rule

- **WHEN** a rewrite transform writes a file
- **THEN** the report names the rule that fired for that write and the file it
  came from, so the change is attributable rather than anonymous

#### Scenario: The same input produces the same output

- **WHEN** the transform runs twice on the same input
- **THEN** the two outputs are byte-identical

### Requirement: A failed run is reversible

A run that writes and then fails MUST restore every file it touched to its
previous contents, and a test MUST demonstrate this by forcing a failure after a
write.

#### Scenario: A failure after a write restores the directory

- **WHEN** a migration run writes a file and then fails
- **THEN** the file it touched holds its previous contents again and the run
  reports what it restored

### Requirement: The transform is validated by behaviour and a clean build

The transform MUST be validated by running it through the real planner and engine
and asserting on the output, and the workspace build MUST stay clean after the
increment.

#### Scenario: The transform is driven through the pipeline

- **WHEN** a graph fragment is planned and migrated with the transform in play
- **THEN** the written file shows the substitution and the surrounding code is
  unchanged

#### Scenario: The transform does not apply outside its classification

- **WHEN** a unit is classified so the transform does not apply
- **THEN** the transform does not rewrite it
