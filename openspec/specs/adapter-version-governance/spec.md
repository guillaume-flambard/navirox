# adapter-version-governance Specification

## Purpose

The evidenced compatibility matrix that decides which framework versions a
transformation profile may claim and transform.

## Requirements

### Requirement: Every profile is tied to a verified range and its evidence

The matrix MUST record, for each adapter and profile, the framework, the verified
version range, the topology profile, the admitted plugins and configs, the
covered constructs, the escape hatches, the target profiles, the evidence and the
gate. A declared npm range alone MUST NOT be a compatibility claim.

#### Scenario: A profile names its evidence

- **WHEN** the matrix declares a profile supported
- **THEN** that row names its verified version range, its evidence and its gate

### Requirement: An unverified version is refused deterministically

An adapter MUST return `outside-verified-range`, naming the fact, its location,
the expected profile and a resumption path, and MUST NOT generate an application.

#### Scenario: An unverified major is refused

- **WHEN** a repository declares a framework major the matrix does not verify
- **THEN** the adapter returns `outside-verified-range` and no application is
  generated

### Requirement: Each verified line has positive, boundary and refused fixtures

For every verified version the corpus MUST contain a positive fixture, a boundary
fixture and a refused fixture, with their lockfiles and config snapshots.

#### Scenario: A refused fixture exists

- **WHEN** a verified line is declared
- **THEN** the corpus contains a refused fixture for that line

### Requirement: Requalification is a protocol, not an automatic upgrade

An upstream release MUST open a requalification, and the matrix range MUST NOT
widen before the requalification gates pass.

#### Scenario: An upstream major opens requalification

- **WHEN** an upstream major is released
- **THEN** a requalification is opened and the range is unchanged until its gates
  pass
