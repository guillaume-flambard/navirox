# Design

## Context

The Vue proof journey has a contracted workflow and an original fixture at
`packages/target-vue/fixtures/field-workflow/`, but no companion application
assembled from the target compiler's output. The existing fixture helper
`scripts/lib/fixture-app.mjs` was parameterised in the previous change
(`RECORDS_FIXTURE` plus a fixture record passed by the caller), so a second
fixture can be prepared without duplicating the packing, scaffolding, compiling,
installing and bundling steps.

Grounding, observed read-only against the current tree:

- `analyze` on the fixture directory returned `no-adapter` until the fixture
  gained a `package.json` declaring `vue`; with that manifest the `vue` adapter
  detects it and reports 3 units and 0 findings.
- `plan -C packages/target-vue/fixtures/field-workflow --json` classifies
  `fieldRecords.ts` as `shared`, both component files as `native-replacement`,
  and the `vue` dependency as `portable`. That classification is the planner's
  own statement about which units may move, so the assembly consumes it rather
  than deciding for itself.
- The target compiler emits the SFC's script block verbatim, so logic inside the
  fixture screen is carried into the generated native screen unchanged rather
  than rewritten by hand.

## Goals / Non-Goals

### Goals

- One repeatable assembly command that produces the companion from clean
  generated output.
- A machine-readable provenance record naming every file as generated, moved
  (with the planner decision that approved it) or manual (with its reason).
- A stale or hand-edited generated file fails the assembly.
- Deterministic behaviour tests over the moved shared unit and the generated
  screen's action wiring, before any device automation.
- Bundles for both declared platforms from the clean generated output.

### Non-Goals

- No device automation, capture or visual claim (the next backlog item).
- No connector, credential, real service or real record.
- No generic screen conversion and no extension of the supported subset beyond
  what the declared fixture needs.
- No App Graph, inspection report, source adapter contract or schema version
  change.

## Decisions

### Decision 1: Assemble with a script over the shared helpers

The companion is assembled by a new script that reuses `scripts/lib/fixture-app.mjs`
with a `FIELD_WORKFLOW_FIXTURE` record, rather than a second application checked
into the tree.

Rejected: a checked-in companion app under `examples/` (it would duplicate the
scaffolder template and, worse, make generated and hand-written files
indistinguishable on inspection); hand-assembly (not repeatable, and nothing
would fail when the fixture moved).

### Decision 2: Consume the planner's classification instead of a copy list

The assembly runs `analyze` and `plan` itself and asserts the classification of
the units it intends to move, then copies the units the planner approved as
`shared` or `portable`.

Rejected: a hardcoded list of files to copy (it would drift from the planner and
would move a unit no planner decision ever approved, which is exactly the
concealment this change exists to prevent); trusting the compiler alone (the
compiler says what it can emit, not which units are portable).

### Decision 3: Provenance is a machine-readable record

The assembly writes a JSON provenance record whose entries name the path, the
origin (`generated`, `moved`, `manual`), and for moved entries the planner
decision and reason, and for manual entries the reason the file exists.

Rejected: prose in a document (not checkable, so it could drift and nothing would
fail); headers inside the generated file (mutating generated output breaks the
byte-equality rule and would make the record itself a hand edit).

The builder lives in the verification package beside the existing fixture-screen
rule, because both enforce a rule about fixture output rather than about the
compiler, and the assembly script stays a thin command that a person can run.

### Decision 4: The workflow rules move into a shared unit

The pure workflow rules (which value comes next, whether a save may proceed, what
the save reports) are extracted into a plain module that the fixture screen
imports, so the rules are a planner-approved shared unit that is tested
deterministically and carried unchanged into the companion.

Rejected: testing only the fixture data (the data would be exercised but no rule
would); mounting the generated native screen off-device (no such harness exists,
and the device run belongs to the next change).

### Decision 5: The subset is extended only on evidence

The declared fixture already compiles with zero findings, so this change extends
no subset construct. The assembly records that as an outcome rather than an
omission, and any construct the fixture would need later is added in its own
change with explicit findings for everything still unsupported.

Rejected: extending the subset pre-emptively "because a companion may need it"
(an untested addition and a support claim with no evidence behind it).

## Risks / Trade-offs

- Refactoring the fixture screen changes the emitted file and its manifest hash.
  The fixture test recompiles and compares bytes, so the change either keeps them
  in step or fails; the new hash is recorded in the evidence.
- Copying a shared unit into the companion could silently diverge from the
  fixture copy. The assembly copies it by reading the source file, and the
  provenance entry records the source path, so the test can compare them.
- The planner could classify a unit differently after an adapter change. The
  assembly asserts the classification it depends on, so a reclassification is a
  loud failure rather than a quiet provenance lie.

## Contract change questions

**Why the current arrangement is insufficient:** the current arrangement has no
command that assembles a companion, so nothing distinguishes generated output
from a hand-written screen and nothing fails when the two drift.

**Which real consumer demonstrated the need:** the Vue proof journey, which needs
a companion application before it can produce device evidence.

**Why adapter or provider owned metadata is not enough:** the need is not a
classification of source, which the planner already provides, but a record of
what the assembled companion contains. That record belongs to the assembly
output, not to a source adapter or the App Graph.

**Whether the schema version changes:** no. The App Graph, inspection report,
source adapter contract and both target schema versions stay at version 1. The
provenance record is a file written by the assembly script, beside the existing
fixture provenance manifest.
