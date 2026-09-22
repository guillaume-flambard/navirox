# preview-external-validation

## Why

The Vue/Nuxt developer-preview contract (`docs/DEVELOPER-PREVIEW.md`) names
`preview-external-validation` as the change that tests audit usefulness on
external repositories "without upgrading support from anecdotal feedback". Its
predecessor, `preview-public-distribution`, retained the packed-tarball
limitation rather than proving a public path, which the contract allows, so the
dependency is satisfied and this change may proceed.

Nothing today records whether the deterministic report is useful on a repository
the project does not own. The benchmarks the proof program uses
(`baserow`, `cal-com`, `suitecrm`) are picked for workflow coverage, not for an
outside evaluator's judgement of the report. Without a recorded external read,
the preview has no evidence for the usefulness half of its promise, and any
claim from memory would be exactly the anecdotal upgrade the contract forbids.

This change adds a self-run validation: the analyzer runs against a small set of
pinned external public repositories from the verified tarball path, and the
outcome is recorded in the vocabulary the project already uses
(`unvalidated hypothesis` / `practitioner-informed`), with the strongest allowed
claim stated explicitly. It contacts no external developer and upgrades no
support status.

## What Changes

- Record a self-run external validation: a set of pinned external public
  repositories, the exact `navirox analyze --json` command, and whether each
  report names the categories the preview promises (shared, adaptable,
  platform-specific, manual, unknown) without inventing a migration decision.
- Reuse the existing consent-first interview pattern from `docs/OPERATOR-FEEDBACK.md`
  for any developer conversation, without requesting credentials or data, and
  state the strongest claim such a conversation can support.
- Add a check that fails when a recorded external validation names a status
  outside the declared vocabulary or claims more than `practitioner-informed`.
- State in the contract's boundary table that external usefulness is tested but
  not a support upgrade.

## Capabilities

### New Capabilities

- `preview-external-validation`: an external read of the report is run and
  recorded against pinned public repositories, and the record may not claim more
  than the declared status vocabulary allows.

### Modified Capabilities

None.

## Impact

This adds one evidence document, one declared external-repository list, one check
script and its test, and one boundary-table row in
`docs/DEVELOPER-PREVIEW.md`. It changes no analyzer behavior, no adapter, no
target provider, no transform, no package contract and no benchmark count. It
publishes nothing, contacts no external developer, and raises no support status.
