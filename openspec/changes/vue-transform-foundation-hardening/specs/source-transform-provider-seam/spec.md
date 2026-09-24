## ADDED Requirements

### Requirement: Target package metadata cannot name the source side

A target package manifest and TypeScript project references MUST NOT name `@memolabs-apps/source` or any source adapter package, even when the target implementation imports only the neutral IR.

#### Scenario: Metadata is checked as well as imports

- **WHEN** the target package metadata is checked after its source imports pass
- **THEN** a source-side dependency or project reference fails the seam check

### Requirement: Framework-specific workspace construction stays behind a provider

The neutral CLI production composition MUST obtain workspace generation through a declared provider contract and MUST NOT contain source-framework imports or framework-specific workspace construction. A provider implementation MAY own its framework-specific generation rules.

#### Scenario: The CLI boundary rejects framework knowledge

- **WHEN** the static boundary check inspects the neutral CLI transform composition
- **THEN** a source-framework import or direct framework-specific workspace construction fails the check

### Requirement: Workspace commands come from the provider

A workspace provider MUST return the package-local commands exposed by its generated workspace, and the CLI MUST NOT invent a verification or native build command that the provider did not report.

#### Scenario: An unavailable command is absent

- **WHEN** a compiler-only workspace provider returns no native build command
- **THEN** the transform manifest contains no native iOS or Android build command
