# Navirox documentation

Navirox is pre-alpha, and its documentation contains both current operating
contracts and dated research. This index separates them so an earlier plan is
not mistaken for today's product state.

## Start here

- [Project overview](../README.md): current status, boundaries, and source path
- [Getting started](GETTING-STARTED.md): reproducible commands from a checkout
- [Architecture](ARCHITECTURE.md): package seams and dependency direction
- [Contributing](../CONTRIBUTING.md): setup, gates, and review expectations
- [Security](../SECURITY.md): support and private reporting
- [Proof index](PROOF-INDEX.md): how claims map to evidence

## Current execution contracts

- [Execution charter](EXECUTION-CHARTER.md)
- [Proof roadmap](PROOF-ROADMAP.md)
- [OpenSpec backlog](OPENSPEC-BACKLOG.md)
- [Developer preview contract](DEVELOPER-PREVIEW.md)
- [Visual fidelity policy](VISUAL-FIDELITY.md)
- [Product repositioning](repositioning/AGENT-GUIDE.md): product direction and long-term
  architecture

These documents guide current work, but an active task and OpenSpec change may
narrow their scope. `AGENTS.md` contains the hard repository boundaries.

## Evidence

[`docs/evidence/`](evidence/) contains dated observations, transcripts, reports,
and provenance artifacts. Evidence establishes only what its command, input,
platform, and date actually cover. It is not a timeless support promise.

When a document and current behavior disagree, reproduce the smallest relevant
check. Working code, tests, and fresh CI decide what the system does now.

## Historical and reference material

- [`PLAN.md`](../PLAN.md): implementation history and task evidence
- [`blueprint.md`](../blueprint.md): original product and technical blueprint
- [Release candidate 0.1.1](RELEASE-0.1.1.md): a dated, unpublished candidate
- Archived OpenSpec changes: accepted work in the context of their archive date

Historical documents are kept because they explain decisions. They must not be
used alone to claim current installation, compatibility, or support.

## Adoption and community

[Adoption and community](GO-TO-MARKET.md) describes how the project can invite
useful feedback without turning unverified work into a product promise.
