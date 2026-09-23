## Purpose

A command that converts the screens a target provider fully supports, records
their provenance, refuses the rest with findings, and writes only inside the
output directory.

## ADDED Requirements

### Requirement: Screen conversion is explicit

The convert command MUST perform a dry run by default and MUST write only when
the caller asks for it.

#### Scenario: A dry run writes nothing

- **WHEN** the command runs without the write flag
- **THEN** it reports the screens it would emit and writes no file

### Requirement: Only fully supported screens are emitted

The command MUST emit a screen only when the target provider returns generated
source for it, and MUST NOT write a partial screen when the provider reports
findings.

#### Scenario: A supported screen is emitted

- **WHEN** the provider returns generated source for a screen
- **THEN** the command writes that source inside the output directory

#### Scenario: An unsupported screen is refused

- **WHEN** the provider returns findings and no source for a screen
- **THEN** the command writes nothing for that screen and reports the findings

### Requirement: Every emitted screen carries provenance

The command MUST write, for every emitted screen, a provenance record that
identifies the input, the output path and the compiler version.

#### Scenario: Provenance beside the screen

- **WHEN** a screen is emitted
- **THEN** a provenance record naming its input, output path and compiler version
  is written

### Requirement: The moved units are unchanged

The command MUST move only the units the plan classified shared or portable, and
MUST move them unchanged.

#### Scenario: A shared unit moves unchanged

- **WHEN** the plan classifies a unit shared or portable
- **THEN** the command copies its bytes unchanged

### Requirement: Refused work is reported

The command MUST report every screen it refused and the finding that caused it,
and MUST NOT present a refused screen as converted.

#### Scenario: A refused screen appears in the report

- **WHEN** a screen is refused
- **THEN** the report names the screen and its findings

### Requirement: The command writes only inside the output directory

The command MUST refuse to write outside the output directory it was given.

#### Scenario: A path outside the output directory

- **WHEN** an emitted screen would resolve outside the output directory
- **THEN** the command refuses and writes nothing
