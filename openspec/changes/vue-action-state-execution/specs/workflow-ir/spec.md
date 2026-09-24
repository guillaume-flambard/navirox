## ADDED Requirements

### Requirement: Action records carry bounded executable semantics

An action in the Workflow IR MUST carry a closed action kind, the state target when it mutates state, the operation, and the source location. An action with an unknown kind or missing target MUST fail validation.

#### Scenario: A state update action is complete

- **WHEN** an action declares a state-update kind and its target
- **THEN** the action is accepted and its operation is available to a target

#### Scenario: An incomplete action is refused

- **WHEN** an action declares a state-update kind without a target
- **THEN** IR validation returns a finding naming the action

### Requirement: State records carry initial values

A state record MUST carry its declared kind and a deterministic initial value representation when the state is supported for generation.

#### Scenario: State initial values round-trip

- **WHEN** a state record is serialized and read again
- **THEN** its kind and initial value remain unchanged
