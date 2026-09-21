# Native capture of the records fixture

This is a capture report. It records screenshots of the screen the target compiler
emitted, taken on a real simulator through a device driver, and the measurement of
that screen against the browser render of the same fixture. It makes no visual
parity claim: no scenario declares a cross-platform tolerance, so the comparison
below is a measurement and not a pass.

The machine readable record is
`docs/evidence/records-native-capture-records-list-ios.json` and
`docs/evidence/records-native-capture-records-motion-ios.json`, written by the run
that produced the captures.

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

That coincidence is the expected result rather than a guarantee. The same two
scenarios captured on the same device profile in continuous integration produced
five distinct hashes, and in one of the local runs the `interrupted` frame differed
from `midpoint` by a few hundred bytes, while the fixture state after the declared
actions was the same in every case. A capture is taken immediately after the last
tap, so a residual pressed state or a status bar clock tick can still be on screen.
Screenshots of the same frame are therefore never byte-identical between runs,
which is exactly why the comparison normalizes before it measures and why this
report records the bytes and the hash of the run it is about rather than a stable
per-frame fingerprint. What the frames mean is the declared action sequence, and
that is the same everywhere.

The same run recorded every Android capture as unavailable, with the reason that
the run prepared one platform. That is an absence, not a result, and it is the
state of the iOS only run recorded here.

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

## A compiler gap this run found

The first device run reached the application and iOS threw at mount:

```
Uncaught Error: Text string "Alpha" must be rendered inside a <Text>
```

The web fixture put bare text inside a button, so the compiler emitted
`<pressable>Alpha</pressable>`. Bare text inside a non-text element is accepted by
the safe subset and produces code that throws when it mounts, so the fixture was
corrected (`<span class="row-button-label">` and `<span class="retry-label">`
around the two labels) and the emitted file and its manifest were regenerated.
The manifest hash moved from
`4e556ef30b20b25aa3d41209e26e4c4bf492cc2f750752760038704e0394002a` to
`e18712f368212b2481a868a3e6fa3fd5e42a58449fc099e1f503648b7eab4c48`.

The gap itself is in `@memolabs-apps/target-vue` and is outside this change's
declared impact, so it is recorded here as a discovered defect with its
reproduction rather than fixed in this change. It is a real one: a fixture that
compiles cleanly can still produce a screen that crashes on the first mount.

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
- Nothing about Android. The Android captures in these runs are recorded as
  unavailable, and the continuous integration job that produces them is what
  turns them into results.
- Nothing about the fixture's safe area. The captured screen draws from the top of
  the window because the fixture application replaces the template root screen.
  That is a property of the fixture, not of the platform or of the compiler.
