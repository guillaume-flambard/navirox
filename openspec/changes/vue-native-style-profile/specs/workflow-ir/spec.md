## ADDED Requirements

### Requirement: Style facts and profiles are framework-neutral

A style fact MUST contain a source location, selector or token name, declarations, scope and provenance without naming a source framework or target rendering API. A style profile MUST define target capabilities in neutral terms.

#### Scenario: A style record is neutral

- **WHEN** a style fact and target profile are serialized
- **THEN** neither payload names a source framework or target renderer-specific API
