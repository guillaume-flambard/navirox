# workflow-ir Specification

## Purpose

The versioned, framework-neutral interface between a source lowering and a target
emission, with exhaustive coverage and stable serialization.

## Requirements

### Requirement: The IR is framework neutral

The IR types and their serialized form MUST name no source framework, no target
provider and no renderer.

#### Scenario: No framework name appears

- **WHEN** the IR module and its serialized fixtures are scanned for framework,
  target or renderer names
- **THEN** none appears

### Requirement: The IR is versioned and serializes stably

The IR MUST carry a schema version, and serializing the same workflow twice MUST
produce the same bytes and the same hash.

#### Scenario: The same workflow hashes alike

- **WHEN** a workflow is serialized twice
- **THEN** the two results are byte-identical and their hashes are equal

### Requirement: Every node carries coverage

The IR MUST record, for every node, whether it is generated, manual-required,
excluded or refused, and MUST reject a workflow that has an uncovered node.

#### Scenario: An uncovered node is refused

- **WHEN** a workflow contains a node with no coverage
- **THEN** validation returns a finding and the workflow cannot be emitted

### Requirement: The IR keeps provenance

Every IR node MUST reference the source location it came from.

#### Scenario: A node names its source

- **WHEN** a node is created from a source fact
- **THEN** it carries that fact's source location

### Requirement: The contract migrates rather than breaks

A version change MUST provide a migration path, and reading a version the reader
does not know MUST be refused rather than guessed.

#### Scenario: An unknown version is refused

- **WHEN** a serialized workflow declares a version the reader does not know
- **THEN** the reader returns an error naming the version
