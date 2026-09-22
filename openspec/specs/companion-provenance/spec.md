# companion-provenance Specification

## Purpose
Defines how a proof companion application is assembled from traceable origins, so
a reviewer can tell generated output, moved shared units and hand-written files
apart, and no manual replacement passes as generated.

## Requirements

### Requirement: A companion is assembled from named origins

A proof companion application MUST be assembled by one repeatable command. That
command MUST write the target compiler output as the companion's screen and MUST
copy only units the planner classified as portable or shared. Every other file
the companion contains MUST be listed with its origin, and a unit copied from the
source MUST be copied unchanged.

#### Scenario: The companion names where every file came from

- **WHEN** the assembly command runs against a declared fixture
- **THEN** it writes a provenance record in which each file is marked generated, moved with the planner decision that approved it, or manual with its reason

### Requirement: A manual replacement is never concealed

A companion provenance record MUST NOT mark a hand-written screen as generated.
A generated file whose fresh compilation differs from the recorded one MUST fail
the run before anything is built.

#### Scenario: A generated file stops the run when it drifted

- **WHEN** a fresh compilation of the fixture source differs from the recorded generated file
- **THEN** the assembly fails and names the file instead of building a companion that no longer matches its source

### Requirement: The companion builds and is tested before device automation

An assembled companion MUST bundle for every declared platform from its clean
generated output, and deterministic behaviour tests over the moved shared unit
and the generated screen MUST pass before any device automation runs.

#### Scenario: A clean assembly bundles both platforms

- **WHEN** the assembled companion is bundled for its declared platforms
- **THEN** each bundle is produced from the generated output and the deterministic behaviour tests pass
