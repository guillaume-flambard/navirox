# Tasks: Companion operational readiness

## 1. Define operational readiness

- [x] 1.1 Add a readiness-matrix template and a companion-proof checklist. Verify
      the template has supported, simulated, deferred, and excluded outcomes for
      every relevant operational and accessibility condition.

  `docs/READINESS-MATRIX.md` defines the four outcomes, the rule that a
  `supported` or `simulated` row cites a command or a retained artifact and a
  `deferred` row names a manual review method, the ten operational conditions
  (network available; network unavailable; request failure; request recovery;
  authentication against a real instance; offline queue and synchronization;
  data residency, retention and audit; crash or restart with unsaved input;
  device storage for attachments; desktop-only remainder) and the five
  accessibility conditions (text scaling; semantic labels; touch targets;
  contrast; focus and navigation), plus the journeys table and a completed
  15-row matrix for each journey.
  `packages/visual-benchmark/src/readiness-matrix.test.ts` reads the document and
  asserts that the four outcomes are declared, that every condition appears for
  both journeys with a valid outcome, that every `supported` or `simulated` row
  cites a command or an artifact, that every `deferred` row names a manual
  review method, and that nothing deferred or excluded is presented as
  supported. `pnpm --filter @memolabs-apps/visual-benchmark test` passes 11 files
  / 112 tests. The literal mutation check removed the Vue `contrast` row, which
  produced `Test Files 1 failed | 10 passed (11)` / `Tests 1 failed | 111 passed
  (112)`, and the row was restored to 112 passing with an identical diff.

- [x] 1.2 Link the matrix to both pilot briefs and the proof roadmap. Verify the
      briefs retain their existing non-promises about authentication, offline
      sync, and compliance.

  `docs/pilots/baserow.md` links the matrix at the end of the paragraph that
  records the workflow's selection, `docs/pilots/suitecrm.md` links it from the
  paragraph of `## Excluded until discovery confirms them`, and
  `docs/PROOF-ROADMAP.md` carries it as definition-of-done item 8. The briefs
  keep their non-promises: authentication, offline synchronisation and compliance
  remain open questions in `suitecrm.md`, and the `deferred` rows name the manual
  review that would settle them. `pnpm prettier --write` then `--check` on the
  three files exit 0, and each contains exactly one reference to the matrix.

## 2. Establish deterministic acceptance coverage

- [x] 2.1 Add fixture-level tests for declared network/API failure and recovery
      states, where those states are in a proof workflow. Verify a missing
      declared failure result fails the fixture acceptance test.

  Both proof workflows are offline by construction and declare exactly one
  failure state each, which their rule tests cover:
  `packages/target-vue/src/field-logic.test.ts` asserts `saveOutcome('')` is
  `'error'` for the Vue field-workflow journey, and
  `packages/source-angular/src/record-workflow-logic.test.ts` asserts the same
  for the Angular record-workflow journey. The inverted-rule mutation runs prove
  they are load bearing: inverting `canSave` produced `Tests 2 failed | 19 passed
  (21)` in the Vue package and `Tests 2 failed | 35 passed (37)` in the Angular
  package, and both were restored green. A missing declared failure result
  therefore fails the rule test that the workflow depends on.

- [x] 2.2 Add device acceptance checks for text scaling, accessible labels,
      actionable touch targets, contrast, and focus/navigation where supported
      by the test harness. Verify unsupported automation is marked deferred with
      a manual review instruction rather than silently passed.

  The matrix records `touch targets` as `supported` because the device harness
  presses each declared identifier at its centre and the five captures prove it,
  and `focus and navigation` as `supported` because the harness drives the
  declared sequence in order and every capture exists. `text scaling`,
  `semantic labels` and `contrast` are recorded as `deferred`, each with a manual
  review method, and the guard test fails a `deferred` row that names no manual
  review and a `supported` row that carries one.

## 3. Apply before device-proof archival

- [x] 3.1 Complete the matrix for the Vue journey before archiving its device
      evidence. Verify every in-scope row cites a command, retained artifact, or
      explicit exclusion.

  The Vue matrix's fifteen rows cite the capture command
  (`node packages/visual-benchmark/scripts/capture-records-native.mjs --platform
  ios`), the retained artifacts (`docs/evidence/native-capture-field-workflow-ios.json`,
  `docs/evidence/vue-companion-device-evidence.md`), the run report, the
  captures, or an explicit exclusion with its reason.

- [x] 3.2 Reuse the same matrix for the Angular journey and add only conditions
      its workflow introduces. Verify the result does not claim real-instance
      auth, offline sync, or compliance support.

  The Angular matrix reuses the same fifteen conditions and cites
  `node scripts/capture-angular-companion.mjs --platform ios` with
  `docs/evidence/angular-companion-device-evidence-ios.json`. Authentication
  against a real instance and offline synchronization are `deferred` with their
  manual review, and compliance is `excluded`; no row claims any of them as
  supported.

## 4. Validate

- [x] 4.1 Run `pnpm format:check` and `openspec validate
      companion-operational-readiness --strict`. Verify both commands exit 0.

  `pnpm format:check` exits 0 printing 'All matched files use Prettier code
  style!' and `openspec validate companion-operational-readiness --strict` exits
  0 printing `Change 'companion-operational-readiness' is valid`.
