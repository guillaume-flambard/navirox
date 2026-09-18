# source-angular Specification

## Purpose
Read an Angular application into the same neutral model the other adapters fill,
so that a framework which assembles an application differently still produces a
comparable readiness report.

## Requirements

### Requirement: Angular detection reports the manifest field it matched

Detection MUST match a project that declares the Angular core package in its
manifest and MUST return evidence naming the manifest file and the field. A
manifest that declares no Angular package MUST yield no candidate and no throw.

#### Scenario: An Angular project is detected with evidence

- **WHEN** detection runs against a project whose manifest declares the Angular core package
- **THEN** the result contains one candidate whose evidence names the manifest file and the dependency field

#### Scenario: A project without Angular yields no candidate

- **WHEN** detection runs against a project whose manifest declares no Angular package
- **THEN** the result contains no candidate and detection does not throw

### Requirement: Decorators decide what a file is

Inspection MUST report a file that declares the component decorator as a component
unit, a file that declares the injectable decorator as a unit, and a file that
declares the pipe decorator as a utility unit. The reading MUST come from the
declaration rather than from the file name.

#### Scenario: A component is reported from its declaration

- **WHEN** a file declares the component decorator
- **THEN** a component unit is reported for it

#### Scenario: A service is reported from its declaration

- **WHEN** a file declares the injectable decorator
- **THEN** a unit is reported for it

#### Scenario: A file name alone decides nothing

- **WHEN** a file is named like a component and declares no component decorator
- **THEN** it is not reported as a component

### Requirement: State is told apart from behaviour by what a service holds

A service that holds reactive state MUST be reported as a state module, and a
service that holds none MUST be reported as a utility. The distinction MUST rest on
what the file declares, and MUST be recorded as evidence.

#### Scenario: A stateful service is a state module

- **WHEN** an injectable file declares reactive state
- **THEN** its unit kind is the state module kind

#### Scenario: A stateless service is a utility

- **WHEN** an injectable file declares no reactive state
- **THEN** its unit kind is the utility kind

### Requirement: Top level routes are read from the routes file

Inspection MUST report one route per top level path literal in a routes file, with
the path as declared, and MUST report nested children and lazy loaded children as
findings rather than resolving them.

#### Scenario: A top level path becomes a route

- **WHEN** a routes file declares a top level path
- **THEN** a route is reported whose pattern is that path

#### Scenario: Nested children are reported and not resolved

- **WHEN** a routes file declares children under a path
- **THEN** a finding names the file and the children produce no route of their own

### Requirement: What the adapter does not model is reported

Inspection MUST report a module declaration, a template that is not inline, and a
construct the scan cannot place as findings naming the file, and MUST NOT invent a
result to fill the gap.

#### Scenario: A module declaration is reported

- **WHEN** a file declares the module decorator
- **THEN** a finding names the file and no unit kind claims to model it

#### Scenario: An external template is reported

- **WHEN** a component points at a template file
- **THEN** the component is still reported and a finding names the template the adapter did not read

### Requirement: The vocabulary is shared with the other adapters

Capability use MUST come from the neutral scan, the dependencies from manifest
reading, and the fragment from the neutral mapper, so that an Angular report is
comparable to a Vue one.

#### Scenario: The same capability is named the same way

- **WHEN** an Angular project and a project of another framework both store to local storage
- **THEN** both reports name the same capability with the same usage kind

#### Scenario: Every node names its source

- **WHEN** a fragment is produced
- **THEN** every identifier begins with this adapter's identifier and every node carries a source location
