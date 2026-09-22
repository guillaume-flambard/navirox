# Native capture of the records fixture

This is a capture report. It records screenshots of the screen the target compiler
emitted, taken on a real simulator and a real emulator through a device driver, and
the measurement of that screen against the browser render of the same fixture. It
makes no visual parity claim: no scenario declares a cross-platform tolerance, so
the comparison below is a measurement and not a pass.

The machine readable record of the local run is
`docs/evidence/records-native-capture-records-list-ios.json` and
`docs/evidence/records-native-capture-records-motion-ios.json`. A platform run
writes `records-native-capture-<scenario>-<platform>.json` beside them, and the
continuous integration job uploads the captures and those reports as build
artifacts, so the record of a platform run is the artifact of the run that produced
it.

## What produced the captures

| Item | Value |
| --- | --- |
| Command | `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios --workspace /tmp/navirox-capture-warm` |
| Driver | `captureNativeDevice` in `@memolabs-apps/visual-benchmark`, which builds and installs the prepared application and runs the harness capture test |
| Application | the scaffolded `records-fixture-app`, whose root screen is the file the target compiler emitted |
| Device profile | `{ platform: 'ios', deviceName: 'iPhone 17' }` |
| Device screen | 1206 x 2622 px |
| Web profile | headless Chrome at the scenario viewport, 390 x 844 px |
| Target compiler | `@memolabs-apps/target-vue` 0.1.1 |
| Screen manifest hash | `e18712f368212b2481a868a3e6fa3fd5e42a58449fc099e1f503648b7eab4c48` |

The run recompiles `RecordsScreen.web.vue` before it installs anything and refuses
to continue when the fresh output differs from the checked-in
`RecordsScreen.native.vue`, so the screenshots below are of compiler output and not
of a hand-edited screen.

## Captures

`records-list`, one capture:

| Moment | File | Bytes | sha256 |
| --- | --- | --- | --- |
| rest | `rest.ios.png` | 83236 | `2738142bbbf1dd0f64b4446dfaedf0a74ba3dc33205ac3de5bd187ddfa85f118` |

`records-motion`, five captures in the required order:

| Moment | File | Bytes | sha256 |
| --- | --- | --- | --- |
| rest | `rest.ios.png` | 83236 | `2738142bbbf1dd0f64b4446dfaedf0a74ba3dc33205ac3de5bd187ddfa85f118` |
| first-meaningful | `first-meaningful.ios.png` | 93578 | `c8f23830e8b8246987bc425c9b37ce83814c0e30c333b0f32df7985727d66953` |
| midpoint | `midpoint.ios.png` | 91151 | `fa17b597192fe9ddc0c21499d720401918aca8acaeac39407ead43aacb3fe966` |
| settled | `settled.ios.png` | 90827 | `7a197898aec1ffd555c202aaca670a7108c3a86915d631056427275e89b26794` |
| interrupted | `interrupted.ios.png` | 90827 | `7a197898aec1ffd555c202aaca670a7108c3a86915d631056427275e89b26794` |

The declared actions really drove native state: the `first-meaningful` frame shows
the Alpha row selected and its detail panel rendered, which is the state the
declared press produces.

Two motion frames share a hash in this run. The fixture is a discrete state machine,
so `settled` presses the already selected row and `interrupted` replaces a pending
selection with the second row, and in this run both landed on the same state. The
report names the frames that share a hash instead of presenting one state as two
measurements, and no frame is an in-flight interpolation: the target compiler
accepts no CSS transition, animation or transform, so the fixture has no
interpolated state to capture.

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

## The same capture in continuous integration

The local run recorded above prepared one platform only, so its Android entries are
absences rather than results. One dispatched continuous integration run captures both
platforms: run `35667060785`, whose `capture the records fixture on a simulator` job
(`106555069347`) and `capture the records fixture on an emulator` job (`106555068910`)
each build the prepared application, run the harness and upload
`records-native-capture-ios` and `records-native-capture-android`. Every job in that
run was green. Each artifact holds the web capture and the device capture for every
declared moment of both scenarios, plus the two reports naming the device.

`records-list`:

| Platform | Device profile | File | Bytes | sha256 |
| --- | --- | --- | --- | --- |
| ios | `{ platform: 'ios', deviceName: 'iPhone 17' }` | `rest.ios.png` | 84727 | `3e5cd85f1eca86522ae97e7ecebafe9296303c190052ccd3a57142f246f7fce9` |
| android | `{ platform: 'android', deviceName: 'navirox-e2e' }` | `rest.android.png` | 32220 | `9190fc401565756028c70f3a22a34f1b7ec6932ff4f6ed9e074356c3cd57ee44` |

`records-motion`:

