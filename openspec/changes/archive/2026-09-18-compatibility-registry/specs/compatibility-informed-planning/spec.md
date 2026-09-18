## Purpose

Make the plan read compatibility facts where they exist, so that the extent of the
unknown shrinks by exactly what the evidence justifies.

## ADDED Requirements

### Requirement: A recorded package is classified from its record

When a compatibility registry is supplied, a dependency with a record MUST be
classified from that record rather than as unknown, and the decision's evidence
MUST name the registry and the level the record rests on.

#### Scenario: A supported package becomes portable

- **WHEN** a dependency has a record whose status is supported with build tested evidence
- **THEN** the dependency is classified as portable and its evidence names the compatibility registry and the level

#### Scenario: A blocked package is not called portable

- **WHEN** a dependency has a record whose status is blocked
- **THEN** the dependency is not classified as portable and the decision says what blocks it

### Requirement: A package with no record stays unknown

The absence of a record MUST leave the decision unknown with the reason that no
compatibility record exists. A registry MUST NOT produce a verdict for a subject
it does not hold.

#### Scenario: The unknown block only shrinks by what is known

- **WHEN** a plan is produced with a registry that holds some of a project's dependencies
- **THEN** the dependencies it does not hold remain unknown

#### Scenario: No registry means the previous behaviour

- **WHEN** a plan is produced without a registry
- **THEN** every dependency is unknown for the same reason as before

### Requirement: The planner still reads only its inputs

The planner MUST take the registry as an input and MUST NOT read a registry file
from disk itself. Loading is the composition root's job.

#### Scenario: The planner is a function of graph and inputs

- **WHEN** the planner runs with a registry
- **THEN** the registry arrived as data and no file was read by the planner

#### Scenario: The rule layer is declared

- **WHEN** the compatibility rule competes with a generic rule
- **THEN** the declared layer decides, and the compatibility answer wins
