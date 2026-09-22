# proof-journey-governance Specification

## Purpose

Keep the two active native proof journeys evidence-led, sequential, and within
Navirox's architecture and benchmark-use boundaries.

## Requirements

### Requirement: The active proof program has one agent entry point

The repository MUST provide an agent-facing execution charter linked from the
repository instructions and OpenSpec context. The charter MUST identify the
current proof outcome, source-of-truth precedence, verified-state boundaries,
and a rule for stopping when new authority or scope is required.

#### Scenario: An agent starts a proof task

- **WHEN** an agent reads the repository instructions before selecting work
- **THEN** it can reach the execution charter and determine the applicable source order and next decision

### Requirement: Proof journeys have staged, evidence-led exits

The active program MUST define stages for a Vue/Nuxt proof qualified against a
pinned Baserow revision and an Angular proof qualified against a pinned
SuiteCRM revision. Each stage MUST state its exit evidence and what it does not
prove.

#### Scenario: An agent proposes the next journey increment

- **WHEN** an agent selects an unblocked proof stage
- **THEN** it can identify the predecessor, required evidence, and claims that remain out of scope

### Requirement: Benchmark boundaries remain explicit

The governance system MUST require independent companions and MUST prohibit
inferring partnership, endorsement, customer work, source-UI conversion,
credentials, benchmark data, or copied branding from a public benchmark.

#### Scenario: A workflow is selected from benchmark evidence

- **WHEN** a future change selects a companion workflow using a benchmark finding
- **THEN** its scope requires original assets and data and records that the result is not an application of the benchmark owner

### Requirement: Future work is decomposed before implementation

The repository MUST maintain a dependency-ordered OpenSpec backlog where each
future proof change has a definition of done, verification, and explicit
out-of-scope boundary.

#### Scenario: A prior proof stage is incomplete

- **WHEN** an agent considers a change whose dependency has not met its exit criteria
- **THEN** the backlog directs the agent to finish or revise the predecessor rather than starting the dependent implementation
