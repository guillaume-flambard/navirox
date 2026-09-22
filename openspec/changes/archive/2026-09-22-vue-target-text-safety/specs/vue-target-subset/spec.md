## Purpose

Defines which template constructs the Vue target compiler accepts and which it
refuses, so a screen is either generated in full or refused with a finding instead
of being emitted in a form the native renderer cannot display.

## ADDED Requirements

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
