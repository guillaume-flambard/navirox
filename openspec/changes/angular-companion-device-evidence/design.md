# Design: Angular companion device evidence

## Context

The Angular companion is assembled: a hand-written screen at the application
root, the shared module the planner approved copied byte for byte beside it, and
a provenance record that names every origin. The workflow it implements is
contracted in `docs/evidence/workflow-suitecrm-record-workflow.md`, and the seam
it consumes is recorded in `docs/evidence/angular-neutral-seam-proof.md`.

The existing device capture path prepares a companion by compiling a fixture
screen (`installGeneratedScreen`), captures a served web page beside each device
capture (`captureWebChrome`), runs the scenario through `runScenario` and
evaluates a declared cross-platform tolerance. The Angular journey has no target
compiler, no served route and no web counterpart, so none of that applies.

What does apply is the device harness in
`packages/visual-benchmark/src/device-harness.ts`: it is installed into any
prepared application, reads the scenario path, the capture key, the root test
identifier and the declared identifiers from the environment, drives the declared
actions and writes one screenshot per capture. `captureNativeDevice` runs exactly
one capture through `detox test --testNamePattern <key>` and fails when the
screenshot is absent.

## Goals and non-goals

Goals: a device-capturable Angular companion; one shared action sequence for iOS
and Android; a reproducible starting state; provenance that names the device and
the screen honestly; an evidence report that states its limits.

Non-goals: no web counterpart and no comparison; no visual-fidelity claim; no
Angular target compiler; no real SuiteCRM instance, connector or credential; no
change to the App Graph, the inspection report, the source adapter contract or
either target schema version.

## Decisions

1. The device harness and `captureNativeDevice` are reused with a device-only
   scenario file, rather than adding a web counterpart or a scenario-schema flag.
   Rejected: inventing a served web page for an Angular component, and adding a
   device-only flag to `VisualScenario` (that schema belongs to the web
   comparison path, and this journey has no comparison to declare).
2. The companion is prepared from its fixture record. `ANGULAR_COMPANION_FIXTURE`
   already names the directory the adapter reads and the screen to install, so the
   shared helpers gain a preparation path that writes a declared screen instead of
   calling `installGeneratedScreen`.
   Rejected: a second preparation module, and importing the screen from the
   repository at bundle time (the application is scaffolded outside the checkout
   and installed from packed artifacts).
3. The action sequence is the declared `RECORD_WORKFLOW_ACTIONS` data mapped to
   the five capture moments.
   Rejected: a new hand-written list inside the capture script, which would drift
   from the record, and a `VisualScenario`, which would claim a route.
4. Seeding is a fresh instance per run from the fixed synthetic data, and the
   first capture asserts the initial state.
   Rejected: relying on the previous run's state, and adding a reset endpoint.
5. Provenance is a device-evidence record naming the platform, the device, the
   source revision, that no target compiler produced the screen, the content
   hashes of the screen and of the copied module, every artifact path and the
   declared actions, plus the statement that no web counterpart exists.
   Rejected: prose only, and reusing the tolerance verdict, which needs two
   captures to compare.
6. iOS runs locally on the simulator and Android runs in continuous integration,
   extending the existing capture jobs.
   Rejected: a new job, and skipping Android.

## Contract change questions

Why the current arrangement is insufficient: the device-evidence requirement
names the compiler version and the manifest hash of a generated screen, and this
journey has neither. Which real consumer demonstrated the need: the Angular proof
journey and its assembled companion. Why adapter metadata is not enough: the
missing piece is a rule about what a device run may record, which belongs to the
verification capability rather than to a source adapter. Whether the schema
version changes: no. The App Graph, the inspection report, the source adapter
contract and both target schema versions stay at 1.

## Risks and trade-offs

The iOS simulator intermittently reports the application as busy until the
harness's settle attempts are exhausted (mitigated by the two-attempt retry now
in the capture steps; a real defect still fails both attempts). The harness
depends on the declared identifiers, so a scenario that drifts from the record
would drive nothing (mitigated by a test comparing the scenario with
`RECORD_WORKFLOW_ACTIONS`). The record could drift from the screen it describes
(mitigated by recording content hashes and by a mutation check). A reader could
take the device run for a fidelity claim (mitigated by the evidence report
stating the opposite in its opening line and in a closing section).

## Migration Plan

None.
