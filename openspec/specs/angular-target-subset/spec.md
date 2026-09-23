# angular-target-subset Specification

## Purpose
Defines which Angular template constructs the Angular target accepts and which it
refuses, so a component is either compiled in full or refused with a finding, and
every generated screen carries provenance.

## Requirements

### Requirement: Angular constructs are translated to native equivalents

The Angular target compiler MUST translate the accepted Angular template
constructs into the native template directives, and MUST map elements to the
native primitives.

#### Scenario: ngIf becomes a native conditional

- **WHEN** a template carries `*ngIf="cond"` on an element
- **THEN** the compiler emits the element with `v-if="cond"` and reports no finding

#### Scenario: ngFor becomes a native loop

- **WHEN** a template carries `*ngFor="let item of items"` on an element
- **THEN** the compiler emits the element with `v-for="item in items"` and
  reports no finding

#### Scenario: A click becomes a native press

- **WHEN** a template binds `(click)="go()"` on an element
- **THEN** the compiler emits the element with `@press="go()"` and reports no
  finding

#### Scenario: ngModel on a text-input becomes a native model

- **WHEN** a template binds `[(ngModel)]="name"` on an element that maps to the
  `text-input` primitive
- **THEN** the compiler emits the element with `v-model="name"` and reports no
  finding

### Requirement: An unsupported construct is refused

The compiler MUST refuse an unsupported Angular construct with a finding and no
generated source, rather than emitting a plausible screen.

#### Scenario: A structural directive it does not implement is refused

- **WHEN** a template carries `*ngSwitch` on an element
- **THEN** the compiler returns an `unsupported-directive` finding and no
  generated source

#### Scenario: A custom element is refused

- **WHEN** a template uses an element with no native primitive mapping
- **THEN** the compiler returns an `unsupported-element` finding and no generated
  source

#### Scenario: Text outside a text primitive is refused

- **WHEN** a template places text or interpolation directly inside an element
  whose native primitive is not a text primitive
- **THEN** the compiler returns an `unsupported-text` finding and no generated
  source

### Requirement: Generated output carries provenance

The compiler MUST emit a deterministic provenance manifest for every fully
supported component. The manifest MUST identify the input, the output path and
the compiler version.

#### Scenario: A supported component produces source and provenance

- **WHEN** the compiler receives a fully supported Angular template
- **THEN** it returns generated source and a manifest that names the input, the
  output path and the compiler version
