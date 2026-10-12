## MODIFIED Requirements

### Requirement: Action records carry bounded executable semantics

An action in Workflow IR schema version 3 MUST carry `kind: state-update`, an event name, a handler name, the state target, the operation, an optional typed value and the source location. The operation MUST be one of `set`, `increment` or `toggle`. An action with an unknown kind, operation or missing target MUST fail validation.

#### Scenario: A state update action is complete

- **WHEN** an action declares the state-update kind, a target, a supported operation and its source
- **THEN** the action is accepted and its operation is available to a target

#### Scenario: An incomplete action is refused

- **WHEN** an action declares a state-update kind without a target or with an unknown operation
- **THEN** IR validation returns a finding naming the action

### Requirement: Event bindings link to actions explicitly

An event binding in Workflow IR schema version 3 MUST carry a non-null `actionId` that names an action on the same screen. Non-event bindings MUST carry a null `actionId`.

#### Scenario: An event binding links to its action

- **WHEN** a supported event binding and its action share an `actionId`
- **THEN** a target can emit the linked handler without parsing the raw binding expression

#### Scenario: An unlinked event binding is refused

- **WHEN** an event binding has a null or unknown `actionId`
- **THEN** IR validation returns a finding naming the binding

### Requirement: State records carry typed initial values and provenance

A state record in Workflow IR schema version 3 MUST carry its declared kind, a deterministic initial value representation and source provenance. Initial values MUST be one of string, number, boolean or empty. The executable profile accepts scalar `ref` state only.

#### Scenario: State initial values round-trip

- **WHEN** a state record is serialized and read again
- **THEN** its kind, initial value and source remain unchanged

#### Scenario: An unsupported executable state is refused

- **WHEN** a generated state record is not a scalar `ref`
- **THEN** the source adapter refuses the screen with a source-located reason
