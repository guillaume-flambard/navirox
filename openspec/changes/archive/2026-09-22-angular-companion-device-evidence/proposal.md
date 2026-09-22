# Angular companion device evidence

## Why

The Angular proof companion is assembled and its shared behaviour is traceable to
the neutral model, but it has never run on a device. The Vue device evidence does
not cover it: that path prepares a companion by compiling a fixture screen and
captures a served web page beside it, and the Angular journey has neither a
target compiler nor a served route. Without a device run the Angular proof stops
at "the code is assembled", and the one workflow the contract declares is never
shown to work where it is meant to be used.

## What Changes

- Make the Angular companion device-capturable: the shared fixture helpers can
  prepare a companion whose screen is a declared hand-written file instead of
  compiler output, and a capture command prepares the companion, installs the
  device harness and drives the workflow's declared identifiers.
- Run the one declared workflow on iOS and Android from one shared action
  sequence, with every run starting a fresh instance from the fixed synthetic
  data so the first state is reproducible.
- Retain the captures and the behaviour artifacts with provenance: the platform,
  the device, the source revision, the identity of the screen the companion shows
  (the content hashes of the hand-written screen and of the copied shared module,
  since no target compiler produced it) and every artifact path.
- Record that the journey has no web counterpart, and report no comparison it did
  not make.
- Publish `docs/evidence/angular-companion-device-evidence.md` repeating the
  SuiteCRM benchmark uncertainty and the no-affiliation boundary.

Out of scope: a visual-fidelity assertion, a claim about a real SuiteCRM
instance, an Angular target compiler, and any change to a shared contract.

## Capabilities

New Capabilities = None

Modified Capabilities = `companion-device-evidence`

## Impact

Proof verification for the Angular journey, inside the benchmark package's
capture path and the shared fixture helpers under `scripts/lib/`, plus the CI
capture jobs and `docs/evidence/`. No runtime, adapter, migration or public API
behaviour changes, and no shared contract changes: the App Graph, the inspection
report, the source adapter contract and both target schema versions stay at 1.
