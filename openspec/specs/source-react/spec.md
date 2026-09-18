# source-react Specification

## Purpose
Read a web React application into the same neutral model the other adapters fill,
without letting the renderer's identity leak into what the source is.

## Requirements

### Requirement: React detection refuses a native project

Detection MUST match a project that declares React and MUST NOT match a project
that also declares the native runtime, because a React Native application is a
target rather than a web source and reading it as one would be the confusion the
architecture exists to prevent. A detection result carries candidates and nothing
else, so the refusal is the absence of a candidate; the reason is carried by the
adapter's inspection, which names the native dependency when the adapter is chosen
by name.

#### Scenario: A web React project is detected with evidence

- **WHEN** detection runs against a project whose manifest declares React and not the native runtime
- **THEN** the result contains one candidate whose evidence names the manifest file and the dependency field

#### Scenario: A native project is refused

- **WHEN** detection runs against a project that declares both React and the native runtime
- **THEN** the result contains no candidate and detection does not throw, and an inspection of that project reports the native dependency as a finding once it is selected by name

#### Scenario: A project without React yields no candidate

- **WHEN** detection runs against a project whose manifest declares no React
- **THEN** the result contains no candidate and detection does not throw

### Requirement: A component is found by what it exports, not by its extension

Inspection MUST report a module that exports a component as a component unit,
where a component is a function returning an element or a class the framework
would accept, and MUST NOT report a module that merely has a component-like name.

#### Scenario: A function component is reported

- **WHEN** a module exports a function that returns an element
- **THEN** a component unit is reported for it

#### Scenario: A component-like file name decides nothing

- **WHEN** a module is named like a component and exports no component
- **THEN** it is not reported as a component

### Requirement: State modules are found by their declaration

A module that declares a store through a state library MUST be reported as a state
module, and any other application module MUST be reported as a utility. A module
that only imports the library is not a state module.

#### Scenario: A declared store is a state module

- **WHEN** a module declares a store
- **THEN** its unit kind is the state module kind

#### Scenario: An import alone is not a store

- **WHEN** a module imports a state library and declares no store
- **THEN** it is reported as a utility unit rather than as a state module

### Requirement: Top level routes are read from the router configuration

Inspection MUST report one route per top level path literal in a router
configuration, and MUST report nested children and lazy components as findings
rather than resolving them.

#### Scenario: A top level path becomes a route

- **WHEN** a router configuration declares a top level path
- **THEN** a route is reported whose pattern is that path

#### Scenario: Children are reported and not resolved

- **WHEN** a router configuration declares children under a path
- **THEN** a finding names the file and the children produce no route of their own

### Requirement: A native dependency in a web project is reported

Inspection MUST report a dependency on the native runtime or on a native module in
a web source as a finding naming it, because a project that reaches the target's
own packages is a migration question rather than a plain reading.

#### Scenario: A native dependency is named

- **WHEN** a web React project declares the native runtime among its dependencies
- **THEN** a finding names the dependency

### Requirement: The vocabulary is shared with the other adapters

Capability use MUST come from the neutral scan, dependencies from manifest reading,
and the fragment from the neutral mapper, so that a React report is comparable to a
Vue one.

#### Scenario: The same capability is named the same way

- **WHEN** a React project and a project of another framework both store to local storage
- **THEN** both reports name the same capability with the same usage kind

#### Scenario: Every node names its source

- **WHEN** a fragment is produced
- **THEN** every identifier begins with this adapter's identifier and every node carries a source location
