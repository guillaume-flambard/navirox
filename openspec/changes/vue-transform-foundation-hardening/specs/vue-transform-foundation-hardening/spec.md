## Purpose

The Vue T2 foundation hardening makes generated workflow values and incomplete runs explicit before the next Vue profiles are allowed to build on the transform seam.

## ADDED Requirements

### Requirement: An incomplete generated workflow is refused atomically

If any screen has coverage other than `generated`, the transform result MUST be `ok=false`, MUST list the refusal, and MUST leave the output directory unchanged, including when an explicit write was requested.

#### Scenario: One refused screen prevents every workspace write

- **WHEN** lowering generates one screen and refuses another
- **THEN** the result is `ok=false`, both refusal findings are present, and no generated file or manifest is written

### Requirement: Literal and expression values remain distinguishable

A workflow binding MUST record whether its value is a literal or an expression. A target MUST preserve a literal as literal text and an expression as an expression, without evaluating or interpolating the literal.

#### Scenario: Literal text remains literal

- **WHEN** a source screen contains the literal text `Hello world`
- **THEN** the generated text contains `Hello world` as literal content and does not contain `{{ Hello world }}`

### Requirement: Target package metadata preserves the seam

A target package MUST NOT declare a dependency or project reference on `@memolabs-apps/source` or a source adapter, and a static package-metadata check MUST fail when it does.

#### Scenario: A target cannot depend on the source side

- **WHEN** the target package manifest and TypeScript references are inspected
- **THEN** neither names a source package and the boundary check reports no violation

### Requirement: Reproduction commands are honest

A generated workspace manifest MUST list a reproduction command only when the generated package exposes that command; an unavailable native command MUST be absent or recorded as unavailable.

#### Scenario: A compiler-only workspace does not claim native builds

- **WHEN** the generated workspace exposes only its SFC verification script
- **THEN** its manifest does not claim that native iOS or Android build commands are available
