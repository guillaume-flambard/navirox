## Why

The Angular proof journey has a pinned benchmark and a pilot brief, but no contracted workflow to
build against. `docs/pilots/suitecrm.md` names the workflow in prose (a field worker opens one
record, updates one field, and attaches a document or a photo) while the benchmark's own routing is
unreadable: the pinned revision keeps an empty route table and loads its real routes at runtime
through federated extensions, so the analysis reports zero routes and one
`angular-remote-configuration` finding rather than guessing. Without a contract the next change would
have to invent the action sequence, decide product scope, and could pick a workflow no platform can
drive without a real instance. This change turns the brief into an implementable contract before any
companion code exists, and keeps the benchmark's uncertainty visible while it does.

## What Changes

- Re-run the read-only pinned SuiteCRM benchmark and record the exact revision, report path and
  counters the decision rests on, preserving the dynamic-route and tested-version findings instead of
  inventing the routes the static reading could not establish.
- Select one independent operational workflow from the readable SuiteCRM-shaped fixture and the
  recorded evidence, and keep it explicitly as this project's own hypothesis rather than the
  benchmark project's workflow.
- Extend the workflow record with the ordered actions, the minimum data each action reads or writes,
  and the failure state the workflow must surface.
- Add one original operational fixture for the Angular journey: this project's own standalone
  component, service, synthetic data and hand-drawn asset, offline and credential-free, with the
  ordered acceptance actions and identifiers declared as data.
- Record provenance and non-affiliation language in the pilot brief and the workflow record, and
  publish the evidence decision.
- Out of scope: a real SuiteCRM instance, connector, login, offline synchronisation, compliance
  claim, copied interface or assets, real records, a WebView, any visual-fidelity claim, and any
  companion implementation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-value-evidence`: the fixture requirement gains the acceptance actions and identifiers
  declared as data, and distinguishes a journey whose target path exists from a journey whose target
  path does not exist yet; a new requirement makes a benchmark-derived workflow record the benchmark's
  unresolved surface and state that the workflow is this project's own.

## Impact

Proof planning and verification for the Angular journey. Touches the Angular source adapter's fixture
directory under `packages/source-angular/fixtures/`, the adapter's tests, and the pilot and evidence
documents under `docs/`. No runtime, adapter, migration or public-API behaviour changes and no shared
contract changes: the App Graph, the inspection report, the source adapter contract and both target
schema versions stay at 1.
