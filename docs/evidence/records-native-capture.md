# Native capture of the records fixture

This is a capture report. It records screenshots of the screen the target compiler
emitted, taken on a simulator and an emulator through a device driver, and the
measured comparison of that screen against the browser render of the same fixture.
Both scenarios declare a cross-platform tolerance, so the comparison returns a
verdict: the records fixture passes on iOS and on Android. A pass here evaluates the
declared tolerance; it is not a claim of visual parity, and the pixel difference
ratio is reported as a measurement beside the verdict rather than the value that
decides it.

The machine readable record of a run is
`records-native-capture-<scenario>-<platform>.json`. A platform run writes it beside
the captures, and the continuous integration job uploads both as build artifacts, so
the record of a platform run is the artifact of the run that produced it. The
captures and verdicts below are from one dispatched run,
`35712785642`, whose `capture the records fixture on a simulator` job
(`106697115943`) and `capture the records fixture on an emulator` job
(`106697115895`) each build the prepared application, run the harness and upload
`records-native-capture-ios` and `records-native-capture-android`. Every job in that
run was green.

## What produced the captures

| Item | Value |
| --- | --- |
| Command | `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform <ios\|android> --workspace <dir>` |
| Driver | `captureNativeDevice` in `@memolabs-apps/visual-benchmark`, which builds and installs the prepared application and runs the harness capture test |
| Application | the scaffolded `records-fixture-app`, whose root screen is the file the target compiler emitted |
| Device profiles | `{ platform: 'ios', deviceName: 'iPhone 17' }`, `{ platform: 'android', deviceName: 'navirox-e2e' }` |
| Device screens | iOS 1206 x 2622 px, Android 1080 x 2400 px |
| Web profile | headless Chrome at the scenario viewport, 390 x 844 px |
| Target compiler | `@memolabs-apps/target-vue` 0.1.1 |
| Screen manifest hash | `e18712f368212b2481a868a3e6fa3fd5e42a58449fc099e1f503648b7eab4c48` |

The run recompiles `RecordsScreen.web.vue` before it installs anything and refuses
to continue when the fresh output differs from the checked-in
`RecordsScreen.native.vue`, so the screenshots below are of compiler output and not
of a hand-edited screen. The Android job also reported a Gradle cache hit
(`Cache restored from key: Linux-gradle-1dbe1434...`), so the second run of that job
reuses the distribution instead of downloading it again.

## Captures

`records-list`, one capture:

| Platform | Moment | File | Bytes | sha256 |
| --- | --- | --- | --- | --- |
| ios | rest | `rest.ios.png` | 85793 | `85455bbeb6defbc0a2250512f4d1995c9cb4419131b3c213ab80b8edceb155a4` |
| android | rest | `rest.android.png` | 34349 | `7830f8a992952000476ac3e4f247b6fbc748ef13bb5ff029c01310261a64cc81` |

`records-motion`, five captures in the required order:

| Platform | Moment | File | Bytes | sha256 |
| --- | --- | --- | --- | --- |
| ios | rest | `rest.ios.png` | 85495 | `2fed4abfe129d131964a131543cf51778e76e569290e71d4d6cb219fe4bc85d5` |
| ios | first-meaningful | `first-meaningful.ios.png` | 95562 | `1079cfd5d0a89eddff6bb490b906bd44e71914c2f0718ad3c505f046196c2d26` |
| ios | midpoint | `midpoint.ios.png` | 92915 | `673630338c2f123228f507a21dbe3fe0b88333f1b80ebdac16ffa5e32e08cc80` |
| ios | settled | `settled.ios.png` | 92915 | `673630338c2f123228f507a21dbe3fe0b88333f1b80ebdac16ffa5e32e08cc80` |
| ios | interrupted | `interrupted.ios.png` | 93169 | `8ee300ebe94e23df43b2dc0cb71d646858ef6280f4e2bc27c0678361675d62b1` |
| android | rest | `rest.android.png` | 33455 | `67f1403195502de55e7be0708b7a54d34e3838c8d053e797af66f963a765cc75` |
| android | first-meaningful | `first-meaningful.android.png` | 40908 | `ecc2d6106dec9d91be1b5a22574f06239cd17e11d46dd5c680792a3e6c3e3576` |
| android | midpoint | `midpoint.android.png` | 41072 | `a275ff96165b550e1579f00e2e51ec75f7871092a4ed07f6c28a28635e460519` |
| android | settled | `settled.android.png` | 40428 | `3d52ac68c8ce71b92bf25800dc7e639998aafbcaefc1db24115ef7b4ce064313` |
| android | interrupted | `interrupted.android.png` | 40376 | `dc9b40723a3017208c480ec3b6625c6ec1ff6e6ff2d946555008a7cb1e66e6df` |

