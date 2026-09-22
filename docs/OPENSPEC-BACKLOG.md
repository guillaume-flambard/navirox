# OpenSpec proof-journeys backlog

This backlog is intentionally a sequence of small changes, not a promise to do
all of them. Create a change only after its dependencies are true. A change must
carry a proposal, design, tasks, and only the spec deltas that alter a stable
capability. Do not archive a change until its task-level evidence exists and
`openspec validate <change> --strict` passes.

## 0. `proof-journey-execution-system` (this change)

**Depends on:** existing product, pilot, visual, release, and evidence docs.

**Delivers:** the agent entry point, program gates, and this backlog.

**Done when:** the documents define precedence, verified state, stage exits,
and a dependency-ordered implementation path; `AGENTS.md` and OpenSpec context
point to the entry point; strict validation passes.

**Out of scope:** changing a runtime, adapter, target compiler, benchmark, or
any public claim.

## 1. `vue-benchmark-workflow-contract`

**Depends on:** P0; the pinned Baserow diagnostic and `docs/pilots/baserow.md`.

**Tasks:**

1. Re-run the read-only pinned Baserow benchmark and record the exact revision
   and report version used by this decision.
2. Select one independent field-work workflow from evidenced findings. Define
   actor, trigger, success state, minimum data, actions, failure state, and
   desktop-only remainder. Do not state that it is Baserow's chosen workflow.
3. Create original fixture data and assets plus an acceptance scenario that can
   drive web, iOS, and Android paths without credentials.
4. Record the provenance and non-affiliation language in the pilot/evidence
   documents; validate the proposal strictly.

**Done when:** a future agent can implement exactly one workflow without needing
an external account or deciding product scope. **Verify:** benchmark command,
fixture/acceptance test, and strict OpenSpec validation. **Out of scope:** a
Baserow connector, copied UI/assets, real data, WebView, visual-fidelity claim.

## 2. `vue-companion-source-to-target`

**Depends on:** `vue-benchmark-workflow-contract`; P1 contract accepted.

**Tasks:**

1. Extend only the Vue target subset needed by the declared original fixture,
   with unsupported constructs producing explicit findings.
2. Compile from the pinned fixture source and record screen/component provenance.
3. Move only planner-approved portable/shared units; create native replacements
   for the remaining workflow behavior and list each manual file with its reason.
4. Build the iOS and Android applications from a clean generated output and add
   deterministic behavior tests before device automation.

**Done when:** the companion is traceable from source to native build and no
manual replacement is concealed. **Verify:** target/package tests, provenance
check, clean platform builds, and strict validation. **Out of scope:** Baserow
source emission, generic Nuxt conversion, visual fidelity, release publishing.

## 3. `vue-companion-device-evidence`

**Depends on:** `vue-companion-source-to-target`; the existing device-capture
driver.

**Tasks:**

1. Make the workflow's acceptance scenario drive the generated companion on iOS
   and Android from the same named action sequence.
2. Capture every declared moment and preserve device, OS, source revision,
   compiler revision, manifest hash, and artifact locations.
3. Make unavailable captures fail and record their cause; retain a concise
   report that distinguishes behavioral pass from visual measurement.
4. Re-run the relevant existing native and capture regressions.

**Done when:** both platforms pass the same reproducible behavior proof and the
evidence names its limits. **Verify:** iOS and Android automation/capture
commands plus strict validation. **Out of scope:** cross-platform tolerance or
visual-fidelity pass unless a separately scoped visual change defines it.

## 4. `angular-benchmark-workflow-contract`

**Depends on:** Vue P3, the pinned SuiteCRM diagnostic, and
`docs/pilots/suitecrm.md`.

**Tasks:**

1. Re-run the read-only SuiteCRM benchmark and preserve the dynamic-route and
   tested-version findings rather than guessing missing routes.
2. Select one independent operational workflow from the readable fixture and
   evidence. If record update plus attachment is no longer defensible, replace
   it with an explicitly evidenced narrower workflow.
3. Define original synthetic data, assets, acceptance actions, and the
   desktop-only remainder without real instance authentication or data.
