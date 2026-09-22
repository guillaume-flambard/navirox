# Tasks

## 1. Define operational readiness

- [ ] 1.1 Add a readiness-matrix template and a companion-proof checklist.
  Verify the template has supported, simulated, deferred, and excluded outcomes
  for every relevant operational and accessibility condition.
- [ ] 1.2 Link the matrix to both pilot briefs and the proof roadmap. Verify the
  briefs retain their existing non-promises about authentication, offline sync,
  and compliance.

## 2. Establish deterministic acceptance coverage

- [ ] 2.1 Add fixture-level tests for declared network/API failure and recovery
  states, where those states are in a proof workflow. Verify a missing declared
  failure result fails the fixture acceptance test.
- [ ] 2.2 Add device acceptance checks for text scaling, accessible labels,
  actionable touch targets, contrast, and focus/navigation where supported by
  the test harness. Verify unsupported automation is marked deferred with a
  manual review instruction rather than silently passed.

## 3. Apply before device-proof archival

- [ ] 3.1 Complete the matrix for the Vue journey before archiving its device
  evidence. Verify every in-scope row cites a command, retained artifact, or
  explicit exclusion.
- [ ] 3.2 Reuse the same matrix for the Angular journey and add only conditions
  its workflow introduces. Verify the result does not claim real-instance auth,
  offline sync, or compliance support.

## 4. Validate

- [ ] 4.1 Run `pnpm format:check` and `openspec validate
  companion-operational-readiness --strict`. Verify both commands exit 0.
