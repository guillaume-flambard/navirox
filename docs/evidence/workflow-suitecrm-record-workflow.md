# Angular proof workflow: record update with attachment

This is the workflow evidence record for the Angular proof journey, completed per
[`docs/WORKFLOW-EVIDENCE.md`](../WORKFLOW-EVIDENCE.md). Validation status:
**unvalidated hypothesis**. No practitioner feedback has been obtained, so nothing
here is customer demand, a user request or a validated need.

## Source provenance

| Field | Value |
| --- | --- |
| Benchmark | SuiteCRM (`suitecrm` catalog profile, adapter `angular`) |
| Upstream | `https://github.com/salesagility/SuiteCRM-Core.git` |
| Immutable revision | `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` |
| Source directory | `.` (repository root) |
| Reproducing command | `pnpm test:benchmarks -- --project suitecrm` |
| Machine readable report | `docs/evidence/angular-suitecrm-benchmark.md` |

Read only: the benchmark fetches that exact commit into a temporary directory and
fails unless the checked out revision matches, never installs or modifies it, and
the analysis writes no file into it. The analysis is an input, not a customer
engagement, not an endorsement, and not an application of that product.

The workflow below is this project's own hypothesis about a useful mobile task,
selected from the readable SuiteCRM-shaped fixture in
`packages/source-angular/fixtures/suitecrm-app` and from the recorded evidence. It
is not SuiteCRM's chosen workflow, not a statement about SuiteCRM's product
direction, and not customer demand. SuiteCRM has not requested, reviewed or
endorsed it, and Navirox has no affiliation with SuiteCRM.

Reproducible findings from the run that produced this record: 12286 files, 1588
units (1251 utility, 297 component, 40 state-module), 684 capability usages and 40
dependencies, with 0 routes and 0 screens. The findings are `angular-external-template`
198, `angular-module` 177, `angular-remote-configuration` 1 and `version-untested`
1. The routing could not be read at all: the shell route table is an empty literal
`Routes` array and the real routes arrive at runtime through federated extension
loading, which the adapter reports as `angular-remote-configuration` instead of
inventing routes. So this record claims no route, screen or unit the analysis did
not establish, and the workflow is selected from the readable fixture rather than
from a guessed route table. The declared `@angular/core` 18.2.14 is outside the
tested `^20`/`^21` range, so the adapter reports `version-untested`; that is a
statement about the tested range, not a defect.

## Actor and mobile context

A field worker who keeps one record current while away from a desk, on a phone,
with a camera. Today the record is updated on a desktop browser, or the change is
remembered and entered later. The actor, the device and the place are a product
hypothesis drawn from the shape of the analyzed application and its readable
fixture (record list, record detail, an update form, an attachment control), not an
observed fact.

## Trigger

Opening the application to update a record immediately after a visit or an
inspection, while still on site.

## Workflow contract

The ordered actions, so implementation does not have to decide product scope:

1. Open the record queue. `record-workflow-queue`
2. Select one record. `record-workflow-select`
3. Edit one field. `record-workflow-field`
4. Move the status. `record-workflow-status`
5. Attach a document or a photo. `record-workflow-attach`
6. Save the record. `record-workflow-save`

Minimum data, per action:

| Action | Reads | Writes |
| --- | --- | --- |
| Open the queue | The fixed synthetic record set: an identifier, a title, a status and a field value per record | Nothing |
| Select one record | The chosen record's identifier, status and field value | Which record is open |
| Edit one field | The current field value | The record's field value |
| Move the status | The current status | The record's status |
| Attach a document or a photo | One local attachment reference created for this project | The record's attachment state |
| Save the record | The field value | Whether the change is saved |

Failure state: the save reports that it did not complete and the change stays
unsaved rather than appearing to have succeeded. It is reached by the declared
actions alone, with no service and no credential: saving while the field value is
empty surfaces that the change was not saved. A companion proof asserts the
visible failure state instead of only the happy path.

