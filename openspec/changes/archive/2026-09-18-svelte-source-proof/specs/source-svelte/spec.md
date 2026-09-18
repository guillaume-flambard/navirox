## Purpose

Define what the Svelte source adapter inspects, so that a second framework
produces the same kind of reading as the first and the neutral core is proven to
be neutral rather than Vue shaped.

## ADDED Requirements

### Requirement: Svelte detection reports the manifest field it matched

Detection MUST match a Svelte project by a Svelte dependency declared in its
manifest and MUST return evidence naming the manifest file and the field. A
manifest that declares no Svelte dependency MUST yield no candidate and no throw.

#### Scenario: A Svelte project is detected with evidence

- **WHEN** detection runs against a project whose manifest declares a Svelte dependency
- **THEN** the result contains one candidate whose evidence names the manifest file and the dependency field

#### Scenario: A project without Svelte yields no candidate

- **WHEN** detection runs against a project whose manifest declares no Svelte dependency
- **THEN** the result contains no candidate and detection does not throw

### Requirement: Components become units with a source location

Inspection MUST discover every `.svelte` file outside dependency and build
output directories and report each as a component unit whose source location
names its file. Svelte specific detail MUST stay in adapter owned metadata.

#### Scenario: Every component is reported once

- **WHEN** inspection runs against a project with several Svelte components
- **THEN** each component appears exactly once as a unit with a source location naming its file

#### Scenario: Framework detail does not reach the shared model

- **WHEN** a component declares a script block
- **THEN** that fact is adapter owned metadata and no shared graph type mentions Svelte

### Requirement: Store modules are reported as state modules

Inspection MUST report a module that declares a Svelte store as a state module
with evidence, and MUST NOT report a module that only imports the store helpers
without declaring one.

#### Scenario: A store declaration is reported

- **WHEN** inspection reads a module that calls a Svelte store constructor
- **THEN** the unit for that module has the state module kind and carries evidence naming the file and line

#### Scenario: An import alone is not a store

- **WHEN** inspection reads a module that imports the store helpers without declaring a store
- **THEN** that module is not reported as a state module

### Requirement: Browser capability use comes from the shared neutral scan

Capability use MUST be reported through the pattern scan the neutral package
owns, so that the same source text yields the same capabilities and usage kinds
regardless of which adapter read it. The adapter MUST NOT carry its own copy of
the pattern set.

#### Scenario: Two adapters agree on the same text

- **WHEN** the same source text is read through the neutral scan
- **THEN** both adapters report the same capabilities, usage kinds and line numbers

#### Scenario: An unclassifiable use is unknown

- **WHEN** a capability use cannot be given a direction
- **THEN** it is reported with the unknown kind

### Requirement: What cannot be inspected is reported as a finding

Inspection MUST complete on a partial project and MUST report an unparseable
component, an unmodelled construct and a route set it does not own as findings.
It MUST NOT invent a result to fill a gap. Svelte 4 syntax MUST be reported as a
finding rather than being read as if it were Svelte 5.

#### Scenario: A rejected component leaves the inspection standing

- **WHEN** inspection meets a component the Svelte compiler rejects
- **THEN** inspection completes, the failure is a finding naming the file, and the remaining components are still reported

#### Scenario: An untested major is reported

- **WHEN** a project declares a Svelte major outside the adapter's tested range
- **THEN** a finding reports it and no support is claimed for that version

### Requirement: The fragment is deterministic and traceable

Two inspections of an unchanged project MUST produce the same identifiers, every
identifier MUST begin with the adapter identifier, and every node MUST carry a
source location.

#### Scenario: Repeated inspection produces the same identifiers

- **WHEN** inspection runs twice against an unchanged project
- **THEN** both fragments contain the same node identifiers

#### Scenario: Every node names its source

- **WHEN** a fragment is produced
- **THEN** every identifier begins with the adapter identifier and every node carries a source location naming a file
