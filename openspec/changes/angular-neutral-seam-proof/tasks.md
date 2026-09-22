# Tasks

## 1. Specify the traceable seam path

- [ ] 1.1 Identify the existing Angular adapter output, neutral App Graph record,
  planner decision, or portable unit that the selected companion can consume.
  Verify the choice is produced by an inspection fixture and has source location
  provenance.
- [ ] 1.2 Write an Angular proof provenance record that names each handoff from
  source input to companion behavior and every manual native replacement. Verify
  a reviewer can distinguish generated, migrated, and hand-written material.

## 2. Preserve architecture boundaries

- [ ] 2.1 Extend the relevant import-boundary tests for the Angular proof path.
  Verify a deliberate Angular import in a neutral package and a target-provider
  import in `source-angular` both fail.
- [ ] 2.2 Add a fixture acceptance test proving the companion consumes the
  declared neutral output or portable/shared unit. Verify replacing that input
  with an unrelated manual value fails the test.

## 3. Record the limits

- [ ] 3.1 Update the Angular proof evidence to state that template-to-native
  screen generation is not demonstrated. Verify the evidence continues to state
  the SuiteCRM dynamic-route and version uncertainty.

## 4. Validate

- [ ] 4.1 Run `pnpm format:check`, the affected package tests, and `openspec
  validate angular-neutral-seam-proof --strict`. Verify every command exits 0.
