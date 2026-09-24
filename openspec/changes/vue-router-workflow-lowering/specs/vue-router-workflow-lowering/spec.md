## Purpose

This capability records the literal navigation contract that a supported Vue Router project contributes to the generated workflow, including parameters and deep links, while refusing route shapes that cannot be proven.

## ADDED Requirements

### Requirement: Literal routes enter the workflow

A literal top-level route with a path and a resolved screen MUST appear in the Workflow IR with its path, name when present, source location and target screen.

#### Scenario: A literal route is preserved

- **WHEN** a supported router fixture declares a literal route for a screen
- **THEN** the workflow contains one route with the same path, name and screen target

### Requirement: Route parameters and deep links are explicit

A route parameter MUST be represented by a typed parameter name and a deep-link pattern that can be consumed by a navigation action and target profile.

#### Scenario: A named parameter is represented

- **WHEN** a literal route contains a named parameter
- **THEN** the workflow records the parameter name and emits a deterministic deep-link pattern

### Requirement: Dynamic router behavior is refused

A computed route table, guard, plugin-dependent route, unresolved component or route that cannot be attributed to a literal source fact MUST produce a source-located refusal and MUST NOT produce a partial route or screen.

#### Scenario: A computed route is refused

- **WHEN** the router fixture builds its route table dynamically
- **THEN** lowering returns a route refusal naming the source location and no route node

### Requirement: Route output is deterministic

Repeated lowering of an unchanged supported router fixture MUST produce identical route ids, parameters, navigation actions and workflow hash.

#### Scenario: Repeated route lowering is stable

- **WHEN** the same router fixture is lowered twice
- **THEN** both workflow serializations and hashes are identical
