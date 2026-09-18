## Purpose

Reading a Lit project for a native migration: the custom elements it registers, the reactive properties those elements own, the routes it declares in code, and the surface the adapter reports rather than reads.

## ADDED Requirements

### Requirement: Lit is detected from its manifest, and a project aimed at the native runtime is refused

The adapter SHALL detect a project that declares `lit` in its manifest, SHALL record the declared version range as evidence, and SHALL produce no candidate for a project that already declares a native runtime dependency, because such a project is what Navirox produces rather than what it reads.

#### Scenario: A project declares Lit

- **WHEN** a project's manifest declares `lit` in a dependencies field
- **THEN** the adapter returns one candidate with high confidence whose evidence names the manifest file and the declared range

#### Scenario: A project declares the native runtime

- **WHEN** a project's manifest declares `react-native`, a `react-native-` package, or an `@symbiote-native/` package
- **THEN** the adapter returns no candidate, and the reason travels on the inspection when the adapter is chosen by name

#### Scenario: A project declares another framework

- **WHEN** a project declares `vue` and does not declare `lit`
- **THEN** the adapter returns no candidate and leaves the project to the adapter of the framework it does declare

### Requirement: A component is the element a class registers, in both documented forms

The adapter SHALL read a component as a class extending `LitElement` or `ReactiveElement`, SHALL recognize both documented registration forms, the `@customElement` decorator and a `customElements.define` call, and SHALL NOT treat a class that merely contains a registration call as the element it registers.

#### Scenario: The decorator form

- **WHEN** a module declares a class extending `LitElement` with the `@customElement` decorator
- **THEN** the class is reported as a unit of kind `component` and the tag name from the decorator is recorded in its metadata

#### Scenario: The direct registration form

- **WHEN** a module declares a class extending `LitElement` and registers it with `customElements.define`
- **THEN** the class is reported as a unit of kind `component` and the tag name from the call is recorded in its metadata

#### Scenario: A class that is not an element

- **WHEN** a module exports a class that does not extend `LitElement` or `ReactiveElement`
- **THEN** it is not reported as a unit of kind `component`

### Requirement: Reactive properties are adapter metadata, and no state module is produced

The adapter SHALL record whether a component declares a reactive property, SHALL keep that fact in the component's metadata, and SHALL NOT produce a unit of kind `state-module`, because Lit documents no store module that an application imports.

#### Scenario: A component declares a reactive property

- **WHEN** a component declares a property with `@property`, with `@state`, or in a `static properties` block
- **THEN** its unit metadata records the declaration and the unit kind remains `component`

#### Scenario: No unit of kind state module

- **WHEN** any project is inspected
- **THEN** no unit of kind `state-module` is produced by this adapter

### Requirement: Routes are read from the declared router configuration, and unreadable shapes are reported

The adapter SHALL read the `path` strings declared in `Routes` and `Router` configurations, SHALL convert a `:name` segment into a parameter, SHALL keep a trailing wildcard as the fact that a parent mounts a child, and SHALL report a route it cannot resolve as a finding rather than inventing a path pattern.

#### Scenario: A declared path becomes a route

- **WHEN** a route configuration declares `path: '/profile/:id'`
- **THEN** the adapter reports one route with pattern `/profile/:id` and one parameter named `id`

#### Scenario: A parent mounts a child

- **WHEN** a route configuration declares a path ending in a wildcard, such as `/child/*`
- **THEN** the adapter reports the route and keeps the wildcard as the prefix the child is mounted under

#### Scenario: A route declared as a URLPattern object

- **WHEN** a route configuration declares `pattern` with a `URLPattern` object instead of a `path` string
- **THEN** the adapter reports a finding naming that route and produces no path pattern for it

#### Scenario: A route with an enter callback

- **WHEN** a route configuration declares an `enter` callback
- **THEN** the adapter reports a finding that the callback was not resolved

#### Scenario: A project with no router

- **WHEN** a project declares Lit and never configures the labs router
- **THEN** the inspection reports no routes and no finding for their absence

### Requirement: The inspection is deterministic and traceable

The adapter SHALL produce the same fragment for two inspections of unchanged files, and every identifier in that fragment SHALL begin with this adapter's identifier, including for nodes read from a file another adapter could also read.

#### Scenario: Two inspections agree

- **WHEN** the same project is inspected twice without changes
- **THEN** the two fragments are equal

#### Scenario: Identifiers name this adapter

- **WHEN** a fragment is built from an inspection
- **THEN** every unit, capability, dependency and route identifier begins with `lit:`

### Requirement: The reading reports a version it has not been tested against

The adapter SHALL declare the range of `lit` versions it has been exercised against, and SHALL report a finding when a project declares a major outside that range rather than treating it as supported.

#### Scenario: An untested major

- **WHEN** a project declares a `lit` major outside the declared tested range
- **THEN** the inspection reports a finding naming the declared range and the tested range, and no claim of support is made

### Requirement: Capability usage is read with the shared scanner and stays honest

The adapter SHALL read browser and native capability usage with the shared capability scanner rather than a private list, and SHALL report a usage it cannot classify as `unknown` rather than guessing.

#### Scenario: Capability usage is read

- **WHEN** a project uses browser storage, a geolocation call and a network request
- **THEN** the inspection reports those capabilities with the usages the shared scanner assigns them

#### Scenario: An unclassifiable usage

- **WHEN** the shared scanner cannot classify a usage
- **THEN** the reported usage is `unknown`
