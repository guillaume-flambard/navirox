# vue-target-subset Specification

## Purpose
Defines which template constructs the Vue target compiler accepts and which it
refuses, so a screen is either generated in full or refused with a finding instead
of being emitted in a form the native renderer cannot display.

## Requirements

### Requirement: Text native cannot render is refused

The Vue target compiler MUST refuse a text or interpolation child placed directly
inside an element whose native primitive is not a text primitive, and MUST return a
finding for it instead of generating source for that screen. A text node whose
content is only whitespace MUST NOT be refused.

#### Scenario: A label directly inside a non text element is refused

- **WHEN** a template places a text or interpolation child directly inside an element that maps to a non text primitive
- **THEN** the compiler returns an unsupported text finding and no generated source or output path

#### Scenario: Text inside a text element is generated

- **WHEN** a template places a text or interpolation child inside an element that maps to the text primitive
- **THEN** the compiler returns no finding and generates the screen

#### Scenario: Whitespace between elements is not text

- **WHEN** a template indents its elements across several lines so that whitespace only text sits between them
- **THEN** the compiler returns no finding for that whitespace and generates the screen

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

### Requirement: The compiler accepts the directives the native renderer implements

The Vue target compiler MUST accept `v-show`, `v-model` on a `text-input`, and
the press events `@press`, `@click`, `@press-in`, `@press-out` and `@long-press`.
It MUST refuse any other directive with an `unsupported-directive` finding and no
generated source.

#### Scenario: v-show is accepted

- **WHEN** a template binds `v-show` on an element
- **THEN** the compiler keeps the directive and reports no finding

#### Scenario: v-model on a text-input is accepted

- **WHEN** a template binds `v-model` on an element that maps to the `text-input`
  primitive
- **THEN** the compiler keeps the directive and reports no finding

#### Scenario: v-model outside a text-input is refused

- **WHEN** a template binds `v-model` on an element that is not a `text-input`
- **THEN** the compiler returns an `unsupported-directive` finding and no
  generated source

#### Scenario: An unimplemented directive is refused

- **WHEN** a template uses a directive the native renderer does not implement
- **THEN** the compiler returns an `unsupported-directive` finding and no
  generated source
