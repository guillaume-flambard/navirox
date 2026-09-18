# source-solid Specification

## Purpose
`source-solid` reads a Solid project for the parts a migration cares about, and it is the
second source read through JSX, so it also tests whether the neutral model can hold a
reactivity model it has never seen without growing a concept for it.

## Requirements

### Requirement: Solid is detected from its manifest, and a project aimed at the native runtime is refused

The adapter SHALL offer a candidate only for a project that declares the Solid runtime, with
evidence naming the manifest field it read, and it SHALL offer no candidate for a project
that already declares a native runtime, because such a project is what Navirox produces
rather than what it reads.

#### Scenario: A project that declares Solid is detected
- **WHEN** the manifest declares `solid-js` in a dependency field
- **THEN** the adapter offers exactly one candidate with high confidence, and its evidence names the manifest and the declared range

#### Scenario: A project that declares a native runtime is not a source
- **WHEN** the manifest declares `react-native`, a `react-native-*` package or a `@symbiote-native/*` package
- **THEN** the adapter offers no candidate at all, and the reason is carried by the inspection when the adapter is chosen by name

#### Scenario: A project without Solid is not claimed
- **WHEN** the manifest declares no `solid-js` and no native runtime
- **THEN** the adapter offers no candidate and another adapter keeps the project

### Requirement: A component is read by what a module exports

The adapter SHALL read a component from a module that exports a function returning elements,
rather than from the file extension or the file name, and a component it cannot recognise
SHALL be a missing unit rather than a wrong one.

#### Scenario: An exported function returning elements is a component
- **WHEN** a module exports a named or default function whose body returns an element
- **THEN** that file is a unit of kind `component`

#### Scenario: A module that exports no component is not one
- **WHEN** a module contains no function returning elements
- **THEN** the file is not reported as a component

### Requirement: A store is read as a state module

The adapter SHALL report a module that declares a Solid store as a state module, covering
both documented ways to declare one, and it SHALL NOT report a module that merely imports
the store package as one.

#### Scenario: createStore declares a state module
- **WHEN** a module calls `createStore` taken from `solid-js/store`
- **THEN** that file is a unit of kind `state-module`

#### Scenario: createMutable declares a state module
- **WHEN** a module calls `createMutable` taken from `solid-js/store`
- **THEN** that file is a unit of kind `state-module`

### Requirement: Routes are read from the path literals of both documented router shapes

The adapter SHALL establish a route from a literal `path` of the Solid Router configuration,
in the JSX form and in the object form the documentation gives, and SHALL convert a
parameter segment and a wildcard segment into the route pattern rather than copying them
verbatim.

#### Scenario: The JSX form is read
- **WHEN** a route file contains a `Route` element with a literal `path` prop
- **THEN** that path becomes a route whose source names the file

#### Scenario: The object form is read
- **WHEN** a route file passes an array of route objects to `defineRoutes` or to `createRouter`, each with a literal `path`
- **THEN** each path becomes a route whose source names the file

#### Scenario: A parameter segment becomes a parameter
- **WHEN** a route path contains a parameter segment
- **THEN** the pattern carries that parameter and the route reports it in its parameter list

#### Scenario: A wildcard segment is a route and not a path
- **WHEN** a route path is a wildcard, named or unnamed
- **THEN** the adapter reports the route it matches instead of a literal wildcard path

### Requirement: What the adapter cannot resolve is reported rather than guessed

The adapter SHALL report a nested route it did not walk, a lazily loaded route, and a route
path that is not a literal, as findings naming the file, instead of inventing a route for
any of them.

#### Scenario: A nested route is reported
- **WHEN** a route file declares child routes beneath a parent
- **THEN** a finding says the children were not resolved, and the parent route is still reported

#### Scenario: A lazy route is reported
- **WHEN** a route is loaded through a dynamic import
- **THEN** a finding names the file, and no route is invented for the lazy import

#### Scenario: A computed path is reported
- **WHEN** a route path is not a string literal
- **THEN** a finding says the path was not read, and no route is invented for it

### Requirement: Version ranges are declared, and an untested major is reported

The adapter SHALL declare the Solid version ranges it was tested against, and SHALL report a
project on an untested major as a finding rather than treating it as supported.

#### Scenario: An untested major is a finding
- **WHEN** the declared Solid range is outside the tested ranges
- **THEN** a warning finding names the declared range and the tested ranges

### Requirement: The reading is deterministic and traceable

The adapter SHALL produce the same fragment for two inspections of an unchanged project, and
every node it produces SHALL carry its own identifier that begins with the adapter id and a
source location naming the file.

#### Scenario: Two inspections agree
- **WHEN** the same project is inspected twice
- **THEN** the two fragments are identical

#### Scenario: Identifiers name the adapter that produced them
- **WHEN** a fragment is built from an inspection
- **THEN** every identifier begins with this adapter's id and every node carries a source location
