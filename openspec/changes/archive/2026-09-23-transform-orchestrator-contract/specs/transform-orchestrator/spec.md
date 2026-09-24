## Purpose

The deep `transform` module and its CLI surface: one entry point that sequences
discovery through scaffold, refuses unsafe or ineligible runs before any write,
and returns a complete, traceable result.

## ADDED Requirements

### Requirement: One deep entry point sequences the whole path

The system MUST expose `transform({ root, app, profile, output }) -> TransformResult`
as the single programmatic entry point, and that entry point MUST sequence
discovery, eligibility, inspection and plan, lowering into the Workflow IR,
emission from the IR, migration of approved units, provenance recording and
scaffold, without the caller orchestrating adapters or the runtime.

#### Scenario: A caller invokes transform once

- **WHEN** a caller invokes `transform` with a root, a profile and an output path
- **THEN** the result reports each stage in order and the caller does not select
  an adapter, a lowerer or a target itself

### Requirement: Dry-run is the default and write is explicit

`transform` MUST perform a dry run unless the caller explicitly requests a write.
A dry run MUST NOT create or modify any file under the output path.

#### Scenario: A dry run leaves the filesystem untouched

- **WHEN** `transform` runs without an explicit write request
- **THEN** no file is created or modified under the output path and the result
  is marked as a dry run

### Requirement: An ineligible repository is refused before any write

When discovery classifies the repository as anything other than `eligible`, or
when the version gate refuses the declared framework version, `transform` MUST
stop and MUST NOT write any file under the output path.

#### Scenario: A refused repository leaves the output intact

- **WHEN** discovery classification is `refused` or the version gate returns
  `outside-verified-range`
- **THEN** the result carries the refusal finding and the output path is
  unchanged

### Requirement: Unsafe paths are refused

`transform` MUST refuse a path traversal in any path argument, an output path
that resolves inside the source root, and an output path that is the source root
itself, each with a finding, and MUST NOT write in those cases.

#### Scenario: An output inside the source is refused

- **WHEN** the requested output path resolves inside the source root
- **THEN** the result carries an unsafe-path finding and no file is written

### Requirement: An ambiguous profile is refused

When more than one transformation profile could apply, or when the named profile
is unknown, `transform` MUST refuse rather than choose one, and MUST list the
candidates or the unknown name in the finding.

#### Scenario: An unknown profile is refused

- **WHEN** the caller names a profile no registered profile matches
- **THEN** the result carries a finding naming the unknown profile and no stage
  that would write has run

### Requirement: The result separates generated, shared and manual work

`TransformResult` MUST report the output layout `generated/`, `shared/`,
`manual/`, a `navirox.manifest.json`, the coverage totals, the deltas and
refusals, and the reproduction commands, so a caller can tell what was
generated, what was migrated and what remains manual.

#### Scenario: A successful dry run reports the full layout

- **WHEN** `transform` completes a dry run on an eligible repository with a
  known profile
- **THEN** the result lists the planned `generated/`, `shared/` and `manual/`
  paths, the manifest path, coverage totals and the validation commands

### Requirement: The CLI command is the deep module

The `navirox transform` command MUST accept a repository path, `--app`, a named
profile and `--out`, MUST default to a dry run, and MUST write only when an
explicit write flag is set. The command MUST NOT contain orchestration logic
that the deep module does not own.

#### Scenario: The CLI defaults to a dry run

- **WHEN** `navirox transform` is invoked without a write flag
- **THEN** it reports a dry-run result and writes no file

#### Scenario: The CLI passes the same refusal through

- **WHEN** the deep module returns a refusal finding
- **THEN** the command exits non-zero and prints that finding without writing
