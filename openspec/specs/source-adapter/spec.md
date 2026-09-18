# source-adapter Specification

## Purpose

Define the contract through which Navirox addresses a web source framework, and
the registry the tooling discovers those implementations with, so that adding a
framework means implementing a contract instead of branching the core.

## Requirements

### Requirement: An adapter declares its identity and support level

Every source adapter MUST expose a stable `id`, a human readable `displayName`,
and a declared `supportLevel` drawn from the closed set `experimental`,
`preview`, `supported`, `production`. The `id` MUST be the value that appears as
the first segment of every graph node id the adapter produces.

#### Scenario: A registered adapter is discoverable by its id

- **WHEN** an adapter is registered and a consumer asks the registry for its id
- **THEN** the registry returns that adapter

#### Scenario: The support level is one of the declared values

- **WHEN** an adapter is constructed
- **THEN** its support level is one of `experimental`, `preview`, `supported`, `production`, and an adapter cannot claim a level it does not declare

### Requirement: Detection reports every matching candidate with evidence

`detect` MUST return zero or more candidates. Each candidate MUST carry the
detection's confidence and at least one evidence entry naming the file or
manifest field the match came from. Detection MUST be able to report more than
one candidate for a single project, because a project built on a meta-framework
matches both the meta-framework and the framework it composes.

#### Scenario: A project matching one framework yields one candidate

- **WHEN** detection runs against a project whose manifest declares a single supported framework
- **THEN** the result contains one candidate for that framework, with at least one evidence entry

#### Scenario: A project matching a meta-framework yields two candidates

- **WHEN** detection runs against a project whose manifest declares a meta-framework built on a base framework
- **THEN** the result contains a candidate for the meta-framework and a candidate for the base framework

#### Scenario: Detection of an unsupported project yields no candidate and no error

- **WHEN** detection runs against a project that declares no supported framework
- **THEN** the result contains no candidate and detection reports an explicit no-match rather than throwing

### Requirement: Selection prefers the most specific adapter

When more than one candidate matches, selection MUST prefer the most specific
adapter, which is the meta-framework over the framework it composes. A
meta-framework adapter MAY compose the base adapter rather than reimplement it.

#### Scenario: The meta-framework adapter wins over its base adapter

- **WHEN** selection runs with both a meta-framework candidate and its base framework candidate present
- **THEN** the meta-framework adapter is selected

#### Scenario: No candidate produces an explicit outcome

- **WHEN** selection runs with no candidate
- **THEN** the outcome names the absence of a supported adapter and does not fall back to a default adapter

### Requirement: The contract is semantic and not parser specific

The adapter contract MUST be limited to semantic operations: detection,
inspection, graph construction and declared capabilities. Parsing and compiling
operations belong to the implementation and MUST NOT appear on the contract.

#### Scenario: The contract shape is unchanged by a new parser

- **WHEN** an adapter parses its framework with the framework's own compiler instead of a hand written parser
- **THEN** the operations the core calls on it are the same operations it called before, and the core imports nothing from that framework

### Requirement: Unsupported input produces findings rather than failures

Inspection MUST complete on a partial project, and MUST convert syntax,
dependency or capability it does not understand into findings or explicit
unknown results. It MUST NOT crash and MUST NOT report unsupported input as if
it were handled.

#### Scenario: A partial project still produces an inspection

- **WHEN** inspection runs against a project with files missing and dependencies absent
- **THEN** inspection completes and reports the gaps as findings

#### Scenario: An unknown construct is reported as unknown

- **WHEN** inspection meets a construct the adapter does not model
- **THEN** the result contains an explicit unknown entry for it and no classification is invented

### Requirement: The registry is deterministic and grows without core changes

Listing adapters MUST return a deterministic order regardless of registration
order. Registering a new adapter MUST NOT require a change to any generic
package.

#### Scenario: Listing does not depend on registration order

- **WHEN** the same two adapters are registered in either order
- **THEN** the registry lists them in the same order both times

#### Scenario: A new adapter is added without editing generic code

- **WHEN** a new adapter package is registered at the composition root
- **THEN** no generic package is modified to accommodate it

### Requirement: An adapter declares the versions it was tested against

An adapter MUST be able to declare the source framework version ranges it was
tested with. A version outside the declared range MUST be reported as a finding
and MUST NOT be treated as supported.

#### Scenario: An untested major is reported rather than assumed

- **WHEN** a project uses a source framework major outside the adapter's declared tested range
- **THEN** inspection reports it as a finding and the adapter does not claim support for it
