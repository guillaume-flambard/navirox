# architecture-boundaries Specification

## Purpose

Make the source seam enforceable by a test rather than by convention, the way
the renderer seam already is, so that framework knowledge cannot quietly spread
into the packages that are supposed to stay neutral.

## Requirements

### Requirement: A framework-neutral package does not import a source framework

Every package that provides a framework-neutral capability MUST NOT import a
package belonging to a source framework. The set of framework packages is
declared in one place, so adding a framework to it is a data change rather than
a rewrite of the check.

#### Scenario: A neutral package that names a framework fails the check

- **WHEN** a neutral package's source imports a package belonging to a source framework
- **THEN** the check fails and names the offending file and the line that imports it

#### Scenario: A source adapter may import the framework it implements

- **WHEN** a source adapter package imports the framework it addresses
- **THEN** the check passes for that package

#### Scenario: The check reads source and not build output

- **WHEN** the check scans the workspace
- **THEN** it reads TypeScript source, and it ignores `node_modules` and build output so a declaration file cannot be mistaken for a breach

### Requirement: A source adapter does not import a target provider

A source adapter MUST NOT import a target provider. A target provider MUST NOT
import a source adapter. The two planes meet through the graph, not through
imports.

#### Scenario: An adapter importing a target provider fails the check

- **WHEN** a source adapter's source imports a target provider package
- **THEN** the check fails and names the offending file

### Requirement: The boundary check cannot pass on a stale result

The boundary check reads files outside the package it lives in. Running the
test suite MUST NOT be able to serve a previous successful result for it when
one of the files it reads has changed.

#### Scenario: A change anywhere in the scanned sources invalidates the result

- **WHEN** any scanned source file changes
- **THEN** the boundary check runs again rather than being reported as a cached success

### Requirement: The renderer boundary is preserved

The existing rule that exactly one package names the renderer MUST remain in
force and MUST remain covered by its own check.

#### Scenario: The renderer rule still holds after the source seam exists

- **WHEN** the test suite runs
- **THEN** the check that only the runtime provider package names the renderer still runs and still passes
