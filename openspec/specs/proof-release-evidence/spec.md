# proof-release-evidence Specification

## Purpose

Give an outside evaluator one entry point into the release evidence. The proof
index MUST cite the evidence documents rather than restate them, MUST mark each
journey and benchmark with a status drawn from the declared vocabulary, and MUST
state the installation path that was actually verified, so that an unfinished
installation reads as unfinished instead of being implied to work.

## Requirements

### Requirement: The proof index cites evidence without duplicating it

The proof index MUST link each journey to the command that produced its evidence,
the immutable input that command used, the artifact it wrote, the limitation the
evidence records, and the release status of the claim, and MUST cite the evidence
documents rather than copying them.

#### Scenario: An evaluator reads the index

- **WHEN** an outside evaluator reads the proof index
- **THEN** each journey shows its command, input, artifact, limitation and release status, and the evidence itself stays in its own document

### Requirement: Release status uses the declared vocabulary

The proof index MUST classify each claim with a status from the declared
vocabulary and MUST NOT present a proof as a supported product capability.

#### Scenario: A journey is only partly supported

- **WHEN** a journey's evidence covers part of its claim
- **THEN** the index marks the remainder as simulated, deferred or excluded rather than supported

### Requirement: The installation statement matches what was verified

The proof index MUST state the installation path that was actually verified and
MUST state plainly when public package installation remains incomplete.

#### Scenario: Public installation is incomplete

- **WHEN** the documented consumer installation path is re-run and public installation is not available
- **THEN** the index records the verified tarball path and states that public npm installation is incomplete
