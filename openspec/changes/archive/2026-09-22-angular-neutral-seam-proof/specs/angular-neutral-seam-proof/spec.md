# Angular neutral seam proof Specification

## ADDED Requirements

### Requirement: The Angular companion has a traceable neutral seam path

An Angular proof companion MUST trace at least one declared workflow input from
an immutable Angular source through `source-angular` and a neutral inspection,
planning, or migration output into the companion's behavior.

#### Scenario: The Angular proof runs its workflow

- **WHEN** the companion executes its declared workflow
- **THEN** its evidence identifies the source finding and neutral output that informed or supplied the behavior

### Requirement: Manual native work remains distinct

The Angular proof MUST record every manual native replacement and MUST NOT
describe it as generated from Angular templates or as generic Angular conversion.

#### Scenario: A workflow screen is manually implemented

- **WHEN** the companion uses a hand-written native screen
- **THEN** the provenance record names it as manual work and states why the source path did not emit it

### Requirement: The proof preserves both seams

The Angular proof MUST keep Angular imports in the source adapter boundary and
MUST keep target-provider imports out of that adapter and neutral packages.

#### Scenario: An import boundary regresses

- **WHEN** Angular or target-provider knowledge is introduced on the wrong side of a seam
- **THEN** an architecture-boundary test fails before the proof can be accepted
