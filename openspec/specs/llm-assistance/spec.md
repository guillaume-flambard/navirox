# llm-assistance Specification

## Purpose
An opt-in second opinion on the subjects a deterministic plan cannot decide,
which is labelled, validated against the plan's own vocabulary, and never
becomes a decision.

## Requirements

### Requirement: Assistance is opt-in

The suggestion path MUST run only when the caller explicitly asks for it. When it
is not requested, the plan MUST be produced with no key, no network call and no
provider import.

#### Scenario: The plan runs without assistance

- **WHEN** the plan command runs without the assistance flag
- **THEN** it produces the plan without requesting a suggestion

#### Scenario: Assistance without a key fails readably

- **WHEN** assistance is requested and no key is configured
- **THEN** the run fails with a message that names the missing key and no
  suggestion is produced

### Requirement: Only undecided subjects are submitted

Assistance MUST be requested only for the subjects the plan left `manual` or
`unknown`. A subject the plan decided MUST never be submitted.

#### Scenario: Nothing was left undecided

- **WHEN** the plan decided every subject
- **THEN** no suggestion is requested

#### Scenario: Some subjects were left undecided

- **WHEN** the plan left subjects classified `manual` or `unknown`
- **THEN** only those subjects are submitted

### Requirement: A suggestion is validated against the plan's vocabulary

Every returned suggestion MUST be validated against the plan's closed class set.
An answer outside that set MUST be reported as no suggestion rather than
accepted.

#### Scenario: An answer outside the vocabulary

- **WHEN** the provider returns a class outside the plan's class set
- **THEN** the result reports `unknown` for that subject rather than the
  unusable class

### Requirement: A suggestion never changes a decision

Assistance MUST NOT modify, replace or remove any plan decision, and its output
MUST be distinguishable from the plan's own decisions.

#### Scenario: The plan decision is untouched

- **WHEN** a suggestion is produced for an undecided subject
- **THEN** the plan's decision for that subject still carries its original
  classification

#### Scenario: Suggestions are distinguishable in machine output

- **WHEN** the result is emitted as JSON
- **THEN** the suggestions appear under a field separate from the decisions

### Requirement: A suggestion is labelled

Every rendered suggestion MUST be labelled as a suggestion and MUST name the
model that produced it, so it cannot be mistaken for a decision.

#### Scenario: Suggestions are rendered for a person

- **WHEN** suggestions are rendered
- **THEN** they appear under a heading that marks them as suggestions and names
  the model

### Requirement: Only names and kinds leave the process

A judgment request MUST carry only identifiers and kinds. It MUST NOT carry the
content of any source file.

#### Scenario: The submitted state

- **WHEN** a judgment is requested
- **THEN** the submitted state holds names and kinds and no file content
