## Context

See `proposal.md` for motivation and `specs/workflow-value-evidence/spec.md`
for the requirements.

The completed workflow record (`docs/evidence/workflow-baserow-field-work.md`)
already names the workflow this change contracts: a field worker keeps one
record current after a visit, updating a status and one field and attaching a
document or photo, with administration and reporting left on the desktop.

The repository already carries every mechanism this change needs, and this
design reuses them rather than adding new ones:

- The scenario contract in `packages/visual-benchmark/src/scenario.ts` already
  declares a route, data state, viewport, device, colour scheme, font scale,
  reduced motion, ordered actions, capture moments, masks, optional motion and
  an optional cross-platform tolerance with required test identifiers.
- `captureWebChrome` refuses a non-ready data state that has no actions, and
  checks declared identifiers in the served page; `captureNativeDevice` builds
  and installs a prepared application, drives the scenario's declared actions
  and copies one screenshot per capture; `evaluateTolerance` returns the
  declared `pass`/`fail` verdict for both platforms.
- The records fixture (`packages/target-vue/fixtures/records/`) is the existing
  precedent for an original fixture: a web source, a checked-in emitted native
  file and a provenance manifest, with `compileFixtureScreen` refusing to
  proceed when a fresh compilation no longer matches the emitted file.
- `scripts/lib/fixture-app.mjs` packs the workspace, scaffolds an application
  outside the checkout, compiles the fixture, installs from tarballs and asserts
  one runtime copy, and the capture script starts the packager once and warms
  the bundle before any device capture.

The constraint that shapes the design is that the fixture, the data and the
asset must be independently ours, and that one action sequence has to be the
same on web, iOS and Android.

## Goals / Non-Goals

**Goals:**

- One contract that a future agent can implement without deciding product scope:
  ordered actions, minimum data per action, success state, failure state and
  desktop-only remainder.
- One original fixture, one synthetic data set and one original asset, all
  created here.
- One acceptance scenario, held as data, validated by the existing scenario
  contract, driveable on all three paths with no credential.
- The existing records fixture, its byte-identical regression and its capture
  evidence keep working unchanged.

**Non-Goals:**

- No companion implementation, no target-subset extension and no device capture
  of the new fixture: those are the next backlog changes.
- No connector, no real account, no real record, no copied interface or asset.
- No second scenario format and no second fixture-application helper.
- No change to the App Graph, the inspection report, the source adapter contract
  or the target schema versions.

## Decisions

### The workflow gets its own fixture directory

The field-work workflow is a different screen from the records fixture, so it
gets its own directory beside it (`packages/target-vue/fixtures/field-workflow/`)
with a web source, a checked-in emitted native file and a provenance manifest
generated the same way. The records fixture is not edited.

Rejected: extending `fixtures/records/` into the workflow. It would move
committed bytes and the manifest hash, discarding the byte-identical regression
that proves the compiler did not drift. Rejected: a hand-written native screen,
which proves nothing about the target compiler.

### The data and the asset are original and generated in the repository

The fixture reads one small synthetic data module (a fixed set of invented
records) and the attachment is a small asset created for this project rather
than a downloaded or benchmark image. Both live with the fixture and are checked
in.

Rejected: reusing any benchmark asset or data shape, because the pilot brief
forbids copying the benchmark's interface, assets and data. Rejected: fetching
an asset at run time, which would add a network dependency to a capture path
that must work offline on a device.

### The acceptance scenario is data, not code

The ordered action sequence, the capture moments and the declared identifiers
are written once as a scenario file for the new fixture, validated with
`validateScenario`, and consumed by the web runner and by the device harness
through the existing mechanisms. The scenario names the actions; the workflow
record names the minimum data each action touches.

Rejected: keeping the scenario inline in each script, which already produced
three near-copies for the records fixture and would drift. Rejected: a generated
Detox configuration per run, which would put the scenario in two formats.

### The fixture-application helper is parameterised, not duplicated

`scripts/lib/fixture-app.mjs` currently hard-codes the records fixture's paths,
application name and identifiers. It is parameterised so a caller names the
fixture and its identifiers, and the records path passes its existing values and
keeps its current output.

Rejected: a second helper module, which would leave two truths about how a
fixture application is prepared. Rejected: hard-coding the new fixture inside
the same module, which would make a third fixture a copy-paste job.

### The failure state is reachable from declared actions

The workflow's failure state is a visible state the declared actions can reach
(for example a save that reports it did not complete), so the acceptance
scenario can assert it later without a real service, a real failure or a
credential.

Rejected: documenting the failure state in prose only, which leaves nothing to
assert. Rejected: a failure state that requires an unreachable service, which
would make the assertion depend on an environment rather than on the fixture.

### The record and the scenario must agree, and a test says so

The workflow record and the scenario file are checked against each other: the
action names and the declared identifiers in the record must appear in the
scenario, and vice versa. This is the check that keeps the contract and the
fixture from drifting apart.

Rejected: relying on review, which has no failure mode a run can observe.

### Contract change questions

- **Why the current arrangement is insufficient:** it is not. The scenario
  contract already carries actions, capture moments, identifiers and tolerance;
  the new fixture lives in the target provider's fixture directory; the workflow
  record is a document. Nothing in the neutral contracts needs a new field.
- **Which real consumer demonstrated the need:** the Vue proof journey, whose
  next change must implement exactly one workflow without choosing product
  scope. No second adapter or target shares the need.
- **Why provider-owned evidence is not enough:** provider-owned metadata is not
  applicable here; the requirement is satisfied by existing package types and a
  document, so there is no metadata question to answer.
- **Whether the schema version changes:** no. App Graph, inspection report,
  source adapter contract and both target schema versions stay at 1.

## Risks / Trade-offs

- The fixture and the workflow record could drift apart, leaving a contract that
  describes a screen that no longer exists → the cross-check test in the
  decision above fails the workspace when they disagree.
- Parameterising the fixture helper could change the records path, invalidating
  its captured evidence → the records capture script, its reports and its
  byte-identical fixture test must still pass unchanged, and the records
  identifiers stay the caller's input rather than a default.
- A new fixture could be mistaken for the benchmark project's screen → the
  provenance and non-affiliation language is recorded in the pilot and evidence
  documents, the naming is ours, and `docs/WORKFLOW-EVIDENCE.md` already labels
  the hypothesis unvalidated.
- The synthetic data could grow into a small product model → the data stays a
  fixed, small, invented set that the workflow needs and nothing more.
- The failure state could be asserted in a way that needs a real service → the
  fixture reaches it through declared actions only, so the assertion stays
  offline and credential-free.

## Migration Plan

None. Nothing shipped changes behaviour: the records fixture, its provenance
manifest, its capture reports and the capture scripts keep their current output,
and the helper change is internal to the verification path. The new fixture and
scenario are additions that the next backlog change consumes.
