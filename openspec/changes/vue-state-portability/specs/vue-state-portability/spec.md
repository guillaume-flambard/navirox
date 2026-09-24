## Purpose

This capability moves only Vue state and composable units whose purity, imports and observable behavior have been demonstrated, while keeping every uncertain unit visible as manual or unknown work.

## ADDED Requirements

### Requirement: Only an approved pure unit is moved

A Vue state or composable unit MUST be classified as movable only when its supported profile, pure behavior and import closure are evidenced. Parsing alone MUST NOT produce a portable or shared decision.

#### Scenario: A pure composable is approved

- **WHEN** a composable has no unsupported side effects and its declared behavior test passes
- **THEN** the unit is classified as shared or portable with evidence and is eligible for unchanged movement

### Requirement: Unsupported state behavior becomes manual

A unit with an unresolved import, dynamic dependency, browser side effect, network access or unmodelled state behavior MUST be classified as manual or unknown and MUST appear in the manual report.

#### Scenario: A state unit with a dynamic dependency is manual

- **WHEN** a state unit imports a dependency that cannot be proven portable
- **THEN** the plan reports manual or unknown with the reason and the unit is not moved

### Requirement: Moved behavior is verified

Before a state or composable unit is marked generated-and-proven, its declared observable behavior MUST pass the fixture acceptance test in the output workspace.

#### Scenario: Moved behavior passes its fixture

- **WHEN** an approved unit is moved unchanged
- **THEN** its declared state transition test passes against the moved file and the result is recorded

### Requirement: The migration report names unresolved imports

The migration result MUST name every moved unit, every output path, every unresolved import and every manual unit, so no shared or manual decision is hidden.

#### Scenario: The report distinguishes moved and manual work

- **WHEN** a run contains one approved composable and one unsupported store
- **THEN** the report names the moved composable and the manual store with separate reasons
