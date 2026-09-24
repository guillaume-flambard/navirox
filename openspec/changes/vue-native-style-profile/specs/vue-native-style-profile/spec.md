## Purpose

This capability preserves the source style contract needed by a supported Vue view while explicitly separating portable declarations, source-rewritten selectors and platform-specific visual decisions.

## ADDED Requirements

### Requirement: Declared style facts are attributed to source

A supported style block, declared token, class selector and source location MUST enter the workflow as neutral style facts with evidence and without embedding Vue or target CSS APIs.

#### Scenario: A declared class enters the workflow

- **WHEN** a source view declares a class rule
- **THEN** the workflow records the class, declarations, source location and evidence

### Requirement: The native style profile is explicit and deterministic

The target MUST receive an explicit style profile that defines its supported selector, layout, typography, color and media features. A generated workspace MUST select one recorded profile and render the same declared values on repeated builds.

#### Scenario: One style profile is recorded and applied

- **WHEN** a supported source view is emitted
- **THEN** the manifest names the exact style profile and repeated output is identical

### Requirement: Rewritten selectors carry provenance

When a source-scoped selector must be rewritten for native output, the workflow MUST name the original selector, rewritten selector, reason and source location.

#### Scenario: A scoped selector rewrite is explainable

- **WHEN** a supported source-scoped selector is rewritten
- **THEN** the style record names both selectors and the rewrite reason

### Requirement: Unsupported visual behavior is refused

A dynamic style binding, unresolved selector, unsupported pseudo-state, unsupported media feature or platform-specific target rule MUST produce a source-located finding and MUST NOT be silently dropped.

#### Scenario: A pseudo-state is refused

- **WHEN** a source style uses an unsupported hover pseudo-state
- **THEN** lowering returns a style refusal and emits no partial style profile for that screen

### Requirement: Style output is atomic with the screen

A screen with a style refusal MUST block the whole transform and leave the output directory intact, consistent with the strict transform contract.

#### Scenario: One refused style blocks the write

- **WHEN** a multi-screen run contains one refused style
- **THEN** the result is `ok=false` and no generated screen or style file is written