4. Publish the evidence decision and strict OpenSpec validation.

**Done when:** Angular implementation scope is deterministic despite the
benchmark's unresolved runtime routing. **Verify:** benchmark command,
fixture/acceptance test, strict validation. **Out of scope:** a real SuiteCRM
instance, connector, login, offline sync, compliance claim, or copied UI.

## 5. `angular-companion-source-to-target`

**Depends on:** `angular-benchmark-workflow-contract`; P4 contract accepted.

**Tasks:**

1. Decide whether the native companion consumes the neutral graph, a defined
   adapter output, or a bounded manual bridge; document why the chosen seam is
   sufficient and keep Angular imports in `source-angular`.
2. Generate or assemble the original companion with traceable portable/shared
   units and named manual native replacements.
3. Make unsupported behavior explicit, then produce clean iOS and Android
   builds and deterministic behavior tests.

**Done when:** the source-to-native path proves the declared workflow without
claiming an Angular UI compiler. **Verify:** seam-boundary tests, package tests,
clean platform builds, strict validation. **Out of scope:** generic Angular
screen conversion or a provider-specific type leaking into public APIs.

## 6. `angular-companion-device-evidence`

**Depends on:** `angular-companion-source-to-target`; device-capture baseline.

**Tasks:**

1. Run the one declared Angular workflow on iOS and Android with a shared action
   sequence and repeatable reset/seeding.
2. Retain capture and behavior artifacts with source/compiler/device provenance.
3. Publish an evidence report whose limitations repeat the SuiteCRM benchmark
   uncertainty and no-affiliation boundary.

**Done when:** both native platforms prove the bounded companion behavior.
**Verify:** platform automation/capture commands and strict validation. **Out of
scope:** a visual-fidelity assertion or a claim about a real SuiteCRM instance.

## 7. `proof-journeys-release-evidence`

**Depends on:** Vue P3 and Angular P6; current release-candidate evidence.

**Tasks:**

1. Create a proof index that links each command, immutable input, artifact,
   limitation, and release status without duplicating evidence documents.
2. Review README and public-facing language against the pilot, marketing,
   visual, and installation constraints.
3. Re-run the documented consumer installation path. If public npm remains
   incomplete, state that fact and publish only the verified tarball path.

**Done when:** an outside evaluator can distinguish the two proofs from public
installation and broad product support. **Verify:** full documentation checks,
release verification, strict validation. **Out of scope:** publishing packages,
creating a store listing, asserting partnerships, or raising support status.

## Required change template

For each entry, the proposal SHALL state the stage, affected architectural layer,
dependencies, exact capability paths, and non-goals. The design SHALL preserve
both seams and describe any rejected shortcut. Every task SHALL name a command or
observable artifact that proves it, keep the workspace green after its increment,
and update the relevant evidence beside the behavior. A new stable requirement
belongs in a spec delta; a one-off execution report does not invent a public
capability.

## Separate developer-preview sequence

The `vue-nuxt-developer-preview-contract` change governs the narrower public
readiness promise. Its dependency-ordered CI, distribution, external-validation,
deterministic-transform and optional-LLM changes live in
[`docs/DEVELOPER-PREVIEW.md`](DEVELOPER-PREVIEW.md). They do not replace the
proof-journeys program or advance its companion-evidence gates.

## Cross-cutting proposals now ready for review

These proposals refine the proof program without authorizing their
implementation. `workflow-value-evidence` is a prerequisite for selecting the
Vue workflow. `companion-operational-readiness` and `proof-artifact-governance`
must complete before either device-evidence change is archived.
`angular-neutral-seam-proof` is a prerequisite for the Angular companion path.

- `workflow-value-evidence`: establish user-value, alternative-path, and
  workflow-selection evidence before a companion is built.
- `companion-operational-readiness`: make accessibility and explicitly bounded
  failure behavior part of a companion proof.
- `proof-artifact-governance`: keep demonstration inputs and retained artifacts
  safe, traceable, and fresh without rewriting historical evidence.
- `angular-neutral-seam-proof`: require the Angular proof to exercise the
  neutral source seam rather than being a manually written native application.
