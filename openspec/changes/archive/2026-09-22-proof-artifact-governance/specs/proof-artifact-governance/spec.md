# Proof artifact governance Specification

## ADDED Requirements

### Requirement: Retained proof artifacts have declared provenance

Every retained proof fixture, capture, report, and upload MUST declare its data
class, provenance, retention purpose, and permitted use before publication or CI
upload.

#### Scenario: A device capture is retained

- **WHEN** a proof run retains a device capture
- **THEN** its artifact record identifies whether its data and assets are original synthetic, public reference, or generated

### Requirement: Prohibited proof material fails the hygiene gate

The proof artifact gate MUST fail before upload or publication when a declared
proof path contains an unapproved credential-shaped value, data fixture, or
asset, and MUST provide a safe review signal without exposing a secret.

#### Scenario: A fixture contains a credential-shaped value

- **WHEN** the hygiene gate scans a declared proof fixture containing a prohibited credential-shaped value
- **THEN** it fails before the fixture can be uploaded and identifies the affected artifact class

### Requirement: Requalification preserves historical evidence

Benchmark requalification MUST report drift separately from historical pinned
evidence and MUST NOT overwrite the recorded revision or result of a published
benchmark run.

#### Scenario: Upstream benchmark source changes

- **WHEN** a requalification run finds that the upstream reference differs from the pinned benchmark revision
- **THEN** it records the drift as a new result and leaves the historical evidence unchanged