The declared actions really drove native state: the `first-meaningful` frame shows
the Alpha row selected and its detail panel rendered, which is the state the
declared press produces.

Frames that share a hash are named rather than hidden. The fixture is a discrete
state machine, so `settled` presses the already selected row and `interrupted`
replaces a pending selection with the second row; on iOS both landed on the midpoint
state in this run. No frame is an in-flight interpolation: the target compiler
accepts no CSS transition, animation or transform, so the fixture has no interpolated
state to capture.

That coincidence is the expected result rather than a guarantee. Across the runs
recorded during this work the shared-hash set was `settled and interrupted`,
`midpoint and settled`, `midpoint and settled and interrupted`, and once five
distinct hashes, while the fixture state after the declared actions was the same in
every case. A capture is taken immediately after the last tap, so a residual pressed
state or a status bar clock tick can still be on screen. Screenshots of the same
frame are therefore never byte-identical between runs, which is exactly why the
comparison normalizes before it measures and why this report records the bytes and
the hash of the run it is about rather than a stable per-frame fingerprint. What the
frames mean is the declared action sequence, and that is the same everywhere.

## The declared tolerance

Both scenarios declare the same tolerance:

```json
{ "gridSize": 0.05, "identifiers": ["records-screen", "records-list", "record-row", "record-select"] }
```

`gridSize` is the largest relative difference between the two normalized grid sizes
the scenario accepts, as a fraction of the larger side. The identifiers are the test
identifiers every capture of these scenarios renders; the web driver inspects the
served page for them and the device capture test asserts them in the running
application, so a screen that did not render fails the capture instead of reaching
the comparison.

The comparison evaluates four checks and returns `pass` or `fail`, naming the check
that decided a failure:

| Scenario | Platform | Verdict | Checks |
| --- | --- | --- | --- |
| records-list | ios | pass | captures 1, grid 0.00 percent, identifiers 4 |
| records-motion | ios | pass | captures 5, grid 0.00 percent, identifiers 4, motion in order |
| records-list | android | pass | captures 1, grid 2.54 percent, identifiers 4 |
| records-motion | android | pass | captures 5, grid 2.54 percent, identifiers 4, motion in order |

- **captures**: every declared capture exists on the web and on the device. A
  scenario that prepared one platform records the other platform as unavailable and
  cannot pass.
- **grid**: the normalized grid of the web capture and of the device capture differ
  by no more than `gridSize`. iOS normalizes both sides to 118 x 256, a difference of
  0.00 percent. Android's emulator screen is 1080 x 2400 while the browser viewport is
  390 x 844, so at longest side 256 the device grid is 115 x 256 against the web's
  118 x 256, a difference of 2.54 percent inside the declared 5 percent.
- **identifiers**: every declared identifier was found on the served web page and
  asserted in the running application. `record-row` is carried by every row and
  `record-select` by every row button, so the harness waits on the first match rather
  than an unindexed matcher, which Detox would refuse on a screen that rendered
  correctly.
- **motion**: when a scenario declares motion, the recorded labels are exactly the
  required sequence. A scenario that declares none is not evaluated on motion.

The pixel difference ratio is deliberately not a check. It is a measurement reported
beside the verdict, because a browser and a device rasterise the same screen
differently without either being wrong.

## Web against device, measured

The same fixture captured in the browser and on the device, compared with the
normalized measurement in `@memolabs-apps/visual-benchmark`, no declared mask and the
declared tolerance above:

