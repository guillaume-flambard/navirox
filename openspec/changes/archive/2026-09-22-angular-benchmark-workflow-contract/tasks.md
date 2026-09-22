## 1. Record the benchmark input and complete the contract

- [x] 1.1 Re-run the read-only pinned SuiteCRM benchmark and record its exact revision, report path and
      counters in the workflow record's source provenance.
      Verify `pnpm test:benchmarks -- --project suitecrm` exits 0 and the record names the revision
      pinned in `benchmarks/catalog.json`.

  `pnpm test:benchmarks -- --project suitecrm` exits 0 printing `suitecrm: angular, 0 routes, 0 screens`
  (log `/tmp/p4-bench.log`). A second run with `--keep` fetched the pinned revision into a temporary
  workspace and `node packages/navirox/dist/bin.js analyze <workspace>/suitecrm --json` confirmed every
  counter in `docs/evidence/angular-suitecrm-benchmark.md` is unchanged: adapter `angular`, framework
  version `18.2.14`, 12286 files, 1588 units (1251 utility, 297 component, 40 state-module), 684
  capability usages, 40 dependencies, 0 routes, 0 screens, findings info 198 / warning 179 / error 0,
  and by code `angular-external-template` 198, `angular-module` 177, `angular-remote-configuration` 1,
  `version-untested` 1. The new record
  `docs/evidence/workflow-suitecrm-record-workflow.md` names the revision
  `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` pinned in `benchmarks/catalog.json`, the reproducing command
  and the machine readable report, and states that the unread federated routing stays a finding rather
  than being guessed.

- [x] 1.2 Add the ordered actions, the minimum data each action reads or writes and the failure state to
      the Angular workflow record and to the template in `docs/WORKFLOW-EVIDENCE.md`.
      Verify the template lists the three fields and `pnpm prettier --check docs/WORKFLOW-EVIDENCE.md`
      exits 0.

  The template in `docs/WORKFLOW-EVIDENCE.md` already carries a `## Workflow contract` section listing
  `Ordered actions:`, `Minimum data:`, `Failure state:` and `Drive identifiers:`, so no template edit was
  needed. The Angular record carries the six ordered actions with the identifier each one acts on
  (`record-workflow-queue`, `record-workflow-select`, `record-workflow-field`, `record-workflow-status`,
  `record-workflow-attach`, `record-workflow-save`), an `| Action | Reads | Writes |` table for all six
  actions, and the failure state (saving while the field value is empty reports that the change was not
  saved, reachable through the declared actions alone with no service and no credential).
  `pnpm prettier --check docs/WORKFLOW-EVIDENCE.md docs/evidence/workflow-suitecrm-record-workflow.md`
  prints `All matched files use Prettier code style!`.

## 2. Create the original operational fixture

- [x] 2.1 Add the workflow's original fixture under `packages/source-angular/fixtures/record-workflow/`:
      a package manifest the adapter detects, a standalone component implementing the workflow locally
      and offline with a reachable failure state, a stateful injectable service, a framework-free data
      module and a hand-drawn asset.
      Verify `pnpm --filter @memolabs-apps/source-angular test` passes and the fixture compiles with no
      external asset or service reference.

  Five files: `package.json` (`fixture-record-workflow`, private, type module, dependency
  `@angular/core ^20.0.0`, deliberately not a workspace member because the pnpm globs are `packages/*`
  and `examples/*`); `src/app/record-workflow.data.ts` (framework free: the invented record set, the
  status and field values, the attachment reference, the ordered acceptance actions with their
  identifiers, the identifiers every state renders, the desktop-only remainder, the execution state and
  the `nextIn` / `canSave` / `saveOutcome` rules); `src/app/record-workflow.service.ts` (an `@Injectable`
  holding the state in signals, which makes it a state-module unit); `src/app/record-workflow.component.ts`
  (a standalone component with an inline template and no `templateUrl`, implementing the workflow
  locally with no network call and a visible failure state); `src/app/site-photo.svg` (a hand-drawn
  original asset). `node packages/navirox/dist/bin.js analyze
  packages/source-angular/fixtures/record-workflow --json` exits 0 with 5 files, 3 units, 1 capability,
  0 findings, and the component classified `candidate` with rule `attachment-signal` because its template
  carries `<input type="file">`. `pnpm --filter @memolabs-apps/source-angular test` passes.

