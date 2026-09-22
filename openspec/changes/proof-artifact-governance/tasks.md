# Tasks

## 1. Define artifact boundaries

- [x] 1.1 Create a proof-artifact manifest format that identifies provenance,
  retention purpose, and permitted data class for fixtures, captures, reports,
  and uploads. Verify a representative existing capture report can be described
  without adding a secret or personal datum.
  - `docs/PROOF-ARTIFACTS.md` declares the four fields and lists the fourteen
    existing artifacts, including the iOS and Android native capture reports;
    `scripts/lib/proof-artifacts.mjs` carries the same table as its
    machine-readable twin, and the hygiene test fails when a manifest path is
    missing from the document, so the two cannot drift apart.
- [x] 1.2 Define a small allowlist for original assets and synthetic data plus a
  review path for ambiguous material. Verify the policy preserves the pilot
  briefs' Baserow and SuiteCRM license and branding boundaries.
  - `docs/PROOF-ARTIFACTS.md` allows only original assets drawn for this
    project, synthetic fixture data and command measurements, sends everything
    else to a pull-request review that records provenance, purpose and data
    class, and repeats the pilot briefs' boundary: no Baserow or SuiteCRM name,
    logo or store asset without written permission, and no customer data.

## 2. Add hygiene checks

- [x] 2.1 Add a deterministic hygiene check over declared proof paths for
  credential-shaped values, unapproved fixture data, and undeclared assets.
  Verify seeded prohibited test inputs fail and known approved fixtures pass.
  - `scripts/check-proof-artifacts.mjs` reports the artifact class and the rule
    and never the matched value, and
    `packages/visual-benchmark/src/proof-artifacts.test.ts` proves nine cases,
    including a seeded cloud key, JWT shape and secret assignment failing while
    the declared artifacts stay clean.
- [x] 2.2 Run the check before proof artifact upload in CI. Verify a failed check
  blocks the upload and its report identifies the artifact class, not a secret
  value.
  - Both capture jobs in `.github/workflows/ci.yml` run
    `node scripts/check-proof-artifacts.mjs` immediately before their upload,
    and both uploads are gated on
    `steps.proof-artifacts.outcome == 'success'`, so a finding fails the step,
    fails the job and blocks the upload while a failed capture still uploads.

## 3. Requalify without rewriting history

- [x] 3.1 Add a requalification command or CI schedule that compares the
  benchmark's current upstream reference with its pinned evidence and reports
  drift separately. Verify it cannot modify a historical report or catalog
  entry.
  - `scripts/requalify-benchmarks.mjs` asks every catalog repository for its
    current head and writes only `docs/evidence/requalification.json`; the
    history-preservation case in
    `packages/visual-benchmark/src/benchmark-requalification.test.ts` asserts
    the catalog and a seeded historical report are byte-identical afterwards.
- [x] 3.2 Document the decision path for a drift finding: retain, create a new
  pinned profile, or retire a claim. Verify the proof index can link both old
  evidence and the requalification result.
  - `docs/PROOF-ARTIFACTS.md` records the three decisions and notes that neither
    the old evidence nor the requalification result is rewritten, so an index
    can link both.

## 4. Validate

- [x] 4.1 Run `pnpm format:check` and `openspec validate proof-artifact-governance
  --strict`. Verify both commands exit 0.
  - Both exit 0.
