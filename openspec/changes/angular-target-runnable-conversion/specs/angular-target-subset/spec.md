## ADDED Requirements

### Requirement: Control-flow blocks are translated

The Angular target compiler MUST translate `@if`/`@else if`/`@else` to
`v-if`/`v-else-if`/`v-else` and `@for (item of items; track ...)` to `v-for`. It
MUST refuse a block it does not implement (`@switch`, `@defer`) with a finding
and no generated source.

#### Scenario: An if block becomes a native conditional

- **WHEN** a template carries `@if (cond) { ... } @else { ... }`
- **THEN** the compiler emits `v-if="cond"` and `v-else` and reports no finding

#### Scenario: A for block becomes a native loop

- **WHEN** a template carries `@for (item of items; track item.id) { ... }`
- **THEN** the compiler emits `v-for="item in items"` and reports no finding

#### Scenario: A block it does not implement is refused

- **WHEN** a template carries `@switch` or `@defer`
- **THEN** the compiler returns an `unsupported-control-flow` finding and no
  generated source

### Requirement: Grouping elements are transparent

The compiler MUST accept `ng-container` and `template` as grouping elements that
render no primitive of their own and carry their children in their place.

#### Scenario: A grouping element is transparent

- **WHEN** a template wraps content in `<ng-container>` or `<template>`
- **THEN** the compiler emits the content in place of the element with no finding