| Platform | Web capture | Device capture | Normalized grid | Verdict |
| --- | --- | --- | --- | --- |
| ios | `rest.web.png`, 390 x 844 px, 7024 bytes, `76c9882186508b3210aa7ced711161f155224664acf7daea5c41a1f6e2446ece` | `rest.ios.png`, 1206 x 2622 px, 85793 bytes, `85455bbeb6defbc0a2250512f4d1995c9cb4419131b3c213ab80b8edceb155a4` | 118 x 256 px both sides, 0.00 percent | `pass` |
| android | `rest.web.png`, 390 x 844 px, 7079 bytes, `424eed4febc2885a6d5e31b22ba910db07a92fb9af4c66fa0ae541a030cb6abb` | `rest.android.png`, 1080 x 2400 px, 34349 bytes, `7830f8a992952000476ac3e4f247b6fbc748ef13bb5ff029c01310261a64cc81` | 115 x 256 against 118 x 256, 2.54 percent | `pass` |

The underlying pixel difference is large and it is not a defect. The browser
viewport is 390 x 844 while the device screen is 1206 x 2622 (iOS) or 1080 x 2400
(Android), the device screenshot carries the status bar and the home indicator that
the browser page has no equivalent of, the fixture screen draws from the top of the
window with no safe area padding, and the two renderers rasterise the same text with
different fonts. The declared tolerance is about the normalized grid the comparison
measures, not about the raw pixels; the pixel ratio stays a measurement.

## A compiler gap this run found

The first device run reached the application and iOS threw at mount:

```
Uncaught Error: Text string "Alpha" must be rendered inside a <Text>
```

The web fixture put bare text inside a button, so the compiler emitted
`<pressable>Alpha</pressable>`. Bare text inside a non-text element was accepted by
the safe subset at the time and produced code that throws when it mounts, so the
fixture was corrected (`<span class="row-button-label">` and
`<span class="retry-label">` around the two labels) and the emitted file and its
manifest were regenerated. The manifest hash moved from
`4e556ef30b20b25aa3d41209e26e4c4bf492cc2f750752760038704e0394002a` to
`e18712f368212b2481a868a3e6fa3fd5e42a58449fc099e1f503648b7eab4c48`.

The gap itself is in `@memolabs-apps/target-vue`. It is a real one: a fixture that
compiled cleanly could still produce a screen that crashed on the first mount. It is
now closed there: the compiler refuses a text or interpolation child placed directly
inside an element whose native primitive is not a text primitive, with the
`unsupported-text` finding, and a refused screen produces no generated source and no
output path, exactly as every other finding already does. Whitespace between
elements is still accepted, and the records fixture above compiles to the same bytes
and the same manifest hash it did before the refusal was added.

## Pipeline defects this run fixed

Failures only a device run could expose were found and fixed before a capture existed:

- The synchronous spawn buffer was the default one megabyte, and an Xcode build
  prints tens of megabytes, so the build died with `ENOBUFS` instead of reporting
  its error.
- Detox runs the harness `start` command through a shell, and the prepared
  application's `node_modules/.bin` was not on that shell's `PATH`, so
  `react-native start` was `command not found`.
- The scaffolded application ships a `Podfile` and `Podfile.lock` but no `Pods`
  directory, so the iOS build failed until `pod install` was run as preparation.
- Detox refuses an element matcher that matches more than one view. Two rows carry
  the same test identifier, so every wait in the harness addresses the first match
  explicitly; an unindexed matcher failed the Android capture on a screen that had
  rendered correctly.
- The scaffolded application carries no Android test wiring, so the test APK was
  empty and the instrumentation never reported ready. The harness writes the Detox
  test class and the build-file settings, and the build command chains with `&&` so a
  failing gradle task stops the run instead of exiting 0 behind a trailing `cd -`.

## What this does not claim

- No visual parity. A passing verdict evaluates the declared tolerance on the
  normalized grid, the declared identifiers and the recorded motion labels; the raw
  pixel ratio is a measurement reported beside it.
- No measured visual fidelity beyond this scenario. V2 is complete for the records
  fixture on iOS and Android; it says nothing about another scenario, another
  fixture or another adapter, which is the V4 gate.
- Nothing about the fixture's safe area. The captured screen draws from the top of
  the window because the fixture application replaces the template root screen.
  That is a property of the fixture, not of the platform or of the compiler.
