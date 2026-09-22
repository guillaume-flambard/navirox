## 1. Refuse the text native cannot render

- [x] 1.1 Add the `unsupported-text` finding to `packages/target-vue/src/index.ts`: in `readNodes`, when the mapped primitive is not `text`, report a text or interpolation child whose content is not whitespace only, naming the element and its source location. Verify `pnpm --filter @memolabs-apps/target-vue build` exits 0.

  `TargetFinding.code` gained `'unsupported-text'`, a `bareText(node)` helper was added (an interpolation, or a text node whose content is not whitespace only), and `readNodes` now pushes the finding on the first bare child whenever the mapped primitive is not `text`. `pnpm --filter @memolabs-apps/target-vue build` (tsc --build) exits 0. A probe over the built compiler reported `bare text in button` and `interpolation in div` as `["unsupported-text"]` with no code emitted, and `text in span`, a multi-line template whose only text is whitespace, and a nested element as no findings with code emitted.

- [x] 1.2 Cover the refusal and the accepted controls in `packages/target-vue/src/index.test.ts`: a label directly inside a `button`, an interpolation directly inside a `div`, and the controls (text inside a `span`, a multi-line template whose only text is whitespace, and a nested element inside a `view`) each assert the finding codes and whether code was generated. Verify `pnpm --filter @memolabs-apps/target-vue test` passes.

  Three tests were appended (refusal for a label inside a `button` and an interpolation inside a `div`, each asserting no code and findings exactly `['unsupported-text']`; text inside a `span` plus a multi-line whitespace template; a nested element inside a container) and the pre-existing safe-subset test was corrected to put its button label in a `span`, because it had encoded the defect the refusal now reports. `pnpm --filter @memolabs-apps/target-vue test` passes 13 tests in 2 files.

- [x] 1.3 Prove the check is load bearing: disable the new refusal locally, confirm the new tests fail, restore it and confirm they pass again. Verify the restored `pnpm --filter @memolabs-apps/target-vue test` passes.

  The refusal block was replaced by a comment, `pnpm --filter @memolabs-apps/target-vue test` then reported `Tests 1 failed | 12 passed (13)` at `src/index.test.ts:145` (`expect(label.code).toBeUndefined()`), and after restoring the block the suite passes 13 of 13 again with a green `tsc --build`.

## 2. Keep the fixture and the evidence true

- [x] 2.1 Recompile the records web fixture with the fixed compiler and confirm the emitted file and the manifest are byte identical to the committed ones (`packages/target-vue/fixtures/records/RecordsScreen.native.vue` and `RecordsScreen.provenance.json`). Verify `pnpm --filter @memolabs-apps/target-vue test` passes, including the fixture test that compares bytes and the manifest hash.

  `git status --porcelain packages/target-vue/fixtures/records/` is empty, so the committed emitted file and the committed manifest are unchanged on disk, and `pnpm --filter @memolabs-apps/target-vue test` passes 13 tests in 2 files, including `src/fixtures.test.ts`, which recompiles the web fixture and compares the bytes and the manifest hash. The refusal does not touch the fixture because the fixture already puts its labels in spans.

- [x] 2.2 Update the compiler-gap paragraph in `docs/evidence/records-native-capture.md` so it records that the construct found on the device is refused by the compiler rather than emitted. Verify the paragraph names the finding code and the document still states that it makes no visual parity claim.

  The section now says bare text `was accepted by the safe subset at the time` and closes with the gap being closed in `@memolabs-apps/target-vue`: the compiler refuses a text or interpolation child placed directly inside an element whose native primitive is not a text primitive, with the `unsupported-text` finding, and a refused screen produces no generated source and no output path. The opening line and the closing `What this does not claim` section are untouched, so the document still makes no visual parity claim. `pnpm prettier --check docs/evidence/records-native-capture.md` is clean.

- [x] 2.3 Search the repository for text that describes what the compiler accepts (`rg -n 'safe subset|supported subset|native primitive' docs packages/target-vue`) and update any place that still implies text is accepted directly inside a non text element. Verify the search returns no claim the compiler now contradicts.

  The search returns the package role string, the generated `code` doc comment, the `unsupported-element` finding, the `data-testid` comment, the safe subset test name, `records-screen-provenance.md` (`Findings: none`), the two lines rewritten by 2.2, the Baserow diagnostic document, `ROADMAP.md` (`safe subset that Navirox can prove`) and the historical finding messages recorded in `vue-target-baserow-diagnostic.json`. Every one of them is accurate: none claims text is accepted directly inside a non text element, and the only sentence that did was the one 2.2 rewrote.

## 3. Verify and close

- [x] 3.1 Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format:check` and `pnpm deps:check`. Verify every command exits 0.

  All six commands exit 0 (logs `/tmp/txt-build.log`, `/tmp/txt-typecheck.log`, `/tmp/txt-test.log`, `/tmp/txt-lint.log`, `/tmp/txt-format-check.log`, `/tmp/txt-deps-check.log`), so the workspace builds, typechecks, tests, lints, formats and satisfies the dependency drift guard with the refusal in place.
- [x] 3.2 Run `openspec validate vue-target-text-safety --strict` before implementation and before archival, then archive the change. Verify no task is marked complete until its stated command or artifact exists.

  `openspec validate vue-target-text-safety --strict` printed "Change 'vue-target-text-safety' is valid" before implementation and again before archival, and `openspec archive vue-target-text-safety --yes` archived the change as 2026-09-22-vue-target-text-safety, creating `openspec/specs/vue-target-subset/spec.md` with the one added requirement. Every task above was left unchecked until its stated command or artifact existed, and the archive reported 7 of 8 tasks because this task is the archival itself.
