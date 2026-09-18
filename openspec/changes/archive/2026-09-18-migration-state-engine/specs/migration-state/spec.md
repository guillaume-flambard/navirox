## Purpose

Keep a durable, versioned record of what has been migrated and from what, so that
repeating a migration is safe and a partially finished one can be resumed.

## ADDED Requirements

### Requirement: The state is versioned and traceable

The migration state MUST carry a schema version, the adapter that read the source,
the source fingerprint a unit was migrated at, the target it was written to, and
the status of each unit. A reader MUST be able to decide whether it can read the
state from the version alone.

#### Scenario: The state names its producer and its source

- **WHEN** a migration writes state
- **THEN** the state names the schema version, the adapter and the target, and each unit entry carries the fingerprint it was migrated at

#### Scenario: An unreadable version is refused rather than guessed

- **WHEN** a state file declares a schema version the tool does not know
- **THEN** the migration fails and says so, and writes nothing

### Requirement: A fingerprint decides whether work is owed

The fingerprint of a unit MUST be derived from its source content, so that a unit
whose content changed is treated as new work and a unit whose content did not is
not migrated twice.

#### Scenario: An unchanged unit is skipped

- **WHEN** a unit's content is unchanged since it was last migrated
- **THEN** the migration reports it as already done and writes nothing for it

#### Scenario: A changed unit is work again

- **WHEN** a unit's content changed since it was last migrated
- **THEN** the migration treats it as owed work

### Requirement: The state is written only after the work it describes

The state MUST NOT record a unit as migrated before the files it produced exist.
A run that fails midway MUST leave state that describes what actually happened.

#### Scenario: A failed run does not claim success

- **WHEN** a transform fails part way through a run
- **THEN** the state describes the units that completed and not the one that failed

#### Scenario: State is written after the files

- **WHEN** a unit migrates successfully
- **THEN** its outputs exist before its entry is recorded
