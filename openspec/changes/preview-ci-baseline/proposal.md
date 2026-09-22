# preview-ci-baseline

## Why

The Vue/Nuxt developer-preview contract (`docs/DEVELOPER-PREVIEW.md`, task 3.2 of
`vue-nuxt-developer-preview-contract`) makes a green CI run a gate on the preview
claim, and forbids hiding an operational failure behind documentation. Continuous
integration is red today, and the red run was never diagnosed against the job and
commit that produced it. This change records that diagnosis and repairs the two
distinct defects it found, without touching the preview language.

The failed run is CI run `35765671500` on commit `41a7b56`
(`docs(openspec): archive the angular companion device evidence change`). Three
jobs failed, in two distinct ways:

- `capture the records fixture on a simulator` and `capture the records fixture
  on an emulator`: the step runs `node scripts/capture-angular-companion.mjs
  --platform <platform> --workspace "$RUNNER_TEMP/..."`, but the script's
  `parseArguments` accepted only `--platform` and `--keep`, so it exited 1 with
  `Unknown argument --workspace.` The sibling capture,
  `packages/visual-benchmark/scripts/capture-records-native.mjs`, already accepts
  `--workspace`; the Angular companion script was never given the same option.
- `run vue-pilot journey on a simulator`: the spec's `opens one product from the
  list and shows its detail` case failed at `e2e/journey.test.ts:118` with
  `Failed expectation: TOEXIST WITH MATCHER(id == "product-detail")`. The line
  used a single-shot `expect(element(by.id('product-detail'))).toExist()` with no
  retry window, while the file's own header states that containers assert
  existence through `waitFor`, and the tap targeted the nested text
  `product-name-1` rather than the `product-open-1` pressable that emits
  `openProduct`. The two other capture jobs reported a non-fatal React Native
  DevTools install message, which does not fail a job and is not repaired here.

## What Changes

- Fix `scripts/capture-angular-companion.mjs` to accept `--workspace <path>`,
  create the named workspace, and skip the temporary-workspace cleanup when a
  named workspace was supplied, matching `capture-records-native.mjs`.
- Fix `examples/vue-pilot/e2e/journey.test.ts` to open a product through the
  `product-open-1` pressable and to wait on `product-detail` with the file's
  `exists` helper and `SETTLE_TIMEOUT` instead of a single-shot assertion.
- Record the diagnosis above so a future red run is not re-diagnosed from
  scratch and so no public preview claim depends on an undiagnosed failure.

## Capabilities

### New Capabilities

- `preview-ci-baseline`: a red CI run is diagnosed against a named job and commit
  before it is repaired, and the developer-preview claim stays blocked until every
  failing job is green.

### Modified Capabilities

None.

## Impact

This is a repair of the capture script and the pilot end-to-end spec, plus the
recorded diagnosis. It changes no adapter, target provider, transform, package
contract, benchmark count or public language. It does not publish packages, does
not repair the non-fatal DevTools message, and does not itself authorize the
developer preview.
