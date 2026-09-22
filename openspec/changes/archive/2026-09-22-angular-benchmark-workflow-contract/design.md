## Context

The Angular proof journey has everything except a contracted workflow. The pinned SuiteCRM revision is
recorded in `benchmarks/catalog.json` (commit `2cd77380bc838b8bd6c80f9fbe25855d73ef860c`, source
directory `.`, adapter `angular`, baselines minimumRoutes 0 / minimumScreens 0 / minimumUnits 1588) and
analysed read only; `docs/evidence/angular-suitecrm-benchmark.md` records 12286 files, 1588 units, 684
capability usages, 0 routes and 0 screens with `angular-external-template` 198, `angular-module` 177,
`angular-remote-configuration` 1 and `version-untested` 1; `docs/pilots/suitecrm.md` names the workflow
in prose and states the non-affiliation boundaries.

Three facts shape this change. First, the benchmark's routing is genuinely unreadable: the shell route
table is an empty literal `Routes` array and the real routes arrive through federated extension
loading, so the analysis reports the unread mechanism instead of inventing routes. Second, the readable
SuiteCRM-shaped fixture at `packages/source-angular/fixtures/suitecrm-app` classifies the workflow's
three signals as `candidate` (`attachment-signal` on the attachment component, `device-capability-signal`
on the record detail, `record-update-signal` on the update form) and the configuration surface as
`desktop-only`, so the workflow can be selected from readable evidence rather than from the unread
benchmark routes. Third, the Angular journey has no target compiler and no served web route, so the
acceptance contract cannot be a `VisualScenario`; it has to be data declared beside an original fixture.

## Goals / Non-Goals

**Goals**

- One contracted workflow for the Angular journey, implementable without deciding product scope: named
  ordered actions, the minimum data each action reads or writes, a success state with bounded data
  assumptions, a failure state, and a desktop-only remainder.
- One original operational fixture (component, service, synthetic data, hand-drawn asset) that is
  offline and credential-free and that the adapter reads as a `candidate` workflow.
- One declared acceptance contract beside the fixture, honest that it is not yet executable.
- The benchmark's unresolved routing preserved as a finding, with the workflow labelled this project's
  own hypothesis.

**Non-Goals**

- No real SuiteCRM instance, connector, login, offline synchronisation or compliance claim.
- No copied interface, asset or record, and no benchmark data.
- No generic Angular template compiler, no native Angular screen generation and no target provider work.
- No visual-fidelity claim and no device evidence for the Angular journey (those are later stages).
- No change to the App Graph, the inspection report, the source adapter contract or either target
  schema version.

## Decisions

### The workflow stays record update plus attachment

The workflow stays "a field worker opens one record, updates one field, and attaches a document or a
photo". It is defensible because the readable fixture classifies it `candidate` on three separately
observable signals and the pinned revision reports 684 capability usages and 40 state modules, so a
narrower replacement is not needed. Rejected: narrowing the workflow to a single action (the fixture
evidence supports the three-signal shape, and narrowing would discard the attachment path the analysis
actually observed) and widening it to the desktop configuration surface (the analysis classifies that
`desktop-only`).

### The acceptance contract is data beside an original fixture

The ordered actions, the identifiers they act on and the desktop-only remainder are declared in a
framework-free module beside the fixture, and a test compares them with the workflow record document.
Rejected: a `VisualScenario` (the Angular journey has no served route and no capture path, so the
scenario contract does not apply), an inline list inside a script (the same information would live in
two formats and drift), and prose in the record only (nothing to assert).

### The original fixture is a local, offline component

The fixture implements the workflow locally: queue, select, edit one field, cycle status, attach and
save, with a reachable visible failure state when saving without a field value. It uses no network call
so it needs no credential and no service, and its file input carries the attachment signal the adapter
already classifies. Rejected: copying the SuiteCRM-shaped fixture's `fetch` call (it would imply a
service and a credential), reusing the benchmark's own files (the pilot brief forbids copying its
interface, assets and data), and a hand-written native screen (nothing to do with the source adapter).

### The benchmark's uncertainty is a requirement, not a note

The delta adds a requirement that a benchmark-derived workflow record the unresolved surface, name the
readable fixture it was selected from, and state that the workflow is this project's own. Rejected:
recording the uncertainty in prose only (the Vue journey already showed that a record is what keeps the
distinction alive), and dropping the benchmark route question (it is the honest reason the workflow is
selected from the fixture instead of from the benchmark's routes).

## Contract change questions

Per `docs/repositioning/AGENT-GUIDE.md` section 12:

- **Why the current arrangement is insufficient:** the workflow-value-evidence capability requires a
  workflow record and an original fixture but says nothing about a journey whose target path does not
  exist yet, and nothing about preserving a benchmark's unread surface, so an Angular record could
  claim an executable scenario that was never run or invent routes the analysis did not establish.
- **Which real consumer demonstrated the need:** the Angular proof journey and its pinned SuiteCRM
  benchmark, whose route table is an empty literal array and whose real routes arrive through federated
  extension loading reported as `angular-remote-configuration`.
- **Why adapter owned metadata is not enough:** the missing piece is not a source fact but a rule about
  what a workflow record may claim, and that rule belongs to the framework-neutral
  workflow-value-evidence capability rather than to the Angular adapter.
- **Whether the schema version changes:** no. The App Graph, the inspection report, the source adapter
  contract and both target schema versions stay at 1; the change adds no shared model, only two
  requirement changes in an existing capability.

## Risks / Trade-offs

- **A record could still overclaim.** Mitigation: the requirement forbids claiming a scenario that was
  never run, and a test compares the declared actions and identifiers with the record.
- **The fixture could drift from the record.** Mitigation: one test reads both and fails when an action
  or identifier is missing from either side.
- **The synthetic data could grow into a product model.** Mitigation: a fixed small invented set
  asserted by a test.
- **The Angular journey could be read as screen conversion.** Mitigation: the record and the pilot
  brief state that no template-to-native generation is demonstrated, and
  `angular-neutral-seam-proof` carries that boundary into the companion stage.
- **A version-untested finding could be mistaken for a defect.** Mitigation: the record names the
  declared `@angular/core` 18.2.14 and the tested `^20`/`^21` range, and the fixture declares the tested
  range so classification tests are not drowned by the finding.

## Migration Plan

None. Nothing shipped changes behaviour: the change adds one fixture, its tests and two documents, and
the existing Vue journey, the records fixture and the benchmark profile are untouched.
