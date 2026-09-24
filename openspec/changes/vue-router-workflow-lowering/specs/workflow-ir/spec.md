## ADDED Requirements

### Requirement: Workflow routes and navigation actions are versioned

The Workflow IR MUST carry a route collection and route-linked screen references, and a navigation action MUST name a route or deep-link pattern. A schema change MUST provide a migration or refusal path for workflows without routes.

#### Scenario: A route round-trips

- **WHEN** a workflow with routes and navigation actions is serialized and read again
- **THEN** paths, parameters, screen references and action targets are unchanged

#### Scenario: An old route-less workflow is handled explicitly

- **WHEN** a reader receives a workflow version whose route representation is absent
- **THEN** it follows the declared migration or returns a versioned refusal instead of guessing navigation
