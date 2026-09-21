# project-scaffolding Specification

## Purpose
Define what a freshly scaffolded application records for the Navirox packages it
depends on, and what the scaffolder tells the user about that arrangement. An
application that cannot resolve its own dependencies is not a starting point.

## Requirements

### Requirement: The scaffolded manifest records an installable version

When the scaffolder finds no Navirox checkout above the target directory, it MUST
record the version it was released as for every Navirox package it writes into the
manifest, and MUST NOT record a placeholder that cannot resolve. When a checkout is
found, the entries MUST keep pointing at that checkout.

#### Scenario: No checkout is found

- **WHEN** a target directory has no Navirox checkout above it
- **THEN** the manifest records the scaffolder's own released version for every
  Navirox package, so the application's dependency range names a version that exists

#### Scenario: A checkout is found

- **WHEN** a Navirox checkout is found above the target directory
- **THEN** the manifest points the Navirox entries at that checkout, unchanged from
  the behaviour a contributor relies on

### Requirement: The scaffolder reports which arrangement it chose

After writing the manifest the scaffolder MUST report whether the Navirox packages
were linked from a checkout or recorded as released versions, and it MUST NOT claim a
version it did not write.

#### Scenario: Registry versions are recorded

- **WHEN** no checkout is found and the released version is written
- **THEN** the scaffolder reports that the application takes the Navirox packages
  from the registry at that version

#### Scenario: A checkout is linked

- **WHEN** a checkout is found and the entries are linked to it
- **THEN** the scaffolder reports that the packages come from that checkout and what
  to run there before the first development run
