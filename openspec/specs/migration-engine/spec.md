# migration-engine Specification

## Purpose
Move code the way the plan said it could be moved, safely enough that a project
can be migrated a piece at a time.

## Requirements

### Requirement: A transform declares its family and what it applies to

A transform MUST declare a stable identifier, a family from the declared set
(source, generic, target), and the units it applies to. A transform that does not
apply MUST NOT produce edits or outputs.

#### Scenario: A transform names its family

- **WHEN** a transform is registered
- **THEN** its family is one of the declared values and its identifier is stable

#### Scenario: A transform that does not apply does nothing

- **WHEN** a transform's condition is false for a unit
- **THEN** no files are written for that unit by that transform

### Requirement: A dry run writes nothing

A run MUST be able to report every file it would write, and every unit it would
change, without touching the filesystem.

#### Scenario: A dry run leaves the project alone

- **WHEN** a migration runs without the write flag
- **THEN** no file is created or modified and the run reports what it would have done

#### Scenario: The report is enough to decide

- **WHEN** a dry run reports a unit
- **THEN** it names the source unit, the outputs, and the reason it was chosen

### Requirement: A failed transform is rolled back

A run that fails part way MUST restore every file it had written during that run,
so a failure leaves the output directory as it was. A file that existed before the
run MUST be restored to its previous content.

#### Scenario: A failure leaves no partial output

- **WHEN** a transform fails after writing a file
- **THEN** the file is restored to what it was, or removed if it did not exist before

#### Scenario: The rollback is reported

- **WHEN** a run rolls back
- **THEN** the failure names the transform and the unit, and says what was restored

### Requirement: Writing stays inside the output directory

The engine MUST refuse to write outside the output directory it was given, and
MUST refuse to write at all when the output directory is the source directory.

#### Scenario: A path that escapes the output is refused

- **WHEN** a transform would write a path outside the output directory
- **THEN** the run fails and nothing is written

#### Scenario: In place migration is refused

- **WHEN** the output directory is the source directory
- **THEN** the run fails and explains that this engine does not migrate in place

### Requirement: The first transform moves only unchanged logic

The engine's first transform MUST copy a unit the plan classified as shared into
the output directory without changing its content, and MUST NOT attempt a rewrite
it cannot justify.

#### Scenario: Shared logic is copied unchanged

- **WHEN** a unit is classified as shared
- **THEN** its file is written to the output directory with byte identical content

#### Scenario: Nothing else is moved

- **WHEN** a unit is classified as anything other than shared
- **THEN** this transform does not write it and the run says why
