# source-astro Specification

## Purpose
Read an Astro project as one repository containing several UI frameworks: its
pages and routes, the parts that run on the server, and the islands whose
components belong to the adapters that already know how to read them.

## Requirements

### Requirement: Astro is detected from its manifest, and a project aimed at the native runtime is refused

The Astro adapter SHALL report a candidate only for a project that declares the
`astro` package, and SHALL report no candidate for a project that declares the
native runtime, because a project already aimed at the native surface is what
Navirox produces rather than what it reads.

#### Scenario: A project that declares Astro

- **WHEN** the manifest declares `astro` in its dependencies
- **THEN** the adapter reports one candidate at high confidence whose evidence
  names the manifest and the declared range

#### Scenario: A project that declares the native runtime

- **WHEN** the manifest declares `react-native`, a `react-native-*` package or a
  `@symbiote-native/*` package
- **THEN** the adapter reports no candidate, and the reason travels on the
  inspection when the adapter is chosen by name rather than by detection

#### Scenario: A project without Astro

- **WHEN** a project declares `vue` and does not declare `astro`
- **THEN** the Astro adapter reports no candidate and the Vue adapter keeps the
  project

### Requirement: The Astro adapter composes the island adapters, and selection prefers it

The adapter SHALL declare `vue`, `react` and `svelte` as the adapters it
composes, so that a project containing Astro and one of its island frameworks is
read by the Astro adapter, and so that no framework name has to appear in the
registry for that preference to hold.

#### Scenario: A project with an island framework

- **WHEN** a project declares both `astro` and `vue`
- **THEN** selection returns the Astro adapter, and the Vue adapter is not
  selected, because it is composed by a more specific candidate

#### Scenario: A framework the adapter does not compose

- **WHEN** a project declares an Astro integration for a framework Navirox has
  no adapter for
- **THEN** the Astro adapter is still selected and reports a finding naming the
  integration, rather than reading those components with an adapter that does
  not know the framework

### Requirement: Pages and routes are read from `src/pages`

The adapter SHALL derive routes from the file layout of `src/pages`, which is a
documented contract of the framework, and SHALL report an `.astro` file outside
`src/pages` as a component rather than a layout, because Astro's documentation
states that a layout is a convention for a component rather than a framework
contract.

#### Scenario: Static pages

- **WHEN** a project contains `src/pages/index.astro` and
  `src/pages/about/me.astro`
- **THEN** the route set contains `/` and `/about/me`

#### Scenario: A directory index

- **WHEN** a project contains `src/pages/about/index.astro`
- **THEN** the route is `/about`, the directory the file names

#### Scenario: Dynamic segments

- **WHEN** a page file is `src/pages/blog/[slug].astro`
- **THEN** the route is `/blog/:slug` and `slug` is reported as a parameter

#### Scenario: A rest parameter

- **WHEN** a page file is `src/pages/sequences/[...path].astro`
- **THEN** the route is `/sequences/:path` and `path` is reported as a parameter

#### Scenario: Several parameters in one segment

- **WHEN** a page file is `src/pages/[lang]-[version]/info.astro`
- **THEN** the route is `/:lang-:version/info` and both `lang` and `version` are
  reported as parameters

#### Scenario: An underscore excludes a page

- **WHEN** a file or a directory under `src/pages` is prefixed with an
  underscore
- **THEN** it produces no route, because the framework excludes it from the
  router

#### Scenario: A prose page

- **WHEN** `src/pages/posts/1.md` exists
- **THEN** the route `/posts/1` is reported with no unit, because prose is a page
  and not code this tool reads

#### Scenario: Two files for one pattern

- **WHEN** two page files produce the same path pattern
- **THEN** the adapter keeps one route deterministically and reports a finding
  naming both files

### Requirement: The server surface is reported rather than read as application code

The adapter SHALL report endpoints, middleware and build configuration as
findings, and SHALL NOT report them as units or as routes, because those files
do not run in the application the migration targets.

#### Scenario: An endpoint

- **WHEN** `src/pages/api/rows.ts` exists
- **THEN** a finding names it as an endpoint and no route and no unit are
  produced for it

#### Scenario: Middleware

- **WHEN** `src/middleware.ts` exists at the source root
- **THEN** a finding names it and no unit is produced for it

#### Scenario: Build configuration

- **WHEN** `astro.config.mjs` exists
- **THEN** a finding names it as configuration that was not read as application
  code

### Requirement: Islands are identified, and their components are read by the adapter of their framework

The adapter SHALL read hydration directives from `.astro` files, record each
hydrated island in the metadata of the file that carries it, and hand the
component behind the island to the adapter of its framework, because a
framework component used inside Astro is that framework's own code.

#### Scenario: A hydrated island

- **WHEN** an `.astro` file writes a `client:*` directive on an imported
  framework component
- **THEN** the unit for that file records the island with the component name and
  the directive in its metadata

#### Scenario: The component behind an island

- **WHEN** the island's component is a project file whose framework is composed
  and declared by the project
- **THEN** that adapter reads the file and its components appear in the same
  fragment, with ids that begin with `astro:`

#### Scenario: An island that cannot be attributed

- **WHEN** a hydration directive names a component that does not resolve to a
  file in the project
- **THEN** a finding says the island was seen and could not be attributed,
  rather than the adapter guessing at its framework

#### Scenario: A directive on an Astro component

- **WHEN** a hydration directive is written on a component that resolves to a
  project `.astro` file
- **THEN** a finding reports it, because Astro rejects hydrating an Astro
  component

### Requirement: The fragment is attributed to the Astro adapter, and findings keep their author

Every node the adapter reports SHALL carry an id that begins with the adapter's
own id, including the nodes produced from files another adapter read. A finding
SHALL keep the id of the adapter that made it, because a finding is a claim and
the claimant is part of the claim.

#### Scenario: Nodes read by another adapter

- **WHEN** an island component is read by the Vue adapter
- **THEN** the unit that reaches the graph has an id beginning with `astro:` and
  a source location naming the file and the Astro adapter

#### Scenario: A finding another adapter made

- **WHEN** a delegated adapter reports a finding about a file the project shares
- **THEN** that finding keeps its original id, so that two adapters cannot
  produce the same id for the same code and the same file

### Requirement: The reading is deterministic, traceable and version aware

The adapter SHALL produce the same inspection for an unchanged project, SHALL
attach a source location to every node it reports, and SHALL report a finding
when the declared Astro major is outside the range it declares as tested.

#### Scenario: Determinism

- **WHEN** the same project is inspected twice
- **THEN** the two inspections are equal

#### Scenario: Traceability

- **WHEN** a node is reported
- **THEN** its source location names a file and the Astro adapter

#### Scenario: An untested major

- **WHEN** the manifest declares an Astro major outside the tested range
- **THEN** a finding reports it and the project is not treated as supported
