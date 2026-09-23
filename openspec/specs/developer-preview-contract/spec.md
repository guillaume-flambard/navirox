# developer-preview-contract Specification

## Purpose
TBD - created by archiving change vue-nuxt-developer-preview-contract. Update Purpose after archive.

## Requirements

### Requirement: The Vue/Nuxt preview has an evidence-bound public contract

The repository SHALL define the developer preview as a deterministic Vue/Nuxt
readiness and migration-planning experience. The contract SHALL state the claims
that evidence supports and the claims it does not support.

#### Scenario: A maintainer prepares preview documentation

- **WHEN** the maintainer selects language for the developer preview
- **THEN** the contract requires a bounded readiness claim and excludes full-app
  conversion, production readiness and visual-parity claims

### Requirement: The preview requires fresh operational evidence

The developer preview SHALL require a reproducible source input, documented
consumer path, declared support boundary, and green installation, analysis, test
and build verification before announcement.

#### Scenario: CI is red or public installation is incomplete

- **WHEN** a preview gate lacks fresh operational evidence
- **THEN** the contract records the missing gate and prevents the corresponding
  public claim

### Requirement: Optional LLM assistance remains non-authoritative

The developer preview SHALL work without an LLM. Any later LLM output SHALL be
opt-in, labelled as inferred or unverified, and validated against deterministic
results before it influences generated artifacts.

#### Scenario: An LLM proposes portability

- **WHEN** a suggestion differs from the deterministic report
- **THEN** the report retains the deterministic classification until a separate
  deterministic validation accepts a change
