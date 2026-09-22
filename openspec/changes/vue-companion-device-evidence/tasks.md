# Tasks

## 1. Generalise the capture path

- [x] 1.1 Let a capture scenario carry its own fixture, application name, root test identifier, route, declared identifiers and tolerance, defaulting to the records values so the existing evidence reproduces exactly.
  Verify `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios` still exits 0 and its report is unchanged.

  The script now reads every fixture fact from its fixture record. `scripts/lib/fixture-app.mjs` gained `rootTestId`, `evidencePrefix` and `movedUnits` on both fixtures (`records-screen`/`records-native-capture`/none and `field-screen`/`native-capture`/`fieldLogic.ts` plus `fieldRecords.ts`), and `packages/visual-benchmark/scripts/capture-records-native.mjs` takes a `{ scenario, fixture }` entry list, validates every selected scenario, derives the scaffold name, the app root screen, the root test identifier and the evidence filename from the fixture, and polls the first selected scenario's route in `startVite(route)`. The default scenario set is still the two records scenarios, and `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios --keep` (with `NAVIROX_DEVICE="iPhone 17 Pro"`) exited 0 with the committed shape: `Verdict: pass`, grid difference 0.00 percent, all four declared identifiers asserted on the web and on ios, the motion labels in order, `Coincident frames: settled and interrupted`, and the five android unavailable entries. The evidence filename is `records-native-capture-records-list-ios.json` and `records-native-capture-records-motion-ios.json` as before.
- [x] 1.2 Copy the planner-approved shared units the generated screen imports beside `App.vue` in the prepared companion, the way the assembly already does.
  Verify the prepared application contains the moved units and the bundle resolves them.

  `scripts/lib/fixture-app.mjs` exports `copyFixtureUnits(appDir, fixture)`, which copies every path in the fixture's `movedUnits` with the existing `copyFixtureUnit` helper, and the capture script calls it right after the fresh compile and before the device harness is installed. The proof is the field-workflow run: the compiled screen imports `./fieldLogic` and `./fieldRecords`, the target compiler emits that import verbatim, and the ios Metro warm-up bundled `index.bundle for ios` with no resolution error, which is only possible when both units sit beside the screen the compiler wrote to the app root. For the records fixture `movedUnits` is empty, so the call is a no-op and that evidence is untouched.
- [x] 1.3 Re-run the existing records capture regression.
  Verify `node scripts/verify-records-screen.mjs --keep` exits 0 with the same manifest hash, single-runtime assertion and bundle sizes.

  `node scripts/verify-records-screen.mjs --keep` exited 0 and printed `32 artifacts`, `81 files`, `manifest e18712f368212b2481a868a3e6fa3fd5e42a58449fc099e1f503648b7eab4c48 compiler 0.1.1`, `5 packages, one copy each`, `android: 6597 kB`, `ios: 9/9 testIDs present` and `android: 9/9 testIDs present` (log `/tmp/p3-verify-records.log`, kept workspace `/var/folders/9l/jsy6rgt160v3z3vrkqqjhdyh0000gn/T/navirox-records-Ak3ffq`). The manifest hash, the artifact count, the scaffolded file count, the single-runtime assertion and both identifier counts are identical to the committed records evidence.

## 2. Capture the companion on iOS

- [x] 2.1 Capture the declared `field-workflow` scenario on iOS from the compiled companion and write the evidence report.
  Verify every declared capture exists as a device PNG beside its web capture and the report names the platform, device, operating system when known, source revision, compiler version and generated screen manifest hash.

  `NAVIROX_DEVICE="iPhone 17 Pro" node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios --scenario field-workflow --workspace /tmp/navirox-fw-capture2` exited 0 (log `/tmp/p3-fw2.log`) and wrote `docs/evidence/native-capture-field-workflow-ios.json`: scenario `field-workflow`, platform `ios`, device `{ platform: 'ios', deviceName: 'iPhone 17 Pro' }`, screen `{ compilerVersion: '0.1.1', manifestHash: '3ae83ea130a3bdb80d17649cdf79f1bdf12a3881937e8870d8d3a9a525cf7e32' }`, the five motion labels in order, `missing: []`, and `Verdict: pass` with all four checks passing (`pass captures: all 5 declared captures exist on the web and on ios`; `pass grid: the largest grid difference is 0.00 percent, inside the declared 5.00 percent`; `pass identifiers: all 4 declared identifiers were asserted on the web and on ios`; `pass motion: the motion labels were rest, first-meaningful, midpoint, settled, interrupted in the required order`). Every declared moment has both a web capture and a device capture under the scenario artifact directory, and the five android entries are recorded unavailable with the one-platform reason. The operating system is not recorded because the driver does not read it; the report names the device profile instead, and a first attempt failed on the intermittent CocoaPods `pathname contains null byte` defect before any app code ran (`capture failed: pod install exited 1, so the iOS build cannot start.`) while the retry succeeded.
- [ ] 2.2 Fail the run when a declared capture is absent, naming the capture and the cause.
  Verify a run with a deliberately removed capture exits nonzero and records the cause.

## 3. Capture the companion on Android

- [ ] 3.1 Produce the Android capture in continuous integration, where the emulator exists, and keep the artifacts.
  Verify the capture job uploads the scenario's capture directory and the evidence report.
- [ ] 3.2 Confirm the Android evidence names its device and its provenance like the iOS run.
  Verify the downloaded report names the emulator, the compiler version and the generated screen manifest hash.

## 4. Evidence and close

- [ ] 4.1 Write `docs/evidence/vue-companion-device-evidence.md` stating the behavioural result separately from the measured comparison and naming the limits, without advancing `docs/VISUAL-FIDELITY.md` beyond the records fixture.
  Verify the document names the device, the revisions, the hashes and the captures, states its limits, and `pnpm prettier --check` passes on it.
- [ ] 4.2 Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm deps:check` and the iOS capture command.
  Verify every command exits 0.
- [ ] 4.3 Run `openspec validate vue-companion-device-evidence --strict` before implementation and before archival, then archive the change.
  Verify no task is marked complete until its stated command or artifact exists.
