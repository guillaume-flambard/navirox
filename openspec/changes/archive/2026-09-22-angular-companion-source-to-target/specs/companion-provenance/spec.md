## MODIFIED Requirements

### Requirement: A companion is assembled from named origins

A proof companion application MUST be assembled by one repeatable command. When the
journey has a target compiler, that command MUST write the target compiler output as the
companion's screen. When the journey has no target compiler, the command MUST write a
named manual screen instead and MUST NOT record that screen as generated. The command
MUST copy only units the planner classified as portable or shared, and a unit copied
from the source MUST be copied unchanged. Every other file the companion contains MUST
be listed with its origin.

#### Scenario: The companion names where every file came from

- **WHEN** the assembly command runs against a declared fixture
- **THEN** it writes a provenance record in which each file is marked generated, moved with the planner decision that approved it, or manual with its reason

#### Scenario: A journey without a target compiler names its screen as manual

- **WHEN** the journey has no target compiler
- **THEN** the assembly records the screen as manual with its reason and marks no file generated

### Requirement: The companion builds and is tested before device automation

An assembled companion MUST bundle for every declared platform, from its clean generated
output when a target compiler produced the screen and from the recorded manual screen
when it did not, and deterministic behaviour tests over the moved shared unit MUST pass
before any device automation runs.

#### Scenario: A clean assembly bundles both platforms

- **WHEN** the assembled companion is bundled for its declared platforms
- **THEN** each bundle is produced from the generated output and the deterministic behaviour tests pass

#### Scenario: A companion without generated output still builds

- **WHEN** the journey has no target compiler and the assembled companion is bundled for its declared platforms
- **THEN** each bundle is produced from the recorded manual screen and the deterministic behaviour tests pass
