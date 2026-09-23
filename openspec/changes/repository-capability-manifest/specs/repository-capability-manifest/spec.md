## Purpose

A deterministic, hashed description of a repository, produced before any graph or
generated output, that decides whether the repository may advance to
transformation.

## ADDED Requirements

### Requirement: Discovery produces a versioned manifest before any output

The discovery stage MUST produce a `RepositoryCapabilityManifest` carrying a
schema version and a snapshot hash, and MUST NOT write any generated output.

#### Scenario: A manifest is produced without output

- **WHEN** discovery runs on a repository
- **THEN** it returns a manifest with a schema version and a snapshot hash and
  writes no generated file

### Requirement: The manifest records the resolved facts with evidence

The manifest MUST record the topology, the package manager and lockfiles, the
resolved versions, the framework candidates, the configs and plugins, the build
entries, the conventions and the escape hatches, each with a source location and
a confidence of `high`, `medium`, `low` or `unknown`.

#### Scenario: A fact carries its location and confidence

- **WHEN** the repository declares a package manager
- **THEN** the manifest records that package manager with its source location and
  a confidence

#### Scenario: An ambiguous framework is several candidates

- **WHEN** more than one framework could own the repository
- **THEN** the manifest records each candidate with its own confidence instead of
  choosing one

### Requirement: Discovery classifies the repository

The manifest MUST classify the repository as exactly one of `eligible`,
`eligible-with-deltas`, `manual-discovery-required` or `refused`, and only
`eligible` may advance to transformation.

#### Scenario: Only eligible advances

- **WHEN** the classification is not `eligible`
- **THEN** transformation MUST NOT start

#### Scenario: Deltas are enumerated

- **WHEN** the classification is `eligible-with-deltas`
- **THEN** the manifest enumerates every delta that must be accepted before
  transformation starts

### Requirement: Discovery is deterministic

Two runs over the same inputs MUST produce the same manifest and the same
snapshot hash.

#### Scenario: The same inputs agree

- **WHEN** discovery runs twice over the same files and lockfile
- **THEN** the two manifests and their hashes are equal
