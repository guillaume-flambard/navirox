# Proof artifacts

Proof evidence is only trustworthy if a reader can tell where each artifact came
from, why it is kept and what it is allowed to contain. This document defines
that, the allowlist for original material, the hygiene check that enforces it,
and the path for a benchmark whose upstream has moved.

## The manifest format

Every proof artifact is described by four fields.

| Field        | Meaning                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `path`       | The repository path of the artifact.                                                           |
| `provenance` | The command that produced it and the immutable input it used.                                  |
| `purpose`    | Why it is retained: `evidence`, `report`, `fixture`, `asset` or `capture`.                     |
| `dataClass`  | What it may contain: `synthetic`, `original-asset`, `measurement`, `source-derived` or `none`. |

A manifest entry MUST NOT contain a credential, a personal datum, real customer
data or a copied third-party asset. `scripts/check-proof-artifacts.mjs` enforces
the parts that can be checked mechanically, and its report names the artifact
class and the rule rather than the value it matched.

## The declared artifacts

| Path                                                                               | Provenance                                                                                                            | Purpose  | Data class     |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------- | -------------- |
| `docs/evidence/native-capture-field-workflow-ios.json`                             | `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios` against the field-workflow fixture | report   | measurement    |
| `docs/evidence/native-capture-field-workflow-android.json`                         | the CI capture job of run 35729980890                                                                                 | report   | measurement    |
| `docs/evidence/angular-companion-device-evidence-ios.json`                         | `node scripts/capture-angular-companion.mjs --platform ios`                                                           | report   | measurement    |
| `docs/evidence/angular-companion.provenance.json`                                  | `node scripts/build-angular-companion.mjs`                                                                            | evidence | measurement    |
| `docs/evidence/vue-companion-assembly.provenance.json`                             | `node scripts/build-field-workflow-companion.mjs`                                                                     | evidence | measurement    |
| `docs/evidence/workflow-baserow-field-work.md`                                     | `pnpm test:benchmarks -- --project baserow`                                                                           | report   | source-derived |
| `docs/evidence/workflow-suitecrm-record-workflow.md`                               | `pnpm test:benchmarks -- --project suitecrm`                                                                          | report   | source-derived |
| `docs/evidence/records-scenario-report.json`                                       | `node packages/visual-benchmark/scripts/run-records-scenario.mjs`                                                     | report   | measurement    |
| `docs/evidence/records-motion-report.json`                                         | `node packages/visual-benchmark/scripts/run-records-motion.mjs`                                                       | report   | measurement    |
| `docs/evidence/records-scenario-comparison.json`                                   | `node packages/visual-benchmark/scripts/compare-records-scenario.mjs`                                                 | report   | measurement    |
| `packages/target-vue/fixtures/field-workflow/site-photo.svg`                       | drawn for this project                                                                                                | asset    | original-asset |
| `packages/source-angular/fixtures/record-workflow/src/app/site-photo.svg`          | drawn for this project                                                                                                | asset    | original-asset |
| `packages/target-vue/fixtures/field-workflow/fieldRecords.ts`                      | invented for this project                                                                                             | fixture  | synthetic      |
| `packages/source-angular/fixtures/record-workflow/src/app/record-workflow.data.ts` | invented for this project                                                                                             | fixture  | synthetic      |

The same table is declared in `scripts/lib/proof-artifacts.mjs` so the check and
this document cannot drift apart.

## The allowlist

Only material created for this project may appear in a proof path.

- **Original assets**: SVG or raster files drawn for this project, listed above.
  No benchmark project's logo, icon, screenshot or store asset may be copied.
- **Synthetic data**: invented records and field values in the fixture data
  modules listed above. No real record, customer name, address or identifier.
- **Measurements**: counts, sizes, hashes and verdicts produced by a command.

Anything else is ambiguous and goes to review: a new fixture, a new asset, a
capture that renders a third-party interface, or any file whose origin is not one
of the commands above. The review path is a pull request that adds the entry to
the declared table with its provenance, purpose and data class, plus a reviewer
who confirms the three rules. The pilot briefs' boundaries apply unchanged: no
Baserow or SuiteCRM name, logo or store asset without written permission, and no
customer-specific data in this repository.

## The hygiene check

`node scripts/check-proof-artifacts.mjs` scans the proof paths, which are the
declared artifacts plus the fixture trees, for:

- credential-shaped values in every declared artifact: private keys, cloud
  access keys, bearer and JWT shapes, and assignments to names such as
  `api_key`, `secret`, `token` or `password`;
- unapproved fixture data: a record-bearing data file (CSV, SQL, spreadsheet,
  env or newline-delimited JSON) under a `fixtures/` directory that is not in
  the declared table;
- undeclared assets: an image or binary file in a proof path that is not in the
  declared table.

It reports the artifact class and the rule, never the matched value, and exits
non-zero when it finds something. `packages/visual-benchmark/src/proof-artifacts.test.ts`
proves it fails on seeded prohibited inputs and passes on the approved fixtures.
The continuous-integration capture jobs run it before they upload their
artifacts, so a failed check blocks the upload.

## Requalification and drift

`node scripts/requalify-benchmarks.mjs` reads `benchmarks/catalog.json`, asks each
repository for its current default-branch commit, and reports whether the pinned
commit is still the head. It writes only `docs/evidence/requalification.json` and
cannot modify a historical report or a catalog entry: a drift finding is a
question for a person, not an edit.

The decision path for a drift finding is:

1. **Retain**: the pinned revision still represents what was measured, and the
   entry stays with a note that the upstream moved.
2. **Create a new pinned profile**: a new catalog entry with the new revision,
   measured from scratch, leaving the old entry and its evidence intact.
3. **Retire a claim**: the drift invalidates the claim, so the claim is withdrawn
   in the document that made it and the old evidence stays as history.

A future proof index can link both the old evidence and the requalification
result, because neither is rewritten.
