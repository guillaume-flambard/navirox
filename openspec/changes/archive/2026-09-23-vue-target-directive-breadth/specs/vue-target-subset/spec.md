## ADDED Requirements

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