- [x] 2.2 Cover the fixture reading in `packages/source-angular/src/record-workflow.test.ts`: the adapter
      reads the fixture, the workflow component is classified `candidate` with the attachment rule, the
      service is a state module, and the synthetic data equals the declared fixed set.
      Verify the test passes and fails when a network call is added to the fixture.

  `packages/source-angular/src/record-workflow.test.ts` asserts the three unit kinds
  (`component`, `state-module`, `utility`), the component's `candidate` / `attachment-signal`
  classification, the service's `state-module` kind, the declared record set, statuses, field values,
  attachment reference and asset existence, and that no fixture file contains `src="http`, `url(http`,
  `fetch(` or `XMLHttpRequest` (the SVG namespace is deliberately not matched).
  `pnpm --filter @memolabs-apps/source-angular test` reports `Test Files 3 passed (3)` /
  `Tests 32 passed (32)` (was 27 in 2 files). The mutation check was run literally: appending
  `void fetch("/api/records");` to the fixture component made only `references no external asset or
  service` fail (`Tests 1 failed | 31 passed (32)`), and restoring the file returned 32 passing.

- [x] 2.3 Declare the acceptance actions, the test identifiers they act on and the desktop-only
      remainder as data beside the fixture, stating that they are not yet executable.
      Verify a test asserts the declared set and the desktop-only remainder.

  `RECORD_WORKFLOW_ACTIONS` declares the six actions with the identifier each acts on,
  `RECORD_WORKFLOW_IDENTIFIERS` declares the four identifiers every state renders,
  `RECORD_WORKFLOW_DESKTOP_ONLY` declares the four desktop items, and `RECORD_WORKFLOW_EXECUTION` states
  `executable: false` with the reason that the Angular journey has no target path yet. The test
  `declares the acceptance actions and states they are not yet executable` asserts each declared set
  exactly and that the execution state is false with a non-empty reason.

## 3. Cross-check and record

- [x] 3.1 Add a test that compares the declared acceptance actions and identifiers with the Angular
      workflow record document.
      Verify the test fails when a declared identifier is removed from either side and passes when
      restored.

  The test `matches the workflow record it belongs to` reads
  `docs/evidence/workflow-suitecrm-record-workflow.md` and asserts it contains every declared action
  identifier, every declared render identifier, the immutable revision
  `2cd77380bc838b8bd6c80f9fbe25855d73ef860c`, the string `angular-remote-configuration` and the string
  `unvalidated hypothesis`. The mutation check was run literally: replacing `record-workflow-status` with
  `status-moved` in the record made only that test fail (`Tests 1 failed | 31 passed (32)`), and
  restoring the record returned 32 passing.
- [x] 3.2 Record the provenance and non-affiliation language in `docs/pilots/suitecrm.md` and in the new
      workflow record, stating that the workflow is this project's own hypothesis and that the
      benchmark's unread routing stays a finding.
      Verify both documents name the immutable revision and the non-affiliation boundary, and
      `pnpm prettier --check` passes on them.

  `docs/pilots/suitecrm.md` gained a paragraph in `## The one workflow in scope` naming the completed
  record, the immutable revision, the readable fixture the workflow was selected from, the ordered
  actions and their identifiers, the failure state, the fact that it is this project's own hypothesis
  rather than SuiteCRM's chosen workflow, the unread federated routing staying a finding, the actions
  being marked not yet executable, and the absence of any affiliation, request, review or endorsement.
  Both `docs/pilots/suitecrm.md` and `docs/evidence/workflow-suitecrm-record-workflow.md` name
  `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` (grep count 1 in each) and
  `pnpm prettier --check docs/pilots/suitecrm.md docs/evidence/workflow-suitecrm-record-workflow.md`
  prints `All matched files use Prettier code style!`.

## 4. Verify and close

- [x] 4.1 Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format:check`,
      `pnpm deps:check` and `pnpm test:benchmarks -- --project suitecrm`.
      Verify every command exits 0.

  All seven exit 0 with the Angular workflow contract, its original fixture, the new test file and the
  record in the tree: `pnpm build` 0, `pnpm typecheck` 0, `pnpm test` 0, `pnpm lint` 0,
  `pnpm format:check` 0 (`All matched files use Prettier code style!`), `pnpm deps:check` 0
  (`No issues found`), and `pnpm test:benchmarks -- --project suitecrm` 0 printing
  `suitecrm: angular, 0 routes, 0 screens` (logs `/tmp/p4-gate-*.log`).
- [x] 4.2 Run `openspec validate angular-benchmark-workflow-contract --strict` before implementation and
      before archival, then archive the change.
      Verify no task is marked complete until its stated command or artifact exists.

  `openspec validate angular-benchmark-workflow-contract --strict` printed
  `Change 'angular-benchmark-workflow-contract' is valid` before implementation and again before
  archival, and `openspec archive angular-benchmark-workflow-contract --yes` archived the change as
  `2026-09-22-angular-benchmark-workflow-contract`, applying its delta to
  `openspec/specs/workflow-value-evidence/spec.md` (`+ 1 added, ~ 1 modified`), with the archive
  reporting 8 of 9 tasks because this task is the archival itself. Every task was left unchecked until
  its stated command or artifact existed.
