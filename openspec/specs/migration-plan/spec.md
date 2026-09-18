# migration-plan Specification

## Purpose
Define how a graph becomes a plan: a deterministic set of decisions, the rules
behind them, and a summary a team can act on before any code is moved.

## Requirements

### Requirement: Rules are data and precedence is declared

Rules MUST be declared as data with a stable identifier, and the engine MUST apply
them in a declared precedence: a user override first, then a rule specific to a
target, then a rule specific to a source, then a generic rule. A rule that does
not apply MUST NOT produce a decision.

#### Scenario: A user override wins

- **WHEN** a project supplies an override for a path and a rule would decide otherwise
- **THEN** the override decides and its reason is reported

#### Scenario: Rule order is declared rather than incidental

- **WHEN** two rules could both apply to a node
- **THEN** the one whose declared precedence is higher decides, regardless of the order rules were registered in

### Requirement: The plan is deterministic

Two plans over an unchanged graph MUST be identical, including the order of
decisions and the summary counts.

#### Scenario: Repeated planning is identical

- **WHEN** the planner runs twice over the same graph
- **THEN** the two plans are identical

#### Scenario: Decisions are ordered by their subject

- **WHEN** a plan is produced
- **THEN** its decisions are ordered deterministically by the node they concern

### Requirement: The plan reports what it does not know

The plan MUST carry the decisions, a summary counting each classification, and a
list of the nodes it could not decide, so that a reader sees the extent of the
unknown before acting. The plan MUST NOT name a target provider, because none
exists yet.

#### Scenario: The summary counts every class

- **WHEN** a plan is produced
- **THEN** its summary reports a count for each classification in the closed set, including zero for the ones that did not occur

#### Scenario: The unknown extent is visible

- **WHEN** a plan contains nodes classified as unknown
- **THEN** the plan lists them separately from the decisions

### Requirement: The planner reads the graph and writes nothing

The planner MUST take an App Graph and return a plan. It MUST NOT read the project
filesystem, and it MUST NOT modify anything.

#### Scenario: The planner is a function of the graph

- **WHEN** the planner runs
- **THEN** its input is the graph and the overrides, and its output is the plan

#### Scenario: A second consumer can reuse it

- **WHEN** a caller has a graph from any adapter
- **THEN** it can produce a plan without running an inspection

### Requirement: The neutral packages stay framework free

The planner MUST NOT import a source framework or a target provider, and the
framework boundary check MUST keep reporting no violation.

#### Scenario: The boundary holds

- **WHEN** the framework boundary check runs after the planner exists
- **THEN** no neutral package imports a framework and the check reports no violation
