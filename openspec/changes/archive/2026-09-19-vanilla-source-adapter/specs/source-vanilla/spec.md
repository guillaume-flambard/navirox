## Purpose

Read a web application that has no framework, from the documents the browser can be
pointed at and the modules those documents load, and report what the platform does not
say rather than inferring a component model, a store or a router the project never
wrote.

## ADDED Requirements

### Requirement: Vanilla is claimed last, and only for a project that has a document

The adapter SHALL claim a project only when its manifest declares no source framework
the neutral boundary already names, the project contains at least one HTML document,
and the project declares no native dependency. The framework list is data declared once
in the neutral package rather than a second list maintained here.

#### Scenario: A project with documents and no framework is claimed

- **WHEN** a manifest declares a build tool and a UI library that is not a source
  framework, and the project contains `index.html`
- **THEN** the adapter returns one candidate whose evidence names the manifest and the
  document

#### Scenario: A project that declares a source framework is left to that framework

- **WHEN** a manifest declares `vue` or `lit`
- **THEN** the adapter returns no candidate, because the framework's own adapter claims
  the project and a second claim would only be noise

#### Scenario: A project with no document is not a web application

- **WHEN** a manifest declares no source framework and the project contains only
  JavaScript modules
- **THEN** the adapter returns no candidate, because there is no document to serve and
  nothing to route

#### Scenario: A project that declares the native runtime is refused

- **WHEN** a manifest declares `react-native`, a `react-native-*` package or an
  `@symbiote-native/*` package
- **THEN** the adapter returns no candidate, using the refusal the React adapter
  declares rather than a second copy of it

### Requirement: A document is a route, at the address a host serves it from

The adapter SHALL read each HTML document as a route whose pattern is the path the
document is served at, with `index.html` naming the directory it sits in. It SHALL NOT
invent a pretty path the project did not write.

#### Scenario: The root document is the root route

- **WHEN** the project contains `index.html`
- **THEN** the inspection carries a route whose pattern is `/`

#### Scenario: A document names its own address

- **WHEN** the project contains `about.html` and `pages/team.html`
- **THEN** the inspection carries routes whose patterns are `/about.html` and
  `/pages/team.html`

#### Scenario: A document names the module it runs

- **WHEN** a document contains a `script` element with a `src` that names a file this project
  contains
- **THEN** that module is reported as a unit whose metadata names the document that loads it,
  even when the neutral application-module predicate would have skipped its file name

### Requirement: Modules are units, and the framework's absences are absences

The adapter SHALL report application modules as units and SHALL NOT report a component,
a layout or a state module, because the platform declares none of them. Reactive state,
component boundaries and styles are framework concepts this source does not have.

#### Scenario: A module is a unit

- **WHEN** a project contains an application module
- **THEN** the inspection reports a unit for it whose kind is `utility`

#### Scenario: No unit kind is invented for the framework

- **WHEN** any vanilla project is inspected
- **THEN** no unit of kind `component`, `layout` or `state-module` is reported, and the
  report says so by containing none of them rather than by repeating a finding

### Requirement: Code the adapter cannot read is reported

The adapter SHALL report an inline `script` block, which is code inside a document, and
client-side routing calls, which decide addresses at runtime. Neither SHALL be read as
a module or as a route.

#### Scenario: An inline script is reported

- **WHEN** a document contains a `script` element with a body rather than a `src`
- **THEN** the inspection carries a finding naming the document, and no unit is produced
  from the inline code

#### Scenario: Client-side routing is reported

- **WHEN** a module calls `history.pushState`, `history.replaceState`, listens for
  `popstate` or reads `location.hash`
- **THEN** the inspection carries a finding naming the file, because the addresses the
  application serves cannot be read from the source

### Requirement: Capabilities come from the shared scanner

The adapter SHALL report runtime capabilities using the neutral scanner, and an
unclassifiable use SHALL remain `unknown` rather than being guessed.

#### Scenario: A capability is read from a module

- **WHEN** a module calls `fetch`
- **THEN** the inspection reports a capability whose name is `network-request` and whose
  usage is `invoke`

#### Scenario: An unclassifiable use is unknown

- **WHEN** a module references a platform global the scanner recognizes but cannot
  classify
- **THEN** the capability usage is `unknown`

#### Scenario: Touching the document is reported as what it is

- **WHEN** a module reaches for `document` or `window`
- **THEN** the inspection reports a `dom` capability with usage `unknown`, which is the
  difference a frameworkless application has from a framework one and is not smoothed over

### Requirement: The reading is deterministic and traceable

The adapter SHALL produce the same fragment for two inspections of an unchanged project,
and every node SHALL carry an identifier whose first segment is this adapter's id and a
source location naming the file and the adapter.

#### Scenario: Two inspections agree

- **WHEN** the same project is inspected twice
- **THEN** both fragments serialize identically

#### Scenario: Identifiers name this adapter

- **WHEN** a fragment is built from an inspection
- **THEN** every route, unit, capability and dependency identifier begins with `vanilla:`
