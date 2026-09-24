## ADDED Requirements

### Requirement: Parsing is not portability evidence

A state or composable unit MUST NOT receive a `shared` or `portable` classification solely because it parsed. The decision MUST include a framework-profile evidence entry and a behavior evidence entry.

#### Scenario: A parsed but impure unit is not portable

- **WHEN** a unit parses but its behavior or side-effect evidence is missing
- **THEN** its classification is manual or unknown with the missing evidence named

### Requirement: Manual state decisions remain visible

The classification model MUST preserve a manual or unknown state decision and its reason rather than converting it to an error or silently dropping the unit.

#### Scenario: An unproven state unit remains in the plan

- **WHEN** the state evidence gate cannot approve a unit
- **THEN** the plan lists the unit as manual or unknown with its reason
