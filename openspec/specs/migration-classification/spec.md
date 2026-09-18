# migration-classification Specification

## Purpose
Define how Navirox decides what a part of a project can become, so that every
answer is traceable to a reason and an honest unknown is preferred to an invented
certainty.

## Requirements

### Requirement: The classification set is closed

A decision MUST carry a classification from the closed set `shared`, `portable`,
`adaptable`, `native-replacement`, `web-fallback`, `manual`, `unknown`, and a
confidence of `low`, `medium` or `high`.

#### Scenario: Every decision names a class and a confidence

- **WHEN** a decision is produced
- **THEN** its classification is one of the declared values and its confidence is one of the declared values

#### Scenario: A class outside the set is impossible

- **WHEN** a rule returns a classification
- **THEN** the classification is a member of the declared set and the type system rejects anything else

### Requirement: No decision without a reason and evidence

Every decision MUST carry at least one reason and at least one evidence entry. A
decision that cannot say why it was made MUST NOT be produced; the node is
reported as unknown instead.

#### Scenario: A decision explains itself

- **WHEN** a decision is produced for a node
- **THEN** it carries a reason naming the rule that produced it and evidence naming what that rule read

#### Scenario: An unexplained node is unknown

- **WHEN** no rule produces a decision for a node
- **THEN** the node receives the unknown class with a reason saying that no rule applied

### Requirement: Unknown and manual are honest answers

The model MUST be able to express that Navirox does not know, and that a part
requires a human decision, without either being treated as an error.

#### Scenario: Unknown is reported, not hidden

- **WHEN** a project contains a node no rule covers
- **THEN** the unknown class is reported for it and the plan lists it

#### Scenario: Manual carries its reason

- **WHEN** a node is classified as manual
- **THEN** the decision states why Navirox cannot recommend a transformation for it
