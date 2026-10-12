# vue-action-state-execution Specification

## Purpose

This capability defines the bounded action and state behavior that the generated workflow can execute before any device journey is attempted.

## Requirements

### Requirement: Supported scalar ref state initializes deterministically

A generated screen MUST initialize each supported scalar `ref` state value from the Workflow IR with its declared string, number, boolean or empty initial value, and the target MUST preserve the state name and kind. Other state kinds MUST be refused rather than emitted with changed semantics.

#### Scenario: A scalar ref state has a generated initial value

- **WHEN** a supported scalar `ref` state record is lowered and emitted
- **THEN** the generated component initializes the same state name with the typed value declared by the IR

#### Scenario: A non-ref state is refused

- **WHEN** a source state is computed, reactive, a prop or an emit
- **THEN** the screen is refused with a source-located unsupported-state reason

### Requirement: A supported action mutates declared state

A supported action MUST name an existing scalar `ref` state target and a bounded `set`, `increment` or `toggle` mutation, and emitting the action MUST produce an executable handler that changes only that declared state. The accepted source grammar is an inline mutation or a named no-argument function containing one supported mutation statement.

#### Scenario: A state update changes the value

- **WHEN** a supported action updates a declared scalar state value
- **THEN** invoking the generated handler changes that state value and no other state value

#### Scenario: A supported named function is linked

- **WHEN** a no-argument function contains one supported mutation and a template event references it
- **THEN** the lowered action links to that event by `actionId` and preserves the function source location

### Requirement: Unsupported behavior is refused without an executable placeholder

An action that depends on arbitrary functions, watchers, effects, closures, dynamic imports, parameters, event modifiers, multiple statements or an unmodelled side effect MUST produce a source-located refusal and MUST NOT emit an executable placeholder.

#### Scenario: An arbitrary handler is refused

- **WHEN** a source event handler cannot be classified as a supported state mutation
- **THEN** the screen is refused with the handler location and the target emits no handler

### Requirement: Action execution is deterministic

The same Workflow IR MUST produce the same action declarations, initial state and generated handler bytes on repeated emission.

#### Scenario: Repeated action emission is identical

- **WHEN** the same workflow is emitted twice
- **THEN** both action records and generated handler contents are identical
