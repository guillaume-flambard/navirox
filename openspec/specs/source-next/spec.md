# source-next Specification

## Purpose
Define what the Next adapter reads beyond what the React adapter reads, so that a
Next project reports its routes, its layouts and its module boundary without the
target side shaping the reading.

## Requirements

### Requirement: Next is detected, and a native project is refused

Detection MUST match a project that declares the Next package in its manifest,
with evidence naming the manifest field, and MUST declare that it composes the
React adapter. Detection MUST return no candidate for a project that declares a
native dependency, because a project already aimed at the native surface is what
Navirox produces rather than what it reads.

#### Scenario: The Next candidate is reported with evidence

- **WHEN** detection runs against a Next project
- **THEN** the result contains a candidate whose evidence names the manifest file and the field

#### Scenario: A project with a native dependency is not a source project

- **WHEN** detection runs against a project that declares a native dependency
- **THEN** no candidate is produced, and the reason is reported when the adapter is chosen by name

### Requirement: Both routers are read from the files they document

The adapter MUST derive routes from App Router page files and from Pages Router
page modules, reporting one route per page with the directory path as the pattern,
an index file as the directory itself, a bracketed segment as a parameter, and a
grouped segment left out of the pattern. A route MUST carry its file as its source
location.

#### Scenario: An App Router page becomes a route

- **WHEN** inspection runs against a project with a page under the application directory
- **THEN** a route whose pattern is that directory path is reported, with the page file as its source

#### Scenario: A Pages Router page becomes a route

- **WHEN** inspection runs against a project with a page module under the pages directory
- **THEN** a route whose pattern is that module path is reported

#### Scenario: A dynamic segment becomes a parameter

- **WHEN** a page file name or directory is wrapped in brackets
- **THEN** the route pattern contains a parameter in that position and the parameter name is reported

#### Scenario: A route group is not part of the path

- **WHEN** a page lives inside a directory whose name is wrapped in parentheses
- **THEN** the route pattern omits that segment

### Requirement: Layouts become units

The adapter MUST report each layout file it finds as a layout unit with its source
location, because a root layout is mandatory in the application router and is real
application code rather than a framework internal.

#### Scenario: A layout is a unit

- **WHEN** inspection runs against a project with a root layout
- **THEN** a unit of the layout kind is reported for it

### Requirement: The module boundary is adapter metadata

The adapter MUST record whether a component module declares the client directive
as adapter owned metadata on its unit, and MUST NOT emit a finding per file for it,
because the boundary is a fact about nearly every interactive component and a
finding per file would bury the findings that matter.

#### Scenario: The directive is recorded on the unit

- **WHEN** a component module declares the client directive
- **THEN** its unit carries that fact as metadata and no finding is produced for it

#### Scenario: The metadata does not reach the shared model

- **WHEN** the graph is inspected
- **THEN** no shared graph type mentions the directive, and the fact lives only in adapter owned metadata

### Requirement: The server surface is reported and not modelled

The adapter MUST report an API route, the middleware and the configuration file as
findings naming the file, and MUST NOT produce a unit or a route for them.

#### Scenario: An API route is reported

- **WHEN** an API route file exists under either router
- **THEN** a finding names that file and no route is produced from it

#### Scenario: The middleware is reported

- **WHEN** a middleware file exists
- **THEN** a finding names it

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
