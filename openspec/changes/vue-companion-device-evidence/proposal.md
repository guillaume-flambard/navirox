# Vue companion device evidence

## Why

The Vue proof has a contracted workflow, an original fixture and an assembled companion whose origins are recorded, but the companion has never driven a device: the assembly change bundled both platforms and stopped there, and the only device evidence in the repository belongs to the records fixture. Nothing yet proves the contracted workflow runs on a phone, and the existing device capture path is written around the records fixture's identifiers, route and scenario, so the field-workflow companion cannot be captured at all.

## What Changes

- Generalise the device capture path so a declared scenario carries its own fixture, route, root test identifier and identifiers instead of the records constants, and so a prepared companion contains the moved shared units the generated screen imports.
- Drive the field-workflow companion on iOS and Android from the declared acceptance scenario's ordered actions, producing one capture per declared moment from the compiled companion.
- Record the device evidence: platform, device and OS, the source revision, the compiler version, the generated screen manifest hash and the path of every artifact.
- Fail the run and record the cause when a declared capture cannot be produced, so an absent capture is never reported as a partial success.
- Keep the behavioural result and the visual comparison apart: the run reports that the actions ran, that every declared capture exists and that the declared identifiers were asserted, while the comparison stays a measurement.
- Re-run the existing records capture regression so the generalisation is proven not to have moved the evidence it already had.
- Out of scope: a cross-platform tolerance or a visual-fidelity pass, unless a separately scoped visual change defines one.

## Capabilities

### New Capabilities

- `companion-device-evidence`: how a proof companion is driven on iOS and Android from its declared acceptance scenario, what provenance every capture carries, how an unavailable capture is reported, and why the behavioural result is not a visual-fidelity claim.

### Modified Capabilities

- None.

## Impact

The affected layer is verification, inside `@memolabs-apps/visual-benchmark` and the shared fixture helper script the capture path already uses. The change touches the capture script and the scenario data it consumes, the device harness only where a scenario needs its own identifiers, `docs/evidence/` and the continuous integration job that produces the Android captures. No source adapter, neutral package or target provider is touched, and no shared contract changes: the App Graph, the inspection report, the source adapter contract and both target schema versions stay at 1.
