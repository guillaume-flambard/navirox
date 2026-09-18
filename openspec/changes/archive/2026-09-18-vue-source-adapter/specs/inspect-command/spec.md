## Purpose

Define how the tooling turns a project directory into a native readiness
inspection: one neutral pipeline, one versioned report, and one command that
selects an adapter without any generic package knowing a framework.

## ADDED Requirements

### Requirement: Inspection selects an adapter through the registry

Inspection MUST resolve the source adapter through the adapter registry, using
detection and the most specific selection rule. It MUST NOT fall back to a
default adapter when detection finds nothing, and it MUST report the absence of
a supported adapter as an explicit outcome that names the directory inspected.

#### Scenario: A supported project selects its adapter

- **WHEN** inspection runs against a project whose manifest matches a registered adapter
- **THEN** the report names that adapter as the source

#### Scenario: An unsupported project fails explicitly

- **WHEN** inspection runs against a project that matches no registered adapter
- **THEN** the outcome states that no supported source adapter was detected and no inspection is produced

### Requirement: The framework can be named explicitly

Inspection MUST accept an adapter identifier that bypasses detection. An
identifier that is not registered MUST fail with an outcome that names it and
lists the registered identifiers.

#### Scenario: Naming the adapter skips detection

- **WHEN** inspection runs with a registered adapter identifier
- **THEN** that adapter is used even if detection would have selected another

#### Scenario: An unknown identifier lists what exists

- **WHEN** inspection runs with an unregistered adapter identifier
- **THEN** the outcome names the identifier and lists the registered ones

### Requirement: The report is versioned and available in two forms

The report MUST carry a schema version and describe the inspected project
without requiring the reader to parse prose. The machine form MUST be a single
JSON document. The human form MUST answer, in order: what project was
inspected, which adapter read it, what was found, what could not be determined,
and what the user can do next.

#### Scenario: Machine output is one versioned document

- **WHEN** inspection runs in machine form
- **THEN** the output is a single JSON document whose schema version is present

#### Scenario: Human output answers the inspection questions

- **WHEN** inspection runs in human form
- **THEN** the output names the project, the adapter, the findings, and the next step

### Requirement: Findings are reported, and only absence is a failure

A completed inspection MUST succeed even when it produced findings, including
findings of error severity. Inspection MUST fail when no adapter could be
selected, when the adapter identifier is unknown, or when the adapter itself
throws despite the contract requiring it not to.

#### Scenario: Findings do not fail the command

- **WHEN** inspection completes and reports findings
- **THEN** the command exits successfully and the findings are visible in both output forms

#### Scenario: Absence of an adapter fails the command

- **WHEN** no adapter can be selected for the directory
- **THEN** the command exits with a failure and states why

### Requirement: The pipeline is data, and rendering is separate

The pipeline MUST return the report as data and MUST NOT print. Rendering MUST
be a separate capability that takes the report, so a future consumer can use the
inspection without the command line.

#### Scenario: The report can be produced without the command line

- **WHEN** a caller runs the pipeline against a directory
- **THEN** it receives the report as data and nothing is written to the command line

### Requirement: The pipeline knows no framework

No package in the inspection path except a source adapter package MUST import a
source framework or its compiler. The adapter set MUST be composed where the
command is wired, so adding an adapter does not edit the pipeline.

#### Scenario: The inspection path stays neutral

- **WHEN** the framework boundary check runs over the workspace
- **THEN** the inspection packages import no source framework and the check reports no violation

#### Scenario: A new adapter is added where the command is composed

- **WHEN** a second adapter package is added to the composition root
- **THEN** the pipeline package is unchanged

### Requirement: Output is deterministic

Two inspections of an unchanged project MUST produce the same report, including
the order of findings and of summary counts.

#### Scenario: Repeated inspection is identical

- **WHEN** inspection runs twice against an unchanged project
- **THEN** the two machine reports are identical
