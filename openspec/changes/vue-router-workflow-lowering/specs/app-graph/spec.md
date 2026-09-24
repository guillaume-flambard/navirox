## ADDED Requirements

### Requirement: Routes remain framework-neutral graph facts

A graph route fact MUST contain a normalized path pattern, optional name, source location and resolved screen reference without naming a source framework or router API.

#### Scenario: A graph route is neutral

- **WHEN** a route fact is read from an adapter
- **THEN** it names only the route contract, path, source and screen, not the adapter's framework API
