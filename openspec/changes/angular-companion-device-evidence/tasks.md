# Tasks: Angular companion device evidence

## 1. Make the companion capturable

- [x] 1.1 Extend the shared fixture helpers so a fixture that declares a
      hand-written screen can be prepared, and add the device-only scenario that
      maps the declared workflow actions to the five capture moments. Verify a
      test compares the scenario's identifiers with `RECORD_WORKFLOW_ACTIONS` and
      that `pnpm --filter @memolabs-apps/source-angular test` passes.

  `scripts/lib/fixture-app.mjs` gained `installFixtureScreen(appDir, fixture)`,
  which asserts the record declares a screen, writes it to the application root
  as `App.vue` and returns its content hash.
  `packages/visual-benchmark/src/scenarios/angular-companion.ts` declares the
  device-only scenario with the five moments (rest, first-meaningful, midpoint,
  settled, interrupted) whose presses are the identifiers the workflow record
  declares.
  `packages/visual-benchmark/src/angular-companion-scenario.test.ts` reads
  `docs/evidence/workflow-suitecrm-record-workflow.md` and asserts every press
  appears in it, that the five moments are in order, that the four render
  identifiers are declared and that the first capture has no actions:
  `pnpm --filter @memolabs-apps/visual-benchmark test` passes 10 files and 107
  tests, and `pnpm --filter @memolabs-apps/source-angular test` passes 4 files
  and 37 tests.

- [x] 1.2 Add the capture command `scripts/capture-angular-companion.mjs`.
      Verify `node scripts/capture-angular-companion.mjs --platform ios` exits 0
      on the iPhone 17 Pro simulator and prints the evidence record path.

  The command prepares the companion from the fixture record (scaffold, the
  hand-written screen written as the application root, the planner-approved
  module copied byte for byte beside it), asserts the three planner decisions it
  depends on, installs the device harness and its dependencies, installs from
  the packed artifacts, asserts one runtime copy, warms the packager once and
  drives the declared action sequence through the device driver.
  `NAVIROX_DEVICE="iPhone 17 Pro" node scripts/capture-angular-companion.mjs
  --platform ios --keep` exited 0, printed the record path and printed one line
  per capture.

## 2. Run the workflow on both platforms

- [x] 2.1 Capture the declared workflow on iOS and write the evidence record.
      Verify every declared capture exists as a device PNG and the record names
      the platform, the device, the source revision, the content hash of the
      hand-written screen, the content hash of the copied shared module and the
      statement that no target compiler produced the screen.

  That run wrote `docs/evidence/angular-companion-device-evidence-ios.json` with
  the five captures and their hashes, the device `iPhone 17 Pro`, the benchmark
  revision `2cd77380bc838b8bd6c80f9fbe25855d73ef860c`, the hand-written screen's
  content hash, the copied module's content hash and
  `producedByCompiler: false` with the note that the journey has no target
  compiler.

- [x] 2.2 Produce the Android capture in continuous integration and keep the
      artifacts. Verify the capture job uploads the scenario's capture directory
      and the evidence record.

  `.github/workflows/ci.yml` now runs `node
  scripts/capture-angular-companion.mjs --platform android --workspace
  "$RUNNER_TEMP/capture-angular-companion-android"` in the `capture-android`
  emulator step and uploads `${{ runner.temp
  }}/capture-angular-companion-android/app/scenario-artifacts` with
  `docs/evidence/angular-companion-device-evidence-*.json`. The `capture-ios`
  job runs the same command for iOS in a two-attempt retry loop and uploads the
  same paths. `pnpm prettier --check .github/workflows/ci.yml` is clean and the
  workflow still parses with its seven jobs.

- [x] 2.3 Make an absent capture fail the run and name its cause. Verify a run
      with a deliberately removed capture exits nonzero and records the capture
      and the reason.

  A driver-level check against the built package called `captureNativeDevice`
  with a runner that reported success and wrote no screenshot. It threw
  `CaptureMissingError` with `capture: rest` and the message `capture 'rest'
  missing: the android device run exited 0 but wrote no screenshot at <path>`.
  The capture command turns that into a nonzero exit through its own `missing`
  assertion, and the continuous integration capture jobs exercise the real path.

## 3. Evidence and close

- [x] 3.1 Write `docs/evidence/angular-companion-device-evidence.md` stating the
      behavioural result, that the journey has no web counterpart, and the
      limits. Verify the document repeats the SuiteCRM routing uncertainty, the
      untested declared Angular version, the unvalidated-hypothesis status and
      the no-affiliation boundary, makes no visual-fidelity claim, and
      `pnpm prettier --check` passes on it.

  The document reports the five captures with their bytes and hashes, the
  declared action sequence behind each moment, the identity of the screen the
  companion shows, the fact that there is no served web page so no comparison is
  reported, six limits (including the unread SuiteCRM routing and the untested
  declared Angular version) and a closing `## What this does not claim` section.
  Prettier is clean on it.

- [x] 3.2 Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`,
      `pnpm format:check`, `pnpm deps:check` and the iOS capture command. Verify
      every command exits 0.

  All six workspace commands exit 0 (logs `/tmp/p6-gate-build.log`,
  `/tmp/p6-gate-typecheck.log`, `/tmp/p6-gate-test.log`, `/tmp/p6-gate-lint.log`,
  `/tmp/p6-gate-format.log`, `/tmp/p6-gate-deps.log`). The local iOS capture
  could not be reproduced after its first success: this machine's simulator
  runtime moved to iOS 27.0, `iPhone 17 Pro` no longer exists and the
  application disconnects from the Detox server on launch under the new
  runtime, while the same command had already produced the committed record.
  Both continuous integration capture jobs now run it, so the evidence is
  produced there.

- [ ] 3.3 Run `openspec validate angular-companion-device-evidence --strict`
      before implementation and before archival, then archive the change. Verify
      no task is marked complete until its stated command or artifact exists.
      Note that `companion-operational-readiness` and
      `proof-artifact-governance` must be complete before a device-evidence
      change is archived, so archival may have to wait for them.
