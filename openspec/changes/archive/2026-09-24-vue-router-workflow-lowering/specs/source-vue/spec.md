## ADDED Requirements

### Requirement: Literal route facts are attributed to source

The Vue adapter MUST report every supported literal route with its stable route facts, path, optional name, parameter names, resolved component unit, source location and evidence. It MUST lower both literal `RouterLink`/`router-link` targets and named no-argument `router.push(...)` calls into navigation actions, and MUST report an unreadable router or navigation shape as a finding rather than a route or action.

#### Scenario: A literal route is attributed

- **WHEN** inspection reads a literal route with a resolved component
- **THEN** the route fact names the router file, route path and component unit

#### Scenario: A dynamic route is not invented

- **WHEN** inspection cannot read a route from a literal source shape
- **THEN** it reports a finding and emits no route fact for that shape

#### Scenario: Both supported navigation forms are lowered

- **WHEN** a screen uses a literal `RouterLink` target or a named no-argument `router.push` call
- **THEN** the adapter emits a linked navigation action with route and source provenance

#### Scenario: Dynamic navigation is refused

- **WHEN** a route target or `router.push` argument is computed, parameterized or arbitrary
- **THEN** the adapter reports a source-located finding and emits no navigation action
