# Vue proof workflow: field record update

This is the workflow evidence record for the Vue/Nuxt proof journey, completed per
[`docs/WORKFLOW-EVIDENCE.md`](../WORKFLOW-EVIDENCE.md). Validation status:
**unvalidated hypothesis**. No practitioner feedback has been obtained, so nothing
here is customer demand, a user request or a validated need.

## Source provenance

| Field | Value |
| --- | --- |
| Benchmark | Baserow (`baserow` catalog profile, adapter `nuxt`) |
| Upstream | `https://github.com/baserow/baserow.git` |
| Immutable revision | `81e094a1f4b3a62625c218d78fe319ba44098617` |
| Source directory | `web-frontend` |
| Reproducing command | `pnpm test:benchmarks -- --project baserow` |
| Machine readable report | `docs/evidence/vue-target-baserow-diagnostic.json` |

Read only: the benchmark fetches that commit into a temporary directory, never
installs or modifies it, and the target diagnostic writes no file into it. The
analysis is an input, not a customer engagement, not an endorsement, and not an
application of that product.

The workflow below is this project's own hypothesis about a useful mobile task,
drawn from the reproducible analysis of that revision. It is not Baserow's chosen
workflow, not a statement about Baserow's product direction, and not customer
demand. Baserow has not requested, reviewed or endorsed it, and Navirox has no
affiliation with Baserow.

Reproducible findings from the run that produced this record: 46 routes and 41
screens, 2751 files, 1609 units and 259 capability usages; the target diagnostic
attempted 12 of the 41 analyzed screens and reported 113 findings
(`unsupported-text` 52, `unsupported-element` 41, `unsupported-directive` 20)
with exactly one attempted screen inside the supported subset. So the analysis
says what the current Vue target compiler cannot emit; it does not say what a
mobile user needs.

## Actor and mobile context

A field worker who keeps one record current while away from a desk, on a phone,
with a camera. Today the record is updated on a desktop browser, or the change is
remembered and entered later. The actor, the device and the place are a product
hypothesis drawn from the shape of the analyzed application (record list, record
detail, forms, attachments), not an observed fact.

## Trigger

Opening the application to update a record immediately after a visit or an
inspection, while still on site.

## Workflow contract

The ordered actions, so implementation does not have to decide product scope:

1. Open the record queue.
2. Select one record.
3. Change its status.
4. Edit one field.
5. Attach one photo or document.
6. Save the record.

Minimum data, per action:

| Action | Reads | Writes |
| --- | --- | --- |
| Open the queue | The fixed synthetic record set: an identifier and a title per record | Nothing |
| Select one record | The chosen record's identifier, status and field value | Which record is open |
| Change the status | The current status | The record's status |
| Edit one field | The current field value | The record's field value |
| Attach a photo or document | One local attachment reference created for this project | The record's attachment state |
| Save the record | The status, the field value and the attachment state | Whether the change is saved |

Failure state: the save reports that it did not complete and the change stays
unsaved rather than appearing to have succeeded. It is reached by the declared
actions alone, with no service and no credential: when the record has no status,
saving surfaces that the change was not saved. A device proof asserts the visible
failure state instead of only the happy path.

The acceptance scenario that drives this contract is
`packages/visual-benchmark/src/scenarios/field-workflow.ts`. Its ordered actions
select the test identifiers `field-select`, `field-status-toggle`,
`field-notes-edit` and `field-attach`, then `field-save` for the settled capture
and `field-status-clear` before `field-save` for the interrupted one. The
identifiers every capture renders, and therefore the ones the declared tolerance
requires, are `field-screen`, `field-list`, `field-row` and `field-select`.

## Success state

One record's status and one field are updated and a photo or document is attached
to it, from the phone, with the change visible as saved. Bounded data assumptions:
one record at a time, a small set of fields, one attachment; a local queue holds
the change until it can be sent; original synthetic data only, no real instance,
no credentials, no customer records.

## Friction measure

Friction observable today: the update waits for a desktop, or it is retyped later
and can be lost. Claim to test: doing the update on the phone at the moment of the
visit reduces the delay between the visit and the recorded change, and removes the
retyping step. How it would be measured: time from visit to saved change, and the
number of manual re-entries needed to reach the saved state, compared across the
desktop path and the companion path. No measurement has been taken yet.

## Desktop-only remainder

Desktop only, deliberately out of scope: administration and configuration
surfaces, bulk editing, reporting and export, and the account and permission
management around the record. The analysis of the pinned revision classifies such
surfaces as desktop work; a companion does not replace them.

## Alternative-path comparison

| Criterion | Native companion | PWA | WebView | Capacitor |
| --- | --- | --- | --- | --- |
| Offline need | Local queue and storage in the app's own layer; the repository already keeps state across a relaunch on a device | Service worker and browser storage; queue survives but eviction is outside the app's control | Same as PWA, inside a shell | Web queue plus a native bridge; the queue stays a web implementation |
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
desktop-shaped interface that the pinned analysis shows is largely outside the
supported subset: only one of the twelve attempted screens compiles cleanly today.

This decision is a hypothesis to be tested at the device-proof stage, not a
measured advantage. If a PWA turns out to satisfy the offline and attachment needs
on the target devices, that is the cheaper and better answer and nothing here
should stop it from being chosen.

## Confidence and validation

| Field | Value |
| --- | --- |
| Status | `unvalidated hypothesis` |
| Basis | Reproducible findings from the pinned benchmark revision and the shape of the analyzed application; no practitioner feedback |
| Practitioner feedback | None. The guide and synthesis format exist in [`docs/OPERATOR-FEEDBACK.md`](../OPERATOR-FEEDBACK.md); no interview has been held and no feedback was requested |

## Known unknowns

- Whether the actor actually works away from a desktop often enough for the
  workflow to matter.
- Whether a real instance's owner would authorise a tool to talk to it, and under
  which permissions.
- Whether the attachment step is a photo capture, an existing document or both.
- Whether the offline window is minutes or days, which changes the queue design.
- Whether the desktop remainder is accepted by the people doing the work, or
  whether they expect the whole surface on the phone.
