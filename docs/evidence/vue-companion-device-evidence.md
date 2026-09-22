# Vue companion device evidence

This is a device evidence record for the Vue proof journey's companion. It reports
a behavioural result and a measured comparison as two separate findings. It makes
no visual-fidelity or visual-parity claim, and it says nothing about the project
the benchmark revision comes from.

The machine-readable records are
`docs/evidence/native-capture-field-workflow-ios.json` and, once the capture job
has run, `docs/evidence/native-capture-field-workflow-android.json`. Each holds
the verdict, its checks and every capture of the run it describes.

## What produced the captures

| Item | Value |
| --- | --- |
| Command | `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios --scenario field-workflow --workspace /tmp/navirox-fw-capture2` |
| Companion | `field-workflow-app`, scaffolded outside the checkout and installed from packed artifacts |
| Companion screen | The target compiler output, written to the application root and recompiled and compared before anything was installed |
| Fixture | `packages/target-vue/fixtures/field-workflow/` |
| Scenario | `packages/visual-benchmark/src/scenarios/field-workflow.ts` |
| Device profile | `{ "platform": "ios", "deviceName": "iPhone 17 Pro" }` |
| Target compiler | `@memolabs-apps/target-vue` 0.1.1 |
| Generated screen manifest hash | `3ae83ea130a3bdb80d17649cdf79f1bdf12a3881937e8870d8d3a9a525cf7e32` |
| Declared tolerance | `{ "gridSize": 0.05, "identifiers": ["field-screen", "field-list", "field-row", "field-select"] }` |

The companion also carries the two units the planner classified as shared
(`fieldLogic.ts` and `fieldRecords.ts`) beside the screen the compiler wrote,
because the generated screen imports them and the compiler emits that import
verbatim.

## What the run asserts

The run returned a passing verdict on four declared checks:

| Check | Result |
| --- | --- |
| Captures | `all 5 declared captures exist on the web and on ios` |
| Grid | `the largest grid difference is 0.00 percent, inside the declared 5.00 percent` |
| Identifiers | `all 4 declared identifiers were asserted on the web and on ios` |
| Motion | `the motion labels were rest, first-meaningful, midpoint, settled, interrupted in the required order` |

A declared capture that cannot be produced fails the run and records the capture
and the reason it is absent. That was verified against the built package: a run
whose device driver reported no screenshot did not complete and its error named
`rest.ios`, `rest.android`, `first-meaningful.ios` and the rest, each with the
driver's reason. The capture script turns that into a nonzero exit.

## The captures

| Moment | File | Bytes | sha256 |
| --- | --- | --- | --- |
| rest | `rest.ios.png` | 98814 | `974fbc03ac938ad34fd287f1c4d92e91fb07e9a2a152aa34dbcd64f44817609d` |
| first-meaningful | `first-meaningful.ios.png` | 138966 | `589066ade8119327897ada40263e678ca3d6cea795b9449d159f39b0e44b11c7` |
| midpoint | `midpoint.ios.png` | 139987 | `b63aebc3941251952e15fe1b15b4a23e87f9fd192799566bac92065910ce9269` |
| settled | `settled.ios.png` | 144875 | `c1d68fe4477bc103cb06288aa194d9123bbbbaef2f762fcff7d92b5ef1ef7ce1` |
| interrupted | `interrupted.ios.png` | 146338 | `910f9859f5f4074fd3781e72c5a04e17de6e602aad75ada2c85116e0b32cd593` |

All five frames were distinct in this run. That is not a guarantee: the records
fixture has produced runs where two or three frames shared a hash, because a
capture is taken immediately after the last declared action and a residual
pressed state or a status bar clock tick can still be on screen. What the frames
mean is the declared action sequence, which is the same everywhere.

## The action sequence

| Capture | Declared actions |
| --- | --- |
| rest | none |
| first-meaningful | select the first record |
| midpoint | select the first record, cycle its status, cycle its notes, attach the document |
| settled | the midpoint actions, then save the record |
| interrupted | select the first record, clear its status, then save the record |

The interrupted capture reaches the workflow's failure state: the save reports
that it did not complete because a status is required.

## The measurement

The comparison between the web capture and the device capture is reported as a
measurement beside the verdict, never as the value that decides it. On this run
the normalized grids differ by 0.00 percent, inside the declared five percent,
because the browser viewport and the simulator screenshot normalize to the same
grid. The raw pixel difference ratio is in the machine-readable record; it is
not a fidelity result.

## Android

The iOS run prepared one platform, so every Android capture is recorded
unavailable with the reason that the run prepared one platform rather than a
guessed result. The Android capture is produced by the continuous integration
capture job, which uploads the scenario capture directory and the evidence
report for its platform.

## Limits

- The report names the device profile and records no operating system version,
  because the device driver does not read one. The device name is what
  identifies the profile here.
- The Android evidence comes from continuous integration. The local emulator is
  not usable on this machine, so no Android capture was produced locally.
- The first local attempt failed on the intermittent CocoaPods
  `pathname contains null byte` defect, which happens before any application
  code runs; the retry succeeded and produced the captures above.
- The captured screen replaces the scaffolded template's root screen, so it
  carries no safe-area padding. That is a property of the fixture, not of the
  platform.

## What this does not claim

- No visual fidelity and no visual parity. The comparison above is a declared,
  measured difference; the V2 gate in `docs/VISUAL-FIDELITY.md` is not advanced
  beyond the records fixture by this change.
- Nothing about the benchmarked project: not its product direction, not its
  mobile plans, and no relationship, partnership or endorsement of any kind.
- Nothing about screens, workflows or frameworks other than the one scenario
  captured here.
