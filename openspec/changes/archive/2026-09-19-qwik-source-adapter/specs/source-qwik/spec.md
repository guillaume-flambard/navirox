## Purpose

Read a Qwik project well enough to plan a migration: its components, the routes
Qwik City's file system declares, the layouts that wrap them, and the surface
that runs somewhere other than the browser.

## ADDED Requirements

### Requirement: Qwik is detected from its manifest, and a project aimed at the native runtime is refused

The adapter MUST claim a project that declares `@builder.io/qwik`, with evidence
naming the manifest field and range, and MUST report a version it has not been
exercised against as a finding. It MUST NOT claim a project that declares a
native runtime dependency, because a project already aimed at the native surface
is what Navirox produces rather than what it reads.

#### Scenario: A project declaring Qwik is claimed

- **WHEN** the manifest declares `@builder.io/qwik`
- **THEN** detection returns one candidate with confidence `high` and evidence of kind `manifest` naming the field and the range

#### Scenario: A project declaring the native runtime is refused

- **WHEN** the manifest declares `react-native`, a `react-native-*` package, or `@symbiote-native/*`
- **THEN** detection returns no candidate at all, and the reason travels on the inspection when the adapter is selected by name

#### Scenario: A project that does not declare Qwik is not claimed

- **WHEN** the manifest does not declare `@builder.io/qwik`
- **THEN** detection returns no candidate

### Requirement: A component is read by the boundary it declares, and the state it uses stays adapter metadata

A unit of kind `component` MUST be produced for a module that declares a Qwik
component boundary. The reactive state a component uses MUST be recorded as
adapter metadata on that unit and MUST NOT become a unit of its own, because
Qwik document `useStore` and `useSignal` inside components rather than in a
module an application imports.

#### Scenario: A module declaring a component boundary is a component unit

- **WHEN** a file declares a component with `component$`
- **THEN** the inspection contains one unit of kind `component` for that file

#### Scenario: State usage is metadata rather than a unit

- **WHEN** that component uses `useStore` or `useSignal`
- **THEN** the unit carries the usage as adapter metadata and the inspection contains no unit of kind `state-module` for the file

### Requirement: The route table is read from the file system rules Qwik City documents

Pages MUST be read from under `src/routes`, with the conventions the framework
documents: a directory name is a URL segment, a directory named in parentheses
does not appear in the path, a trailing `index` names its directory, a bracketed
segment is a parameter and a bracketed segment beginning with an ellipsis is a
rest parameter, an `@name` suffix on a page file selects a named layout and is
not part of the path, and a Markdown file is a page without application code.

#### Scenario: A page names its directory

- **WHEN** the project contains `src/routes/index.tsx` and `src/routes/about/index.tsx`
- **THEN** the routes are `/` and `/about`

#### Scenario: A pathless directory is not in the path

- **WHEN** a page sits under `src/routes/(account)/profile/index.tsx`
- **THEN** its route is `/profile` and the parentheses do not appear in the pattern

#### Scenario: A bracketed segment is a parameter

- **WHEN** the project contains `src/routes/product/[id]/index.tsx`
- **THEN** the route is `/product/:id` with `id` among its parameters

#### Scenario: A rest segment is a parameter

- **WHEN** the project contains `src/routes/docs/[...slug]/index.tsx`
- **THEN** the route is `/docs/:slug` with `slug` among its parameters

#### Scenario: A named layout suffix is not part of the path

- **WHEN** the project contains `src/routes/contact/index@narrow.tsx`
- **THEN** the route is `/contact`

#### Scenario: A Markdown page is a route without application code

- **WHEN** the project contains `src/routes/docs/index.mdx`
- **THEN** the route is `/docs` and there is no unit for the file

### Requirement: Layouts are units of kind layout

A layout file under `src/routes` MUST be reported as a unit of kind `layout`,
because Qwik City document `layout.tsx` and `layout-<name>.tsx` as the contract
that wraps pages, which is the same reason the Next adapter reports one.

#### Scenario: A layout is a unit

- **WHEN** the project contains `src/routes/layout.tsx` and `src/routes/about/layout.tsx`
- **THEN** the inspection contains two units of kind `layout`, one per file

### Requirement: The surface this adapter does not model is reported rather than read as application code

A file under `src/routes` that is not a page, a layout or Markdown MUST be
reported as a finding, because it either runs somewhere other than the browser
or is a convention this adapter does not read. A route rewrite declared in the
Vite config MUST be reported as well, because it changes paths outside the file
system and a route table read only from files would be silently wrong.

#### Scenario: An endpoint is reported and not read

- **WHEN** the project contains `src/routes/api/rows/index.ts`
- **THEN** there is a finding naming the file and no route and no unit for it

#### Scenario: The custom 404 page is reported

- **WHEN** the project contains `src/routes/404.tsx`
- **THEN** there is a finding naming the file and no route for it

#### Scenario: A request plugin is reported

- **WHEN** the project contains `src/routes/plugin.ts` or `src/routes/plugin@auth.ts`
- **THEN** there is a finding naming the file and neither a route nor a unit for it

#### Scenario: A rewritten route is reported

- **WHEN** the Vite config declares `rewriteRoutes`
- **THEN** there is one finding naming the config file and the rewrite, because the file system is not the whole route table

### Requirement: The tested version range is declared

The adapter MUST declare the `@builder.io/qwik` range it has been exercised
against in `testedVersions`, and a project declaring a major outside that range
MUST be reported as a finding rather than treated as supported.

#### Scenario: An untested major is a finding

- **WHEN** the manifest declares a major outside the tested range
- **THEN** the inspection contains a `version-untested` finding naming the declared range and the tested ones

### Requirement: The reading is deterministic and traceable

Two inspections of an unchanged project MUST produce the same fragment, and
every identifier MUST begin with this adapter's id, including for components the
adapter read itself.

#### Scenario: Two inspections agree

- **WHEN** the same project is inspected twice
- **THEN** the two graph fragments are identical

#### Scenario: Identifiers name the adapter

- **WHEN** the graph is built from an inspection
- **THEN** every route, unit, capability and dependency identifier begins with `qwik:`