The fixture that declares this contract is
`packages/source-angular/fixtures/record-workflow/`. Its data module declares the
ordered actions and the identifiers they act on, the fixed synthetic record set,
the desktop-only remainder and the execution state, and its standalone component
renders every declared identifier. The identifiers every state renders are
`record-workflow-screen`, `record-workflow-queue`, `record-workflow-row` and
`record-workflow-select`.

The Angular journey has no target path yet: there is no served route and no target
compiler that emits this fixture as a native screen. The declared actions are
therefore marked as not yet executable, and this record claims no run that has not
happened.

## Success state

One record's field value and status are updated and a document or a photo is
attached to it, from the phone, with the change visible as saved. Bounded data
assumptions: one record at a time, a small set of fields, one attachment; the
workflow is local and offline in the fixture, so it needs no instance, no
credential and no service; original synthetic data only.

## Friction measure

Friction observable today: the update waits for a desktop, or it is retyped later
and can be lost. Claim to test: doing the update on the phone at the moment of the
visit reduces the delay between the visit and the recorded change, and removes the
retyping step. How it would be measured: time from visit to saved change, and the
number of manual re-entries needed to reach the saved state, compared across the
desktop path and the companion path. No measurement has been taken yet.

## Desktop-only remainder

Desktop only, deliberately out of scope: administration and configuration
surfaces, bulk editing across records, reporting and export, and accounts, roles
and permissions. The analysis of the pinned revision reports administration and
configuration routes as desktop work and the readable fixture classifies the
configuration surface as `desktop-only`; a companion does not replace them.

## Alternative-path comparison

| Criterion | Native companion | PWA | WebView | Capacitor |
| --- | --- | --- | --- | --- |
| Offline need | Local queue and storage in the app's own layer; the repository keeps state across a relaunch on a device | Service worker and browser storage; queue survives but eviction is outside the app's control | Same as PWA, inside a shell | Web queue plus a native bridge; the queue stays a web implementation |
| Device integration | Camera and secure storage through the native API surface already exercised by the device journeys | File input with capture; no secure storage | Same as PWA | Plugins over the same APIs |
| Interaction cost | One-handed native controls; no browser chrome | Browser chrome, address bar, reload risk | Browser surface inside a shell | Native shell around a web interaction |
| Operational ownership | Built and shipped as an app; store presence and managed distribution | A URL; no store, weaker device trust | A shell to maintain plus the web app | A web app plus native project to maintain |

Decision: **proceed with the independent native companion.** Reason: the two
criteria that decide this workflow are offline queueing away from the desktop and
camera attachment, and the repository has a working, evidenced native path for
both (the device journeys and the capture harness run in continuous integration,
and the secure store is verified across a relaunch on a device). The closest
alternative, Capacitor, would keep the offline queue and storage in the web layer
while adding a native project to maintain, and a WebView wrapper would present a
desktop-shaped interface whose source the pinned analysis could not even route.
The Angular side of this decision is weaker than the Vue side: no Angular screen
has been emitted natively yet, so the companion stage has to show that the
declared workflow can be carried at all.

This decision is a hypothesis to be tested at the companion and device-proof
stages, not a measured advantage. If a PWA turns out to satisfy the offline and
attachment needs on the target devices, that is the cheaper and better answer and
nothing here should stop it from being chosen.

## Confidence and validation

| Field | Value |
| --- | --- |
| Status | `unvalidated hypothesis` |
| Basis | Reproducible findings from the pinned benchmark revision and the readable SuiteCRM-shaped fixture; no practitioner feedback |
| Practitioner feedback | None. The guide and synthesis format exist in [`docs/OPERATOR-FEEDBACK.md`](../OPERATOR-FEEDBACK.md); no interview has been held and no feedback was requested |

## Known unknowns

- Whether the actor actually works away from a desktop often enough for the
  workflow to matter.
- Whether a real instance's owner would authorise a tool to talk to it, and under
  which permissions; the pinned revision's authentication and API ownership were
  not read.
- Whether the attachment step is a photo capture, an existing document or both.
- Whether the offline window is minutes or days, which changes the queue design.
- Whether the desktop remainder is accepted by the people doing the work, or
  whether they expect the whole surface on the phone.
- Whether the federated extension routing, once someone with instance knowledge
  names the routes, changes which workflow is worth building first.
