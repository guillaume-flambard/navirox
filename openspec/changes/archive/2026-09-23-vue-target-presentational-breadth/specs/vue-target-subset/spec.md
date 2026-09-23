## ADDED Requirements

### Requirement: Presentational elements map to existing primitives

The Vue target compiler MUST map the documented presentational elements to the
existing `view` and `text` primitives, and MUST NOT introduce a new primitive for
them.

#### Scenario: A presentational text element is generated

- **WHEN** a template uses a presentational inline element such as `<b>` or
  `<time>`
- **THEN** the compiler generates it as the `text` primitive

#### Scenario: A presentational container is generated

- **WHEN** a template uses a presentational container such as `<aside>` or
  `<figure>`
- **THEN** the compiler generates it as the `view` primitive

#### Scenario: An element outside the set is still refused

- **WHEN** a template uses an element with no mapping such as `<marquee>`
- **THEN** the compiler returns an `unsupported-element` finding and no generated
  source
