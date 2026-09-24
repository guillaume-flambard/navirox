## Purpose

This change defines the bounded action and state behavior that the generated workflow can execute before any device journey is attempted.

## ADDED Requirements

### Requirement: Supported state initializes deterministically

A generated screen MUST initialize each supported state value from the Workflow IR with a deterministic typed value, and the target MUST preserve the state name and kind.

#### Scenario: A ref state has a generated initial value

- **WHEN** a supported state record is lowered and emitted
- **THEN** the generated component initializes the same state name with a value declared by the IR

### Requirement: A supported action mutates declared state

A supported action MUST name an existing state target and a bounded mutation, and emitting the action MUST produce an executable handler that changes only that declared state.

#### Scenario: A state update changes the value

- **WHEN** a supported action updates a declared state value
- **THEN** invoking the generated handler changes that state value and no other state value

### Requirement: Unsupported behavior is refused without an executable placeholder

An action that depends on arbitrary functions, watchers, effects, closures, dynamic imports or an unmodelled side effect MUST produce a source-located refusal and MUST NOT emit an executable placeholder.

#### Scenario: An arbitrary handler is refused

- **WHEN** a source event handler cannot be classified as a supported state mutation
- **THEN** the screen is refused with the handler location and the target emits no handler

### Requirement: Action execution is deterministic

The same Workflow IR MUST produce the same action declarations, initial state and generated handler bytes on repeated emission.

#### Scenario: Repeated action emission is identical

- **WHEN** the same workflow is emitted twice
- **THEN** both action records and generated handler contents are identical
