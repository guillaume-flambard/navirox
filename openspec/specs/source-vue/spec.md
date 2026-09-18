# source-vue Specification

## Purpose
Define what the Vue source adapter inspects and how it reports what it can and
cannot see, so that a Vue project produces a traceable, framework-neutral
inspection instead of framework-specific tooling.

## Requirements

### Requirement: Vue detection reports the manifest field it matched

Detection MUST match a Vue project by a Vue dependency declared in its
manifest, and MUST return at least one evidence entry naming the manifest file
and the field the match came from. When the manifest is missing or declares no
Vue dependency, detection MUST return no candidate and MUST NOT throw.

#### Scenario: A Vue project is detected with evidence

- **WHEN** detection runs against a project whose manifest declares a Vue dependency
- **THEN** the result contains one candidate whose evidence names the manifest file and the dependency field

#### Scenario: A project without a manifest yields no candidate

- **WHEN** detection runs against a directory with no readable manifest
- **THEN** the result contains no candidate and inspection does not start

### Requirement: Single file components become units with a source location

Inspection MUST discover every Vue single file component in the project,
excluding dependency and build output directories, and MUST report each one as a
unit whose source location names its file. The component's framework specific
detail, such as which script or style blocks it declares, MAY be carried as
adapter owned metadata and MUST NOT become a shared graph concept.

#### Scenario: Every component is reported once

- **WHEN** inspection runs against a project with several single file components
- **THEN** each component appears exactly once as a unit, with a source location naming the file it came from

#### Scenario: Framework detail stays adapter metadata

- **WHEN** a component declares a script setup block
- **THEN** that fact is visible as adapter owned metadata on the unit and no shared graph type mentions Vue

### Requirement: Store modules are reported as state modules

Inspection MUST report a module that declares a store as a state module unit,
and MUST record the evidence that led to that reading. A module that merely
imports the state library without declaring a store MUST NOT be reported as one.

#### Scenario: A store declaration is reported

- **WHEN** inspection reads a module that declares a store
- **THEN** the unit for that module has the state module kind and carries evidence naming the file and line

#### Scenario: An import alone is not a store

- **WHEN** inspection reads a module that imports the state library without declaring a store
- **THEN** that module is not reported as a state module

### Requirement: Browser capability use is reported with its usage kind

Inspection MUST report the browser capabilities the project uses, drawn from a
declared set (local storage, session storage, geolocation, clipboard, share,
notifications, file reading, canvas rendering, timers, animation frames, DOM
access, URL navigation, network state). Each reported use MUST name the file it
came from and MUST classify the use as read, write, invoke, render or unknown.
A use the adapter cannot classify MUST be reported as unknown and MUST NOT be
guessed.

#### Scenario: A capability use names its source and kind

- **WHEN** inspection reads a module that writes to local storage
- **THEN** a capability use is reported naming that file, the local storage capability, and the write kind

#### Scenario: An unclassifiable use is unknown

- **WHEN** inspection reads a call into a declared capability whose direction it cannot determine
- **THEN** the use is reported with the unknown kind

### Requirement: Manifest dependencies are reported without a verdict

Inspection MUST report each production dependency of the manifest as a
dependency node with its declared version range. It MUST NOT classify a
dependency as portable, adaptable or replaceable, because classification belongs
to the compatibility and planning layers and no compatibility facts exist yet.

#### Scenario: Dependencies are listed as declared

- **WHEN** inspection reads a manifest with production dependencies
- **THEN** each dependency is reported with the version range the manifest declares and no classification

### Requirement: What cannot be inspected is reported as a finding

Inspection MUST complete on a partial project. It MUST report a missing router,
a router it does not extract routes from, a file its parser rejects, and a
construct it does not model as findings, and it MUST NOT invent a result to fill
the gap. Route extent MUST NOT be inferred from a directory convention.

#### Scenario: A rejected file leaves the inspection standing

- **WHEN** inspection meets a component its parser rejects
- **THEN** inspection completes, the failure is reported as a finding naming the file, and the remaining components are still reported

#### Scenario: Routes are not inferred from a convention

- **WHEN** inspection runs against a project with a views directory and no extracted router
- **THEN** no route node is produced and a finding states that routes were not extracted

### Requirement: The fragment is deterministic and traceable

Two inspections of an unchanged project MUST produce the same node identifiers,
each identifier MUST begin with the adapter identifier, and every node MUST
carry a source location. An adapter that cannot attribute a fact to a file MUST
report it as a finding instead of as a node.

#### Scenario: Repeated inspection produces the same identifiers

- **WHEN** inspection runs twice against an unchanged project
- **THEN** the two fragments contain the same node identifiers

#### Scenario: Every node names its source

- **WHEN** a fragment is produced
- **THEN** every node's identifier begins with the adapter identifier and every node carries a source location naming a file

### Requirement: The adapter never reaches the target side

The Vue adapter MUST NOT import a target provider or a runtime package. It
produces an inspection and a graph fragment, and the plans meet at the graph.

#### Scenario: The adapter imports only its own side

- **WHEN** the adapter package declares its dependencies
- **THEN** it declares no target provider and no runtime package, and the framework boundary check reports no violation

### Requirement: The tested version range is enforced

The adapter MUST declare the Vue version range it was tested against. A project
whose declared Vue version falls outside that range MUST produce a finding, and
the adapter MUST NOT claim support for the version.

#### Scenario: An untested major is reported

- **WHEN** inspection runs against a project declaring a Vue major outside the declared tested range
- **THEN** a finding reports the version as untested and no support is claimed for it
