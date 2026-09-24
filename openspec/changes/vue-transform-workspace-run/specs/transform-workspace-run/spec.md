## ADDED Requirements

### Requirement: The delivered transform command composes real providers

The `navirox transform` command MUST compose the registered Vue source lowering and the neutral native target when no test context supplies dependencies. It MUST NOT require callers to inject providers for the delivered CLI path.

#### Scenario: A Vue repository is transformed by the delivered command

- **WHEN** a user runs `navirox transform <vue-repository> --profile <profile> --out <workspace> --write`
- **THEN** the command uses the real Vue lowering and target and writes the planned workspace

### Requirement: A generated workspace carries its own runnable verification

A generated workspace MUST contain a package manifest, a Vue entrypoint, a generated runtime registration, an application entrypoint, and a verification command that compiles every generated Vue SFC. The verification command MUST fail on an SFC parse or template compilation error.

#### Scenario: The generated workspace verifies itself

- **WHEN** the generated workspace runs its package test command
- **THEN** every generated SFC parses and compiles and the command exits 0

### Requirement: Refused source remains absent from the workspace

A screen with non-generated coverage MUST produce a finding and MUST NOT produce a generated screen file. A generated workspace MUST never require a hand-written replacement for a refused screen.

#### Scenario: A refused screen is not silently replaced

- **WHEN** lowering refuses one screen and generates another
- **THEN** only the generated screen is present and the refusal is recorded in the transform result
