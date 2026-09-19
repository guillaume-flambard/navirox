## Purpose

Move code the way the plan said it could be moved, safely enough that a project
can be migrated a piece at a time.

## MODIFIED Requirements

### Requirement: The first transform moves only unchanged logic

The engine's first transform MUST copy a unit the plan classified as `shared` or
`portable` into the output directory without changing its content, and MUST NOT
attempt a rewrite it cannot justify.

#### Scenario: Shared logic is copied unchanged

- **WHEN** a unit is classified as shared
- **THEN** its file is written to the output directory with byte identical content

#### Scenario: Portable logic is copied unchanged

- **WHEN** a unit is classified as portable
- **THEN** its file is written to the output directory with byte identical content

#### Scenario: Nothing else is moved

- **WHEN** a unit is classified as anything other than shared or portable
- **THEN** this transform does not write it and the run says why

## ADDED Requirements

### Requirement: The report names the imports a moved unit did not carry

A run MUST report, for every unit it moves, each import the moved file names that
the run did not carry, naming the unit, the file, the import specifier and the
reason it is unresolved. An import that resolves to another unit this run moved,
or that names a package the project declares as a dependency, MUST NOT be reported
as unresolved.

#### Scenario: An import the run did not carry is reported

- **WHEN** a moved unit names an import that this run did not move and the project does not declare
- **THEN** the report names the moved unit, the file, the import specifier and the reason it is unresolved

#### Scenario: An import the run carried is not reported

- **WHEN** a moved unit names an import that resolves to another file this run also moved
- **THEN** the report does not list that import as unresolved

#### Scenario: A declared dependency is not reported

- **WHEN** a moved unit names an import whose package the project declares as a dependency
- **THEN** the report does not list that import as unresolved
