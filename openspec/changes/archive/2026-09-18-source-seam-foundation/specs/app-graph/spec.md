## Purpose

Define the minimal, versioned, framework-neutral model of a web application
that inspection produces, so that compatibility and migration planning can
reason about an application without knowing which framework it was written in.

## ADDED Requirements

### Requirement: The graph is versioned

Every graph MUST carry a `schemaVersion`. A consumer MUST be able to reject or
migrate a graph whose version it does not understand.

#### Scenario: A produced graph states its schema version

- **WHEN** an adapter produces an application graph
- **THEN** the graph carries a schema version, and the version is the only field a consumer needs to decide whether it can read the graph

### Requirement: Node identity is stable and derived from the source

Node ids MUST be derived from the adapter id, the normalized source path and a
semantic key, following the documented pattern. Re-inspecting an unchanged
project MUST produce the same ids. Randomly generated identifiers MUST NOT be
used for nodes derived from source.

#### Scenario: Two inspections of unchanged source produce identical ids

- **WHEN** the same project is inspected twice with no file changes
- **THEN** the two graphs contain the same node ids

#### Scenario: An id names the adapter that produced it

- **WHEN** a node is read
- **THEN** its id begins with the id of the adapter that produced it

#### Scenario: Paths are normalized before they enter an id

- **WHEN** the same file is reached through a different but equivalent path spelling
- **THEN** the resulting node id is the same

### Requirement: Every node is traceable to its source

Every node MUST carry a source location naming the file it came from and the
adapter that produced it. A node whose origin cannot be established MUST be
recorded as a finding instead of entering the graph untraceable.

#### Scenario: A node names its file and adapter

- **WHEN** a node derived from a file is read
- **THEN** its source location names that file and the adapter id

#### Scenario: An untraceable node becomes a finding

- **WHEN** a fact cannot be attributed to a file
- **THEN** the graph records a finding about it and does not carry it as a plain node

### Requirement: Findings carry evidence of a known kind

A finding MUST carry a severity from `info`, `warning` or `error`, and at least
one evidence entry. An evidence entry's kind MUST come from the closed set
`source`, `manifest`, `compiler`, `compat-registry`, `build`, `fixture`,
`user-override`.

#### Scenario: A finding names its evidence

- **WHEN** a finding is produced
- **THEN** it carries at least one evidence entry whose kind is one of the declared kinds

#### Scenario: A finding can be raised without a source location

- **WHEN** a finding concerns the project as a whole rather than one file
- **THEN** the finding is still valid and its evidence carries the observable fact it rests on

### Requirement: The model stays minimal and framework neutral

The graph MUST model migration-relevant semantics only. A framework construct
such as a directive, decorator, hook, signal or template node MUST NOT become a
graph concept; if an adapter needs to carry one, it MUST keep it as adapter
owned metadata.

#### Scenario: A framework construct stays adapter metadata

- **WHEN** an adapter needs to record something specific to its framework
- **THEN** it records it in node metadata, and no new node kind or shared field is added to the graph for it

#### Scenario: A new graph concept requires a demonstrated need

- **WHEN** a concept is proposed for the shared graph
- **THEN** it is admitted only if a second adapter needs it, or a migration or target decision consumes it, or a user-visible tool decision depends on it

### Requirement: Capability usage is modelled without a framework dependency

The graph MUST be able to record platform and browser capability usage,
including what the application does with the capability, using a usage value
from `read`, `write`, `invoke`, `render`, `unknown`.

#### Scenario: Capability usage records the kind of use

- **WHEN** an application reads from and writes to a platform capability
- **THEN** the graph records capability nodes whose usage values distinguish the read from the write

#### Scenario: An unrecognised capability use is recorded as unknown

- **WHEN** an adapter sees a capability it cannot classify
- **THEN** it records the usage as `unknown` instead of guessing
