# vue-target-provenance Specification

## Purpose
Keep generated output traceable back to its input. The Vue target MUST emit a
deterministic provenance manifest for every fully supported generated screen, and
the manifest MUST identify the input, output path, compiler version and source
location of each generated view node, so that a reviewer can tell which part of a
generated application came from the analysed source and which part was added.

## Requirements

### Requirement: Generated Vue target output carries provenance

The Vue target SHALL emit a deterministic provenance manifest for every fully
supported generated screen. The manifest MUST identify the input, output path,
compiler version and source location of each generated view node.

#### Scenario: A supported screen produces source and provenance

- **WHEN** the target compiler receives a fully supported Vue screen
- **THEN** it returns generated source and a manifest that names every generated node's source location

#### Scenario: An unsupported screen produces no misleading output

- **WHEN** the target compiler finds an unsupported template or style construct
- **THEN** it returns findings and no generated screen path or generated source

### Requirement: The runnable fixture consumes compiler output

The native fixture MUST consume the exact source that the Vue target compiler
emitted for its web fixture input.

#### Scenario: Generated source is not replaced manually

- **WHEN** the fixture's generated screen is checked against a fresh compilation
- **THEN** its source and provenance hash match the compiler output
