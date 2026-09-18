# compatibility-registry Specification

## Purpose
Hold what Navirox knows about whether a thing works on a native target, with the
evidence that justifies it, so that a claim about compatibility is a fact with a
source rather than an opinion.

## Requirements

### Requirement: A record names its subject and its status

A record MUST name a subject, a status from the closed set, at least one evidence
entry and a note. The status set MUST be `supported`, `supported-with-adapter`,
`partial`, `blocked`, `unknown`, `not-applicable`.

#### Scenario: Every record carries a status from the set

- **WHEN** a record is read
- **THEN** its status is one of the declared values

#### Scenario: A record with no evidence is rejected

- **WHEN** a registry is loaded from data that declares a record without evidence
- **THEN** loading fails and names the record, rather than accepting a claim nothing supports

### Requirement: Evidence carries its level

Every evidence entry MUST declare a level from the closed set `documented`,
`fixture-tested`, `unit-tested`, `integration-tested`, `ios-build-tested`,
`android-build-tested`, `production-reported`, so that a claim's strength is
readable and not inferred.

#### Scenario: The level is part of the claim

- **WHEN** a record states that a package is supported
- **THEN** its evidence names the level that support rests on

#### Scenario: A build tested fact is distinguishable from a documented one

- **WHEN** two records make the same claim at different levels
- **THEN** a reader can tell them apart without reading the notes

### Requirement: Only demonstrateable facts are seeded

The seed registry MUST contain only facts this repository can demonstrate, and
each entry MUST name where the demonstration lives. A package MUST NOT be listed
because it is expected to work.

#### Scenario: A seeded fact names its demonstration

- **WHEN** the seed is read
- **THEN** every record names evidence that points at a run, a document or a build this repository has

#### Scenario: An undemonstrated package is absent rather than guessed

- **WHEN** a package has no demonstration in this repository
- **THEN** it does not appear in the seed and a lookup for it returns nothing

### Requirement: Lookup is deterministic and total

A lookup MUST return the record for a subject or nothing, and listing MUST be
deterministic regardless of the order records appear in the data.

#### Scenario: A known subject is found

- **WHEN** a lookup runs for a subject the registry holds
- **THEN** the record is returned

#### Scenario: An unknown subject returns nothing

- **WHEN** a lookup runs for a subject the registry does not hold
- **THEN** the result is empty and lookup does not throw
