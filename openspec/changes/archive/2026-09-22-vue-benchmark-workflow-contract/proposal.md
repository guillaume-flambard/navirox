## Why

The Vue/Nuxt proof journey has a value record but no contracted workflow to
build against: it names an actor, trigger and success state in prose, yet no
fixture, no data and no acceptance scenario exist, so the next change would have
to invent product scope and could pick an action sequence that no platform can
drive without an account. This change turns that record into an implementable
contract, before any companion code exists.

## What Changes

- Re-run the read-only pinned benchmark and record the exact revision and report
  version this decision rests on, so the contract names its immutable input.
- Extend the workflow record with the fields implementation needs: the ordered
  actions, the minimum data each action reads or writes, and the failure state
  the workflow must surface.
- Add one original fixture for the declared workflow: a source screen, synthetic
  data with no real records, and an original asset, all created for this project
  and independent of the benchmark project's own interface, assets or data.
- Add one acceptance scenario that names the ordered action sequence and can
  drive the workflow on web, iOS and Android with no credential, account or real
  service, and validate it through the existing scenario contract.
- Record provenance and the non-affiliation language in the pilot and evidence
  documents, and state that the selected workflow is this project's hypothesis
  rather than the benchmark project's chosen workflow.
- Out of scope: a benchmark connector, copied interface or assets, real data, a
  WebView, any visual-fidelity claim, and any companion implementation.

## Capabilities

### New Capabilities

None. The workflow contract is evidence and fixture behaviour that the existing
workflow-value-evidence capability already governs.

### Modified Capabilities

- `workflow-value-evidence`: the workflow record requirement gains the ordered
  actions, the minimum data and the failure state, and the capability gains a
  requirement that the fixture, its data and the acceptance scenario are
  original, credential-free and driven by one named action sequence.

## Impact

The change belongs to proof planning and verification. It touches the Vue
target provider's fixture directory (`packages/target-vue/fixtures/`), the
shared fixture-application helper under `scripts/lib/`, the scenario and capture
path of `packages/visual-benchmark`, and the pilot and evidence documents under
`docs/`. It adds no runtime, adapter, migration or public-API behaviour, and no
shared contract changes: the App Graph, the inspection report, the source
adapter contract and both target schema versions are untouched.
