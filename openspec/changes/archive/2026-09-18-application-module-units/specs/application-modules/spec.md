## Purpose

Define what counts as an application module, so that the logic a migration could
keep unchanged appears in the reading instead of only the views and the stores.

## ADDED Requirements

### Requirement: An application module is a unit

Each adapter MUST report every application module in the project as a unit with a
source location, alongside the components and the store declarations it already
reports.

#### Scenario: A plain module is reported

- **WHEN** inspection reads a module that is application logic
- **THEN** a unit is reported for it with a source location naming its file

#### Scenario: A module is reported once

- **WHEN** a module is both a store declaration and an application module
- **THEN** it is reported once, as the more specific of the two kinds

### Requirement: What is not application logic is not a unit

A test file, a configuration file, an entry point and a declaration file MUST NOT
be reported as units, and the exclusions MUST be declared as data rather than
applied ad hoc.

#### Scenario: A test file is left out

- **WHEN** inspection reads a file whose name marks it as a test
- **THEN** no unit is reported for it

#### Scenario: A configuration file is left out

- **WHEN** inspection reads a configuration file
- **THEN** no unit is reported for it

#### Scenario: An entry point is left out

- **WHEN** inspection reads a module named as an entry point
- **THEN** no unit is reported for it

### Requirement: The exclusion list is shared, not copied

The predicates that decide what an application module is MUST live in the neutral
package, so that two adapters cannot disagree about the same file.

#### Scenario: Two adapters agree on the same file

- **WHEN** two adapters inspect the same module
- **THEN** both report it as a unit or both leave it out, because they asked the same predicate

### Requirement: The consequence is visible in the plan

With application modules reported, the plan MUST classify the ones with no
platform capability use as shared, and the migration engine MUST move them.

#### Scenario: Shared logic appears

- **WHEN** a project contains a module with no capability use
- **THEN** the plan classifies it as shared

#### Scenario: Shared logic moves

- **WHEN** a migration writes with such a unit in the plan
- **THEN** the module is copied into the output directory
