## ADDED Requirements

### Requirement: Literal route facts are attributed to source

The Vue adapter MUST report every supported literal route with its path, optional name, resolved component unit, source location and evidence, and MUST report an unreadable router shape as a finding rather than a route.

#### Scenario: A literal route is attributed

- **WHEN** inspection reads a literal route with a resolved component
- **THEN** the route fact names the router file, route path and component unit

#### Scenario: A dynamic route is not invented

- **WHEN** inspection cannot read a route from a literal source shape
- **THEN** it reports a finding and emits no route fact for that shape