| Platform | Moment | File | Bytes | sha256 |
| --- | --- | --- | --- | --- |
| ios | rest | `rest.ios.png` | 85194 | `c95fdc78e1144a5a071502f4e52c0a04e8a24744881c9a757d691e12cf63b24a` |
| ios | first-meaningful | `first-meaningful.ios.png` | 95523 | `6914138052481fe112ab04e0ee92c556f616fd99bb336e28e6e90ab288512abb` |
| ios | midpoint | `midpoint.ios.png` | 93095 | `fa8d6a9e60849e986ada3d8cae348ff5d3330de9608ca728c7a3d0b100cd5855` |
| ios | settled | `settled.ios.png` | 93333 | `d703de292de6b23c2d67d869ffa324608f9490ae600bfee8bae6c34b657d6636` |
| ios | interrupted | `interrupted.ios.png` | 93333 | `d703de292de6b23c2d67d869ffa324608f9490ae600bfee8bae6c34b657d6636` |
| android | rest | `rest.android.png` | 32220 | `9190fc401565756028c70f3a22a34f1b7ec6932ff4f6ed9e074356c3cd57ee44` |
| android | first-meaningful | `first-meaningful.android.png` | 40160 | `8aa1c97ffb4505dc89bb3c3a9001f1f027fbb304f28f6d88892deba0cf866778` |
| android | midpoint | `midpoint.android.png` | 40335 | `54dd8a7d219a189d2952d08c1a912cdb1ef041c6dee69da88c2b076ea66af8f0` |
| android | settled | `settled.android.png` | 40335 | `54dd8a7d219a189d2952d08c1a912cdb1ef041c6dee69da88c2b076ea66af8f0` |
| android | interrupted | `interrupted.android.png` | 40270 | `8e19207222b643c0d44c3edc75782b908e3dffcea97ad3856010983ab45ce51f` |

Every report names its platform, its device, its labels in order and its missing
captures, which is none. The Android job also reported a Gradle cache hit
(`Cache restored from key: Linux-gradle-1dbe1434...`), so the second run of that job
reuses the distribution instead of downloading it again.

## Web against device, measured

The same fixture captured in the browser and on the device, compared with the
normalized measurement in `@memolabs-apps/visual-benchmark` and no declared mask
and no declared tolerance:

| Item | Value |
| --- | --- |
| Web capture | `rest.web.png`, 390 x 844 px, 7041 bytes, `79ae46db66c55141b4004bcb98b90dd03821c4c6a94de85e1398c7be09a55468` |
| Device capture | `rest.ios.png`, 1206 x 2622 px, 83236 bytes, `2738142bbbf1dd0f64b4446dfaedf0a74ba3dc33205ac3de5bd187ddfa85f118` |
| Normalized grid | 118 x 256 px (longest side 256) |
| Differing pixels | 27782 of 30208 |
| Unmasked differing pixels | 27782 |
| Unmasked ratio | 0.9197 |
| Bounding box | `{ x: 0, y: 0, width: 118, height: 256 }`, the whole frame |
| Verdict | `undeclared-differences` |

The difference is not a surprise and it is not a defect. The browser viewport is
390 x 844 while the device screen is 402 x 874 dp, the device screenshot carries
the status bar and the home indicator that the browser page has no equivalent of,
the fixture screen draws from the top of the window with no safe area padding, and
the two renderers rasterise the same text with different fonts. The verdict is
`undeclared-differences` because the scenario declares no cross-platform
tolerance, which is exactly what the comparison rule requires it to say. A pass
here would be a parity claim with no basis, so no pass is reported and V2 stays
not started.

The Android pair does not even normalize to the same grid. The emulator screen is
1080 x 2400 while the browser viewport is 390 x 844, so at the longest side 256 the
device grid is 115 x 256 against the browser's 118 x 256, and the comparison reports
`undeclared-differences` with a size mismatch instead of counting pixels. That is a
statement about the two profiles rather than about the two screens, and making it
measurable is a scenario decision (a viewport whose aspect ratio matches the declared
device, or a declared mask), which belongs to the tolerance work V2 needs.

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

Four failures only a device run could expose were found and fixed before a capture
existed:

- The synchronous spawn buffer was the default one megabyte, and an Xcode build
  prints tens of megabytes, so the build died with `ENOBUFS` instead of reporting
  its error.
- Detox runs the harness `start` command through a shell, and the prepared
  application's `node_modules/.bin` was not on that shell's `PATH`, so
  `react-native start` was `command not found`.
- The scaffolded application ships a `Podfile` and `Podfile.lock` but no `Pods`
  directory, so the iOS build failed until `pod install` was run as preparation.
- Detox refuses an element matcher that matches more than one view, and two rows
  carry the same test identifier, so the harness now always indexes a target.

## What this does not claim

- No visual parity. The comparison is a measurement with no declared tolerance and
  it is reported as undeclared.
- No measured visual fidelity for any scenario or adapter. V1 records the capture
  harness; V2, the gate that would let Navirox claim measured fidelity, is not
  started because no scenario has a declared cross-platform tolerance yet.
- Nothing about Android beyond the captures themselves. The continuous integration
  run above produces them, but no scenario declares a cross-platform tolerance and
  the Android pair does not normalize to the same grid, so nothing is claimed about
  how the two platforms compare.
- Nothing about the fixture's safe area. The captured screen draws from the top of
  the window because the fixture application replaces the template root screen.
  That is a property of the fixture, not of the platform or of the compiler.
