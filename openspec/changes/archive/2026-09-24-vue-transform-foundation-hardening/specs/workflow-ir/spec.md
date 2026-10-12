## ADDED Requirements

### Requirement: Binding values carry an explicit value kind

Every workflow binding MUST carry a value kind that distinguishes literal text from an expression. The serialized form MUST preserve that kind, and a reader MUST reject a serialized binding whose kind is missing or unknown.

#### Scenario: A literal binding round-trips

- **WHEN** a workflow containing a literal binding is serialized and read again
- **THEN** the binding remains literal and its text is unchanged

#### Scenario: An expression binding round-trips

- **WHEN** a workflow containing an expression binding is serialized and read again
- **THEN** the binding remains an expression and its expression text is unchanged

### Requirement: A binding schema change is migratable

A change to the binding value representation MUST provide an explicit migration or refusal path for previously serialized workflows.

#### Scenario: An old binding shape is not guessed

- **WHEN** a reader receives a serialized binding without the declared value kind
- **THEN** it returns a versioned refusal instead of interpreting the value as an expression
