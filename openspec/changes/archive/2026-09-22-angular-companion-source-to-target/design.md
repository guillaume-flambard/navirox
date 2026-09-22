# Design: Angular companion from source to target

## Context

The Angular proof has a contracted workflow (`docs/evidence/workflow-suitecrm-record-workflow.md`),
an original fixture (`packages/source-angular/fixtures/record-workflow/`) and a traceable
neutral seam (`docs/evidence/angular-neutral-seam.provenance.json`). The fixture reads
with no finding as a standalone component, a state service and a framework-free data
module, and the planner decides three things about it: the data module is `shared` by
`unit-shared-logic`, the component is `native-replacement` by `unit-view-layer`, and the
file-reading capability is `manual` by `capability-no-counterpart`.

Two facts shape this change.

There is no Angular target compiler. The Vue companion could write the target compiler
output as its screen; the Angular journey has no such output, so its screen can only be
hand-written and must be named as such.

The `companion-provenance` capability assumes a compiler. Its assembly requirement says
the command must write the target compiler output as the companion's screen, and its
build requirement says each bundle is produced from the clean generated output. Neither
can hold for a journey without a compiler, so both must distinguish the two cases.

## Goals and non-goals

Goals:

- a companion whose shared behaviour is traceable to the neutral output the planner
  approved, not to a second hand-written copy of the same rules;
- a hand-written screen recorded as manual work with its reason, never as generated;
- one repeatable assembly command that asserts the planner decisions it depends on;
- deterministic behaviour tests over the moved shared unit, and a check that the record
  still matches the file it moved;
- clean iOS and Android bundles from the assembled application.

Non-goals:

- no Angular UI compiler and no template to native generation;
- no device capture or acceptance run (that is the next change);
- no real SuiteCRM instance, connector, login or customer data;
- no visual fidelity claim and no claim of generic Angular conversion;
- no change to the App Graph, the inspection report, the source adapter contract or
  either target schema version.

## Decisions

1. **The companion consumes the neutral planner decision.** The unit the companion
   consumes is `angular:src/app/record-workflow.data.ts:utility:default`, approved
   `shared` by `unit-shared-logic`, and it is copied byte for byte. The Angular template
   is not consumed, and neither is the component, because the planner classified the
   component `native-replacement` and the capability `manual`: copying them would move
   work the model did not approve and would conceal a manual replacement as a move.
   Rejected: consuming the component as if it carried the behaviour, which would treat a
   rewritten view as portable; copying the whole fixture, which would import the very
   material the planner told us not to move.

2. **The screen is a named manual native replacement.** It is written for this project
   beside the fixture, renders the workflow's declared identifiers, imports the copied
   shared module, and is recorded as manual with its reason. Rejected: describing it as
   generated, which is the concealment the capability exists to prevent; reusing the Vue
   companion screen, which belongs to a different workflow; a WebView, which the program
   forbids as a companion.

3. **The provenance vocabulary is reused, not reinvented.** The record uses the existing
   origins (`generated`, `moved`, `manual`) and the existing builder, which already
   refuses a moved entry without an approving planner decision or a content hash. That
   keeps one vocabulary for both journeys and is why the `companion-provenance`
   capability is modified rather than bypassed. Rejected: a self-contained Angular record
   with its own shape, which would give a reviewer two formats to compare; prose only,
   which nothing can check.

4. **A moved unit is copied unchanged and its hash is recorded.** The assembly writes the
   module into the application root and records the sha256 of the bytes it moved, and a
   test compares that hash with the fixture file so an edit to the moved module fails the
   workspace. Rejected: importing the fixture across the repository boundary, which
   cannot resolve because the application is scaffolded outside the checkout and
   installed from packed artifacts; trusting review alone.

5. **Deterministic behaviour tests cover the moved rules.** The shared module carries
   `nextIn`, `canSave` and `saveOutcome`, so the tests exercise the behaviour the
   companion actually uses rather than only the data it ships. Rejected: asserting the
   fixed data set only, which would leave the rules untested; mounting the screen
   off-device, for which no harness exists and which belongs to the device change.

6. **The assembly asserts the planner decisions it depends on.** It runs the read-only
   analysis and plan on the fixture first and fails when the data module is no longer
   `shared` by `unit-shared-logic`, when the component is no longer `native-replacement`
   or when the capability is no longer `manual`. Rejected: a hardcoded copy list, which
   would keep working after a reclassification and quietly record a move the planner no
   longer approves.

## Contract change questions

The four questions of `docs/repositioning/AGENT-GUIDE.md` section 12:

- **Why the current arrangement is insufficient.** The `companion-provenance` capability
  requires the assembly to write a target compiler's output as the companion's screen and
  to build from that generated output. A journey without a target compiler cannot satisfy
  either, so the capability would either be violated or ignored.
- **Which real consumer demonstrated the need.** The Angular proof journey, whose
  companion consumes the neutral planner decision for the pinned SuiteCRM-shaped
  benchmark fixture. There is no second adapter or target sharing this need yet.
- **Why adapter owned metadata is not enough.** The missing piece is not a fact about the
  source; it is a rule about what an assembly may claim. The classification already
  travels on the App Graph and is read by the planner, and the record of origins belongs
  to the assembly output.
- **Whether the schema version changes.** No. The change is inside the benchmark
  package's own provenance type and the capability text; the App Graph, the inspection
  report, the source adapter contract and both target schema versions stay at 1.

## Risks and trade-offs

- **The manual screen could drift from the workflow record.** The assembly asserts the
  identifiers the record declares, and the behaviour tests cover the shared rules, so a
  screen that stops rendering a declared identifier fails the run.
- **The record could drift from the fixture.** The recorded content hash is compared with
  the file at its source path, so editing the moved module fails the test rather than
  leaving a stale hash behind.
- **Relaxing the requirement could be read as permission to mark anything manual.** The
  new scenario requires the reason to be stated and forbids marking any file generated,
  and the record still refuses a moved entry without an approving decision.
- **A reviewer could read the companion as an Angular conversion.** The evidence
  document states in its opening and its limits that no Angular template was emitted as
  a native screen and no Angular target compiler exists.

## Migration Plan

None. The Vue journey keeps its generated screen and its record, and the Angular journey
is a new assembly over an existing fixture.
