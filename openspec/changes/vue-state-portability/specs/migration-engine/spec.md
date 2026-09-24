## ADDED Requirements

### Requirement: State movement is atomic and behavior-gated

The migration engine MUST write an approved state or composable unit only after its declared behavior fixture passes, and a failure MUST leave the output directory as it was.

#### Scenario: A failed state movement leaves no partial output

- **WHEN** a moved state unit fails its behavior fixture after a file is planned
- **THEN** no moved file or manifest is written and the result names the failed unit

### Requirement: State movement reports its dependency closure

For every moved state or composable unit, the migration result MUST name the unit, its output path, carried imports, unresolved imports and any manual replacement or extension.

#### Scenario: A moved composable reports its closure

- **WHEN** a pure composable is moved with one declared dependency
- **THEN** the result names the moved file, carried dependency and any unresolved import
