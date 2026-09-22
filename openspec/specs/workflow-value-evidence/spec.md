# workflow-value-evidence Specification

## Purpose
TBD - created by archiving change workflow-value-evidence. Update Purpose after archive.

## Requirements

### Requirement: A proof workflow has explicit value evidence

Before an independent proof companion is implemented, its workflow MUST record
the source finding, operator and mobile context, trigger, success result,
bounded data assumptions, desktop-only remainder, confidence, and unresolved
risks.

#### Scenario: A workflow is proposed from a benchmark

- **WHEN** a proof uses a benchmark finding to propose a workflow
- **THEN** the workflow record distinguishes the source fact from the unvalidated product hypothesis

### Requirement: Native is an evidence-led decision

A workflow record MUST compare the native companion with viable PWA, WebView,
or Capacitor alternatives against declared workflow criteria and MUST record the
resulting decision.

#### Scenario: Native has no evidenced advantage

- **WHEN** the alternative comparison does not establish a material native advantage
- **THEN** the record recommends the alternative or stops the native proof rather than assuming native is preferable

### Requirement: Practitioner evidence preserves boundaries

Any practitioner feedback used in a workflow record MUST be consented,
minimized, and synthesized without credentials, customer data, or an implied
customer relationship.

#### Scenario: Feedback has not been obtained

- **WHEN** a workflow has no practitioner feedback
- **THEN** the record labels the value hypothesis unvalidated and does not state it as customer demand
