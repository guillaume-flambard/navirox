# source-transform-provider-seam Specification

## Purpose

The two-sided contract that lets a source framework lower into the Workflow IR
and a target emit native source from it, with neither side importing the other.

## Requirements

### Requirement: A source lowers into the IR

A source transform provider MUST expose a lowering entry point that receives the
selection, the source snapshot and the profile, and returns a Workflow IR.

#### Scenario: A lowerer returns an IR

- **WHEN** a lowerer is given a selection and a profile
- **THEN** it returns a workflow that validates against the IR contract

### Requirement: A target emits from the IR only

A target provider MUST expose an emission entry point that receives the IR and a
target profile, and MUST NOT require any source framework type.

#### Scenario: A target consumes the IR

- **WHEN** a target is given a workflow and a target profile
- **THEN** it emits output without naming a source framework

### Requirement: The seam is asymmetric and enforced

A source adapter MUST NOT import a target provider or the runtime, and a target
provider MUST NOT import a source framework. A static check MUST fail when either
direction is crossed.

#### Scenario: A forbidden import fails the check

- **WHEN** a package in one side of the seam imports from the other
- **THEN** the seam check reports the file and the specifier

### Requirement: Two lowerers share one interface

Two providers from different frameworks MUST consume the same lowering interface
without adding a field specific to either framework.

#### Scenario: A second lowerer adds no field

- **WHEN** a second provider implements the interface
- **THEN** it declares no field the first provider does not share
