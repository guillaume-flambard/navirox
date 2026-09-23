# Operational readiness matrix

A proof companion can pass a device journey and still be unusable in the field.
This matrix records, for every operational and accessibility condition relevant
to a journey, one of four outcomes, so a reader can tell what was proved from
what was assumed.

- **supported**: the journey provides it, and an observable result proves it.
- **simulated**: the journey provides a stand-in (a local fixture instead of a
  service, for example), and an observable result proves the stand-in.
- **deferred**: it is not implemented yet, and the row names the manual review
  method that would settle it.
- **excluded**: it is out of scope for this journey, and the row says why.

A row whose outcome is `supported` or `simulated` cites a command or a retained
artifact. A row whose outcome is `deferred` names a manual review method.
Nothing deferred or excluded may be presented as a supported capability in
published evidence, and no row implies a real-instance authentication, offline
synchronization or compliance capability that was not demonstrated.

## Checklist

Every journey records a row for each condition below.

Operational conditions: network available; network unavailable; request failure;
request recovery; authentication against a real instance; offline queue and
synchronization; data residency, retention and audit; crash or restart with
unsaved input; device storage for attachments; desktop-only remainder.

Accessibility conditions: text scaling; semantic labels; touch targets;
contrast; focus and navigation.

## The journeys

| Journey | Workflow                      | Command                                                                            | Evidence                                                                                                         |
| ------- | ----------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Vue     | field record update           | `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios` | `docs/evidence/native-capture-field-workflow-ios.json`, `docs/evidence/vue-companion-device-evidence.md`         |
| Angular | record update with attachment | `node scripts/capture-angular-companion.mjs --platform ios`                        | `docs/evidence/angular-companion-device-evidence-ios.json`, `docs/evidence/angular-companion-device-evidence.md` |

## Vue journey: field record update

| Condition                              | Outcome   | Evidence or reason                                                                                                                                                                                           |
| -------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| network available                      | excluded  | The companion performs no request: the fixture data is local, so a network changes nothing.                                                                                                                  |
| network unavailable                    | simulated | The prepared application is offline by construction, which the bundle check and the device run prove.                                                                                                        |
| request failure                        | excluded  | No request exists in this workflow. The declared failure state is a save with no status, proved by the `interrupted` capture.                                                                                |
| request recovery                       | excluded  | No request exists in this workflow.                                                                                                                                                                          |
| authentication against a real instance | deferred  | Manual review: an operator with an instance decides whether a token and a permission scope are acceptable. `docs/evidence/workflow-baserow-field-work.md` records the workflow as an unvalidated hypothesis. |
| offline queue and synchronization      | deferred  | Manual review: the change is kept for the session only; a queue and a conflict policy need an operator decision.                                                                                             |
| data residency, retention and audit    | excluded  | Out of scope: no real records, no customer data, no residency claim.                                                                                                                                         |
| crash or restart with unsaved input    | deferred  | Manual review: the fixture keeps state in memory, so a restart behaviour has to be decided.                                                                                                                  |
| device storage for attachments         | simulated | The attachment is a local reference created for this project; the device run proves it rendered after the declared attach action.                                                                            |
| desktop-only remainder                 | excluded  | Administration, bulk editing, reporting and accounts stay on the desktop by the contract.                                                                                                                    |
| text scaling                           | deferred  | Manual review: read the screen at the largest system text size and confirm the rows stay readable and reachable.                                                                                             |
| semantic labels                        | deferred  | Manual review: confirm each actionable element announces a meaningful label to a screen reader.                                                                                                              |
| touch targets                          | supported | The device harness presses each declared identifier at its centre, which the five captures prove.                                                                                                            |
| contrast                               | deferred  | Manual review: the fixture uses the project palette, and a contrast check needs a designer's review.                                                                                                         |
| focus and navigation                   | supported | The harness drives the declared sequence in order and every capture exists, which the run report proves.                                                                                                     |

## Angular journey: record update with attachment

| Condition                              | Outcome   | Evidence or reason                                                                                                                |
| -------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| network available                      | excluded  | The companion performs no request, so a network changes nothing.                                                                  |
| network unavailable                    | simulated | The companion is offline by construction: the fixture and the generated screen contain no request, which the device run proves.   |
| request failure                        | excluded  | No request exists in this workflow.                                                                                               |
| request recovery                       | excluded  | No request exists in this workflow.                                                                                               |
| authentication against a real instance | deferred  | Manual review: the discovery days in `docs/pilots/suitecrm.md` decide API and authentication ownership with the instance owner.   |
| offline queue and synchronization      | deferred  | Manual review: the workflow keeps a change for the session only; a queue and a conflict policy need an operator decision.         |
| data residency, retention and audit    | excluded  | Out of scope: no real instance, no customer data, no compliance claim.                                                            |
| crash or restart with unsaved input    | deferred  | Manual review: the screen keeps state in memory, so a restart behaviour has to be decided.                                        |
| device storage for attachments         | simulated | The attachment is a local reference created for this project; the device run proves it rendered after the declared attach action. |
| desktop-only remainder                 | excluded  | Administration and configuration surfaces, bulk editing, reporting and accounts stay on the desktop by the contract.              |
| text scaling                           | deferred  | Manual review: read the screen at the largest system text size and confirm the rows stay readable and reachable.                  |
| semantic labels                        | deferred  | Manual review: confirm each actionable element announces a meaningful label to a screen reader.                                   |
| touch targets                          | supported | The device harness presses each declared identifier at its centre, which the five captures prove.                                 |
| contrast                               | deferred  | Manual review: the fixture uses the project palette, and a contrast check needs a designer's review.                              |
| focus and navigation                   | supported | The harness drives the declared sequence in order and every capture exists, which the run report proves.                          |

## How this is checked

`packages/visual-benchmark/src/readiness-matrix.test.ts` reads this document and
asserts that every condition above appears for both journeys with one of the four
outcomes, that every `supported` or `simulated` row cites a command or an
artifact, and that every `deferred` row names a manual review method. A row that
is removed fails the test.
