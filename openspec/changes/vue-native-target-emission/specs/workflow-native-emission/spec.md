## Purpose

How a target consumes the Workflow IR and emits native source, what it emits, and
how it refuses a screen it does not cover.

## ADDED Requirements

### Requirement: A target emits native source from the Workflow IR

A target package MUST expose a `TargetProvider` whose `emit` turns a `Workflow`
into native source files. It MUST read the IR and MUST NOT import a source
framework, a source adapter or a renderer.

#### Scenario: A generated screen becomes a native file

- **WHEN** `emit` receives a workflow whose screen coverage is `generated`
- **THEN** it returns one native single file component for that screen at a
  deterministic path, built from the screen's view nodes, bindings and actions

#### Scenario: The target imports no source framework

- **WHEN** the target package's imports are checked
- **THEN** no module imports a source framework, a source adapter or the runtime

### Requirement: A screen the lowering did not cover is refused

`emit` MUST refuse any screen whose coverage is not `generated`, returning a
finding and no file for it. It MUST NOT emit a best-effort file for an uncovered
screen.

#### Scenario: A refused screen emits no file

- **WHEN** a screen's coverage kind is `refused`, `manual-required` or `excluded`
- **THEN** `emit` returns a finding naming the screen and emits no file for it

### Requirement: The emission is traceable and deterministic

Each emitted file MUST be accompanied by a manifest naming the IR hash, the target
version, the emitted path and the screen id. The same workflow MUST emit the same
bytes and the same hash.

#### Scenario: Two emissions are identical

- **WHEN** the same workflow is emitted twice
- **THEN** the files and the manifest bytes are identical and hash alike
