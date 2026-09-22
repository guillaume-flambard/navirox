# Tasks

## 1. Specify the traceable seam path

- [x] 1.1 Identify the existing Angular adapter output, neutral App Graph record,
  planner decision, or portable unit that the selected companion can consume.
  Verify the choice is produced by an inspection fixture and has source location
  provenance.

  The consumed output is the planner decision on
  `angular:src/app/record-workflow.data.ts:utility:default`, classified `shared`
  with rule `unit-shared-logic` and source evidence
  `{ kind: 'source', value: 'src/app/record-workflow.data.ts' }`. It is produced
  by a real inspection of `packages/source-angular/fixtures/record-workflow`,
  which reads 5 files, 3 units and 1 capability with no finding, so the choice
  carries source location provenance rather than a name. The same module is the
  workflow's contract as data: it declares the ordered actions, the identifiers
  they act on, the fixed synthetic record set, the desktop-only remainder and the
  `nextIn` / `canSave` / `saveOutcome` rules. The decision was read from
  `node packages/navirox/dist/bin.js plan -C packages/source-angular/fixtures/record-workflow --json`
  and is asserted by the new CLI test.

- [x] 1.2 Write an Angular proof provenance record that names each handoff from
  source input to companion behavior and every manual native replacement. Verify
  a reviewer can distinguish generated, migrated, and hand-written material.

  `docs/evidence/angular-neutral-seam.provenance.json` is the machine-readable
  record and `docs/evidence/angular-neutral-seam-proof.md` is the prose record.
  They name the four handoffs (source input to `source-angular` inspection, that
  inspection to the neutral App Graph, the graph to the planner decision, the
  decision to the companion behaviour), the consumed unit above, and the two
  manual native replacements: the component
  `angular:src/app/record-workflow.component.ts:component:default`
  (`native-replacement`, `unit-view-layer`) and the capability
  `angular:src/app/record-workflow.component.ts:capability:file-reading:read`
  (`manual`, `capability-no-counterpart`). The document states that neither is
  described as generated from Angular templates or as generic Angular
  conversion. `packages/cli/src/angular-seam.test.ts` compares the plan with the
  record, so the record cannot drift from the chain.

## 2. Preserve architecture boundaries

- [x] 2.1 Extend the relevant import-boundary tests for the Angular proof path.
  Verify a deliberate Angular import in a neutral package and a target-provider
  import in `source-angular` both fail.

  `packages/source/src/boundary.test.ts` gained two tests: `scans the adapter
  packages, including the Angular proof path` (the scan reaches more than five
  adapter files and includes `source-angular`) and `keeps target provider imports
  out of the source adapters` (every `source-*` package's source is scanned with
  `forbiddenSpecifiers('adapter', ...)`). The neutral side already scanned every
  neutral package for framework specifiers. The check was proved load bearing:
  appending `import '@memolabs-apps/runtime'` to
  `packages/source-angular/src/detect.ts` produced `Test Files 1 failed | 5 passed (6)`
  and `Tests 1 failed | 43 passed (44)` with only the new adapter-side test
  failing; restoring the file returned `Test Files 6 passed (6)` and
  `Tests 44 passed (44)` with an empty `git diff --stat`.

- [x] 2.2 Add a fixture acceptance test proving the companion consumes the
  declared neutral output or portable/shared unit. Verify replacing that input
  with an unrelated manual value fails the test.

  `packages/cli/src/angular-seam.test.ts` drives `packages/source-angular/fixtures/record-workflow`
  through `runCli(['plan', '--json'], io, FIXTURE)` with no injected registry, so
  the real `createAdapterRegistry()` (which includes
  `['@memolabs-apps/source-angular', 'createAngularAdapter']`), the real
  inspection and the real planner all run. Its six tests assert the adapter id,
  the adapter metadata crossing the source seam (`mobileReadiness` state
  `candidate` with rule `attachment-signal` on the component unit), the consumed
  `shared` decision and its rule and evidence, the two manual decisions, the
  match against the provenance record, and the failure case: `consumedDecision`
  returns the shared decision for the declared subject and throws
  `no shared input to consume` when a plan carries the same subject classified
  `manual`. `pnpm --filter @memolabs-apps/cli test` passes 105 tests in 8 files.

## 3. Record the limits

- [x] 3.1 Update the Angular proof evidence to state that template-to-native
  screen generation is not demonstrated. Verify the evidence continues to state
  the SuiteCRM dynamic-route and version uncertainty.

  `docs/evidence/angular-neutral-seam-proof.md` states in its opening that it
  does not demonstrate an Angular template being emitted as a native screen and
  that no Angular target compiler exists, and its `## Limits` section repeats
  that limit plus the unread SuiteCRM routing and the `version-untested` range.
  `docs/evidence/angular-suitecrm-benchmark.md` gained a sentence in its
  `## No claim` section saying the same thing and linking the seam proof
  document, while its dynamic-route and version statements are unchanged.

## 4. Validate

- [x] 4.1 Run `pnpm format:check`, the affected package tests, and `openspec
  validate angular-neutral-seam-proof --strict`. Verify every command exits 0.

  `pnpm format:check` exits 0 (`All matched files use Prettier code style!`),
  `pnpm --filter @memolabs-apps/source test` exits 0 with 44 tests in 6 files,
  `pnpm --filter @memolabs-apps/cli test` exits 0 with 105 tests in 8 files, and
  `openspec validate angular-neutral-seam-proof --strict` exits 0 printing
  `Change 'angular-neutral-seam-proof' is valid`. Logs `/tmp/ase-fc2.log`,
  `/tmp/ase-source-test.log`, `/tmp/ase-cli-test.log`, `/tmp/ase-validate.log`.
