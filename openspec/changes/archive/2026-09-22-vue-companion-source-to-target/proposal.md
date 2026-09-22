# Vue companion from source to target

## Why

The Vue proof has a contracted workflow and an original fixture, but no companion
application assembled from the target compiler's output. Without one, nothing
proves the fixture can become a native application and nothing separates what the
compiler generated from what a person wrote by hand. A companion assembled ad hoc
would let a hand-written screen pass as generated output.

## What Changes

- Assemble the companion with one repeatable command that writes the target
  compiler output as its screen and copies only planner-approved portable or
  shared units into it unchanged.
- Record a companion provenance file naming every file as generated, moved
  (with the planner decision that approved it) or manual (with the reason it
  exists), so no manual replacement is concealed.
- Refuse a generated file whose fresh compilation no longer matches, exactly as
  the existing fixture rule does.
- Add deterministic behaviour tests over the moved shared unit and the generated
  screen's action wiring, and bundle both platforms from the clean generated
  output.
- Extend the Vue target subset only where the declared fixture needs it. If
  nothing is needed, the run records that and the subset is left alone.

No product analytics, connector, credential or real service is introduced. The
Baserow boundary is unchanged: the fixture is this project's own.

## Impact

- Affected capability: `companion-provenance` (new).
- Affected layer: target provider output consumed by the verification fixture
  tooling; the assembly script lives beside the existing fixture helpers.
- Touches `packages/target-vue/fixtures/field-workflow/`, `scripts/lib/`, a new
  companion assembly script, `docs/evidence/`, and package tests.
- No shared contract changes: the App Graph, inspection report, source adapter
  contract and target schema versions are untouched.
