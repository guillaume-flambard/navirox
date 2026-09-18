# source-nuxt Specification

## Purpose
Define what the Nuxt adapter reads beyond what the Vue adapter reads, so that a
Nuxt project gets a readiness report that names its routes, its shared logic and
the parts that are tied to the server.

## Requirements

### Requirement: Nuxt is detected and composes the Vue adapter

Detection MUST match a project that declares the Nuxt package in its manifest,
with evidence naming the manifest field, and MUST declare that it composes the
Vue adapter. Selection MUST prefer it over that adapter without the registry
naming either framework.

#### Scenario: The Nuxt candidate is reported with evidence

- **WHEN** detection runs against a Nuxt project
- **THEN** the result contains a candidate whose evidence names the manifest file and the field

#### Scenario: Selection prefers the meta-framework

- **WHEN** both the Nuxt adapter and the Vue adapter are registered and both match
- **THEN** the Nuxt adapter is selected

### Requirement: Routes are read from the pages the framework documents

The adapter MUST derive one route per page file under the pages directory, with a
root index page becoming the root path, a named directory becoming a path
segment, a dynamic segment becoming a parameter, and an optional dynamic segment
also being reported as a parameter. A route MUST carry its page file as its
source location.

#### Scenario: The index page becomes the root path

- **WHEN** inspection runs against a project with a page at the pages root
- **THEN** a route whose pattern is the root path is reported, with that file as its source

#### Scenario: A nested page becomes its directory path

- **WHEN** a page lives inside a named directory
- **THEN** the route pattern contains that directory as a segment

#### Scenario: A dynamic segment becomes a parameter

- **WHEN** a page file name is wrapped in brackets
- **THEN** the route pattern contains a parameter in that position and the parameter name is reported

### Requirement: Layouts and composables become units

The adapter MUST report each layout as a layout unit and each composable as a
utility unit, because both are shared application code rather than framework
internals, and both carry a source location.

#### Scenario: A layout is a unit

- **WHEN** the layouts directory contains a layout
- **THEN** a unit of the layout kind is reported for it

#### Scenario: A composable is a unit

- **WHEN** the composables directory contains a module
- **THEN** a unit of the utility kind is reported for it

### Requirement: Server side and plugin surface is reported as findings

The adapter MUST report a server route, a plugin, a middleware and a runtime
configuration file as findings naming the file, and MUST NOT produce a unit or a
route for them. It MUST NOT claim to have read the server side.

#### Scenario: A server route is reported

- **WHEN** the server directory contains a route
- **THEN** a finding names that file and no unit is produced for it

#### Scenario: A plugin is reported

- **WHEN** the plugins directory contains a plugin
- **THEN** a finding names that file

### Requirement: Data fetching is read as a network request

A data fetching call from the framework MUST be reported through the neutral
capability vocabulary as a network request with the invoke usage, so that the
reading of a Nuxt application uses the same capability names as the reading of any
other application. The adapter MUST NOT introduce a capability name of its own.

#### Scenario: The framework data call is a network request

- **WHEN** inspection reads a page that fetches data with the framework's own helper
- **THEN** a network request capability use is reported for that file

#### Scenario: The vocabulary stays shared

- **WHEN** a Nuxt project and a plain project both make a network request
- **THEN** both reports name the same capability with the same usage kind

### Requirement: The reading is deterministic and traceable

Two inspections of an unchanged project MUST produce the same identifiers, every
identifier MUST begin with this adapter's identifier, and every node MUST carry a
source location.

#### Scenario: Repeated inspection produces the same identifiers

- **WHEN** inspection runs twice against an unchanged project
- **THEN** both fragments contain the same node identifiers

#### Scenario: Every node names its source

- **WHEN** a fragment is produced
- **THEN** every identifier begins with this adapter's identifier and every node carries a source location
