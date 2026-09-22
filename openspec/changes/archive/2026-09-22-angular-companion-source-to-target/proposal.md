# Angular companion from source to target

## Why

The Angular proof now has a contracted workflow, an original fixture and a traceable
neutral seam, but no companion application. Nothing yet shows the declared workflow
running as a native application whose shared behaviour came from the neutral model
rather than from a second hand-written copy, and an ad hoc companion would let a
hand-written screen pass as the product of a source path that does not exist.

The Angular journey has no target compiler, so its companion cannot be generated the
way the Vue one was. The honest path is to consume the neutral output the planner
approved and to name the screen as manual work.

## What Changes

- Decide and record the seam the companion consumes: the planner decision that
  classifies `src/app/record-workflow.data.ts` as `shared` by `unit-shared-logic`,
  copied byte for byte into the companion, with the view recorded as a named manual
  native replacement because no Angular target compiler exists.
- Add one repeatable assembly command that runs the read-only analysis and plan on the
  fixture, asserts the three planner decisions, scaffolds the application, copies the
  approved shared module unchanged, writes the hand-written screen as the app root, and
  writes a provenance record whose entries are moved or manual and never generated.
- Add the hand-written screen beside the fixture, rendering the workflow's declared
  identifiers and importing the copied shared module so its consumption is observable.
- Add deterministic behaviour tests over the moved shared rules, and a test that the
  provenance record's content hash matches the fixture file so an edit to the moved
  module fails the workspace.
- Relax the two `companion-provenance` requirements that assume a target compiler, so a
  journey without one names its screen as manual instead of generated.
- Record the limits: no Angular template was emitted as a native screen, no Angular
  target compiler exists, and the SuiteCRM routing and version uncertainty stay stated.

Out of scope: a generic Angular screen conversion, a real SuiteCRM instance or
connector, device capture, a visual fidelity claim, and any provider type in a public
API.

## Capabilities

New Capabilities: None.

Modified Capabilities:

- `companion-provenance`: the assembly requirement and the build requirement now
  distinguish a journey whose target compiler exists from one whose target compiler does
  not exist yet, and a new scenario covers the case with no compiler.

## Impact

Proof planning and verification for the Angular journey. The change touches `scripts/`
(the assembly command), the fixture directory in `packages/source-angular/`, a new
behaviour test beside the adapter tests, and `docs/evidence/`. No runtime, adapter,
migration or public API behaviour changes, and no shared contract changes: the App
Graph, the inspection report, the source adapter contract and both target schema
versions stay at 1.
