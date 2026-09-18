# source-sveltekit Specification

## Purpose
Define how SvelteKit is detected and how its filesystem routing is read, so that
a meta-framework produces routes the base framework adapter cannot, through the
composition the registry already supports.

## Requirements

### Requirement: SvelteKit is detected and composes the Svelte adapter

Detection MUST match a project that declares the SvelteKit package in its
manifest, with evidence naming the manifest field. The adapter MUST declare that
it composes the Svelte adapter, and selection MUST prefer it over that adapter
without the registry naming either framework.

#### Scenario: The meta-framework candidate is reported

- **WHEN** detection runs against a SvelteKit project
- **THEN** the result contains a candidate for SvelteKit with manifest evidence

#### Scenario: Selection prefers the meta-framework

- **WHEN** both the SvelteKit adapter and the Svelte adapter are registered and both match
- **THEN** the SvelteKit adapter is selected

### Requirement: Routes are read from the routing the framework documents

The adapter MUST derive routes from SvelteKit's own route files, reporting one
route node per page with a path pattern built from the directory path, root
pages becoming the root path and dynamic segments becoming parameters. A route
MUST be reported only when its file exists, and it MUST carry that file as its
source location.

#### Scenario: A root page becomes the root path

- **WHEN** inspection runs against a project with a page at the routes root
- **THEN** the fragment contains a route whose pattern is the root path and whose source is that page

#### Scenario: A nested page becomes its directory path

- **WHEN** inspection runs against a project with a page inside a named directory
- **THEN** the fragment contains a route whose pattern is that directory path

#### Scenario: A dynamic segment becomes a parameter

- **WHEN** a page lives in a directory whose name is wrapped in brackets
- **THEN** the route pattern contains a parameter in that position and the parameter name is reported

### Requirement: Server side and layout files are reported as findings

The adapter MUST report a server only route, a layout, and any route file it does
not model as findings naming the file, and MUST NOT produce a route for them. A
finding is the honest result where the adapter has no reading.

#### Scenario: A server route is not a route node

- **WHEN** a directory contains a server side page file and no page file
- **THEN** no route node is produced for it and a finding names the file

#### Scenario: A layout is reported and not turned into a route

- **WHEN** a layout file exists in a route directory
- **THEN** a finding names it and no route is produced from it

### Requirement: Route extraction never invents a path

A path pattern MUST be derivable from the file location under the routes
directory. The adapter MUST NOT infer routes from anything else, and a directory
outside the routes root MUST NOT produce a route.

#### Scenario: A component outside the routes directory is not a route

- **WHEN** a page file exists outside the routes directory
- **THEN** no route is produced for it

#### Scenario: The inspection names what it could not model

- **WHEN** the routes directory contains a file the adapter does not model
- **THEN** a finding names that file and the route set contains only what was read
