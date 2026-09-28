# Public messaging guide

Navirox is pre-alpha. Public communication must make the current proof smaller
and clearer, not turn roadmap intent into present capability.

## Safe description

Navirox is an open-source toolkit exploring how existing web applications can
be analyzed and transformed into verifiable native mobile projects. It is
framework-agnostic in architecture and Vue-first in the current generation
proof.

## Required boundaries

- Say that public npm installation is not supported today.
- Separate source analysis, compiler-backed generation, native runtime builds,
  and device journeys. Evidence for one is not evidence for all four.
- Name the exact fixture, input revision, command, and limitation behind a
  result.
- Call external repositories benchmarks, never customers, partners, or
  endorsements.
- Do not claim production readiness, broad visual fidelity, or arbitrary
  full-application conversion.
- Treat a green workflow badge as proof that the workflow ran, not proof that
  no security findings exist.

## Useful public proof

Prefer a short reproduction, a refusal case, a provenance artifact, or a device
journey over a feature list. Invite contributors to make a boundary more
deterministic, a report more legible, or a proof easier to reproduce.

Current wording and links live in `README.md`, `docs/README.md`, and
`docs/PROOF-INDEX.md`. If those files and this guide disagree, use the narrower
claim and verify the code before publishing.
