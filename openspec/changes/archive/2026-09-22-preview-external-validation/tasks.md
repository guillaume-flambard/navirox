# Tasks

## 1. Run the external read

- [x] 1.1 From the verified tarball path, run `navirox analyze --json` against at
  least one external public repository pinned to a commit and record the exact
  command, the commit and the report. Verify the repository is outside this
  workspace and the report was produced by the analyzer rather than copied from a
  fixture. Verified 2026-09-22 by running the built CLI
  (`node packages/cli/dist/bin.js`, the same entry the tarball row installs)
  against `nuxt/movies` cloned to
  `/var/folders/9l/jsy6rgt160v3z3vrkqqjhdyh0000gn/T/opencode/navirox-ext/nuxt-movies`
  at commit `ce256d64f4c9ddf93da44fa88d7662678853aed3`:
  `navirox analyze -C <path> --json` exited 0 with adapter `nuxt`, frameworkVersion
  `npm:nuxt-nightly@4.6.0-29812804.e29b3dd9`, supportLevel `experimental` and
  summary `{files:122, units:52, capabilities:9, dependencies:2, routes:8,
  screens:8, findings:{info:5, warning:0, error:0}}`. A first run against
  `nuxt/ui` at `bab8c5af30dd4e6cb14d42144e82b9c8863d2cc6` returned 0 routes and
  0 screens because that repository is a library whose application lives under
  `playgrounds/`, and its `frameworkVersion` read `catalog:`; both are recorded
  as negative outcomes in task 1.2 rather than dropped.
- [x] 1.2 For each repository, record whether the report names shared, adaptable,
  platform-specific, manual and unknown work without inventing a migration
  decision. Verify negative and `unknown` outcomes are recorded, not omitted.
  Verified: the report's classification vocabulary is the planner's closed set
  `MIGRATION_CLASSES = shared | portable | adaptable | native-replacement |
  web-fallback | manual | unknown` (`packages/planner/src/classes.ts`), not a
  `platform-specific` label. `navirox plan -C <movies> --json` exited 0 with
  summary `{shared:8, portable:7, adaptable:2, native-replacement:42,
  web-fallback:0, manual:2, unknown:2}`: every category is named, `unknown` and
  `manual` are present rather than hidden, and no decision is invented. Negative
  outcomes recorded: the `nuxt/ui` run named 0 routes and 0 screens with
  `frameworkVersion` `catalog:` unresolved, and the movies run's `analyze` report
  named only capability `usage` values `unknown` and `invoke` (no classification
  is emitted by `analyze`, only by `plan`).

## 2. Record the validation and its status

- [x] 2.1 Write `docs/evidence/preview-external-validation.md` with the
  repositories, commands, reports and a status drawn from the declared
  vocabulary. Verify the status is `unvalidated hypothesis` unless a consented
  conversation informed it, and that no sentence claims customer demand, support
  or a partnership. Verified: the record uses the OPERATOR-FEEDBACK synthesis
  shape (Consent / Collected / Participants / Credentials-or-customer-data:no /
  Observations / Inferences / Contradictions / Effect on the workflow record)
  with `Status now: unvalidated hypothesis` and `Basis: two self-run analyses of
  public repositories, no practitioner contacted`; no such claim is made and no
  percentage appears.
- [x] 2.2 Declare the external repositories in a list the check reads. Verify each
  entry is public, pinned to a commit, and outside this workspace. Verified:
  `scripts/lib/preview-external-validation.mjs` declares `EXTERNAL_REPOSITORIES`
  with `nuxt-movies` at `ce256d64f4c9ddf93da44fa88d7662678853aed3` and `nuxt-ui`
  at `bab8c5af30dd4e6cb14d42144e82b9c8863d2cc6`, both `https://github.com/...`
  URLs read from clones outside the workspace; the test asserts every entry is a
  GitHub URL with a 40-character commit.

## 3. Add the status check

- [x] 3.1 Add a check that fails when a recorded validation names a status outside
  the declared vocabulary or claims more than `practitioner-informed`. Verify a
  seeded status like `externally-validated` fails and the real record passes.
  Verified: `scripts/check-preview-external-validation.mjs` reads the record and
  prints 'preview external validation: status and 2 declared repositories clean'
  with exit 0 on the real record; `VALIDATION_STATUSES` is
  `unvalidated hypothesis | practitioner-informed`, `STRONGEST_STATUS` is
  `practitioner-informed`, and the overstating phrases are rejected.
- [x] 3.2 Add a test proving the seeded failure names the offending status value.
  Verify the test fails when the check is given an unsupported status. Verified:
  `packages/visual-benchmark/src/preview-external-validation.test.ts` passes 6/6
  and asserts the seeded `externally-validated` status yields an `unknown-status`
  finding whose value is `externally-validated`, that an overstated demand claim
  yields an `overstated-claim` finding, and that a non-public declared repository
  yields a `workspace-repository` finding.

## 4. State the boundary

- [x] 4.1 Add a row to the boundary table in `docs/DEVELOPER-PREVIEW.md` stating
  that external usefulness is tested but is not a support upgrade. Verify the row
  makes no support, demand or partnership claim. Verified: the row reads
  'External validation | The report was read on public repositories we do not own.
  | A support upgrade, customer demand or a partnership.' under the Not
  established column.

## 5. Validate

- [x] 5.1 Run `pnpm format:check`, the added check, the test suite and
  `openspec validate preview-external-validation --strict`. Verify all exit 0.
  Verified 2026-09-22: `pnpm format:check` printed 'All matched files use
  Prettier code style!'; `node scripts/check-preview-external-validation.mjs`
  printed 'preview external validation: status and 2 declared repositories clean'
  and exited 0; `pnpm test` completed 'Tasks: 57 successful, 57 total';
  `openspec validate preview-external-validation --strict` printed "Change
  'preview-external-validation' is valid". `pnpm release` is out of scope, as
  this change publishes nothing.
