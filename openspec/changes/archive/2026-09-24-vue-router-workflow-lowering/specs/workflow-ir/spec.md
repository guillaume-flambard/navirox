## ADDED Requirements

### Requirement: Workflow routes and navigation actions are versioned

The Workflow IR schema version 4 MUST carry a route collection with stable route ids, path patterns, optional names, parameter names, deep links, source locations and resolved screen ids. A separate navigation-action collection MUST carry `kind: navigate`, an event, a handler, a route id or deep-link pattern and source provenance. Event bindings resolve their explicit `actionId` against state actions or navigation actions on the same screen. A schema change MUST provide a migration or refusal path for workflows without routes.

#### Scenario: A route round-trips

- **WHEN** a workflow with routes and navigation actions is serialized and read again
- **THEN** paths, parameters, screen references and action targets are unchanged

#### Scenario: An old route-less workflow is handled explicitly

- **WHEN** a reader receives a workflow version whose route representation is absent
- **THEN** it follows the declared migration or returns a versioned refusal instead of guessing navigation

#### Scenario: Both supported source navigation forms are represented

- **WHEN** a literal `RouterLink` target or named no-argument `router.push` call names a supported route
- **THEN** the workflow carries a navigation action with a route id, deep link and explicit source provenance
