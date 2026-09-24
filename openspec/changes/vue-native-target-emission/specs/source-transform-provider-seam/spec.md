## MODIFIED Requirements

### Requirement: A target emits from the IR only

A target provider MUST expose an emission entry point that receives the IR and a
target profile, and MUST NOT require any source framework type. The target-side
contract types (`TargetProvider`, `TargetProfile`, `EmittedFile`, `EmissionResult`
and `EmissionFinding`) MUST be declared in the neutral Workflow IR package, because
a target package may not import the source-side seam package that would otherwise
declare them. The source-side seam package MAY re-export them so existing callers
keep working.

#### Scenario: A target consumes the IR

- **WHEN** a target is given a workflow and a target profile
- **THEN** it emits output without naming a source framework

#### Scenario: A target names the contract without importing the source package

- **WHEN** a target package implements the emission entry point
- **THEN** it imports the target-side types from the neutral IR package and imports no source package
