# Tasks

## 1. Define artifact boundaries

- [ ] 1.1 Create a proof-artifact manifest format that identifies provenance,
  retention purpose, and permitted data class for fixtures, captures, reports,
  and uploads. Verify a representative existing capture report can be described
  without adding a secret or personal datum.
- [ ] 1.2 Define a small allowlist for original assets and synthetic data plus a
  review path for ambiguous material. Verify the policy preserves the pilot
  briefs' Baserow and SuiteCRM license and branding boundaries.

## 2. Add hygiene checks

- [ ] 2.1 Add a deterministic hygiene check over declared proof paths for
  credential-shaped values, unapproved fixture data, and undeclared assets.
  Verify seeded prohibited test inputs fail and known approved fixtures pass.
- [ ] 2.2 Run the check before proof artifact upload in CI. Verify a failed check
  blocks the upload and its report identifies the artifact class, not a secret
  value.

## 3. Requalify without rewriting history

- [ ] 3.1 Add a requalification command or CI schedule that compares the
  benchmark's current upstream reference with its pinned evidence and reports
  drift separately. Verify it cannot modify a historical report or catalog entry.
- [ ] 3.2 Document the decision path for a drift finding: retain, create a new
  pinned profile, or retire a claim. Verify the proof index can link both old
  evidence and the requalification result.

## 4. Validate

- [ ] 4.1 Run `pnpm format:check` and `openspec validate proof-artifact-governance
  --strict`. Verify both commands exit 0.
