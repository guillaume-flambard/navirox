## Why

The 0.1.0 tags name a commit whose packages were still called `@navirox/*`, the
registry carries 26 of the 29 publishable workspaces at `0.1.0`, and the three
packages the public entry point needs are not on the registry at all. The
scaffolder makes that worse than it looks: outside a checkout it writes `0.0.0`
for every Navirox dependency, so `npm create navirox` produces an app that
cannot install from a registry even once the packages are all there.
`docs/evidence/release-candidate-2026-09-19.md` records the inventory and
`docs/evidence/native-pilot-journey.md` records that the native path is proven
from packed tarballs, but no candidate has been identified, released and
documented together.

## What Changes

- Every publishable workspace moves to one version through a single changeset,
  so a candidate is a version rather than a set of unrelated bumps.
- The scaffolder writes the released version of the Navirox packages instead of
  the `0.0.0` placeholder when it finds no checkout, so an app scaffolded
  outside this repository names dependencies that install.
- The candidate is packed, installed in a clean directory outside the
  workspace, and driven through the documented commands (`doctor`, `inspect`,
  `plan`, `migrate`) from those artifacts.
- Release notes state the prerequisites, what the candidate does, what stays
  manual, the publication sequence and the verification that follows it.
- The candidate commit is tagged, the tags that name earlier commits are left
  alone, and the version/tag mismatch is written down where a reader looks.

## Capabilities

### New Capabilities

- `project-scaffolding`: what a freshly scaffolded app records for the Navirox
  packages and what the scaffolder tells the user about it.
- `release-candidate`: what identifies a release candidate, what its artifacts
  must do outside the workspace, and what its notes must say.

### Modified Capabilities

- None

## Impact

- `packages/create-navirox`: `src/scaffold.ts` learns where its version comes
  from and what to write; a new test file covers both branches.
- `.changeset/`: one changeset bumps all 29 publishable workspaces to `0.1.1`.
- `docs/`: release notes for the candidate and the onboarding they describe.
- `docs/evidence/`: a candidate report with the clean-install transcript, the
  command transcripts and the per-platform result of the same commit.
- Tags: a candidate tag on the candidate commit.
- Not touched: every runtime, adapter, planner, migration and compatibility
  package keeps its behaviour, its version bump aside, and `examples/vue-basic`
  and `examples/vue-pilot` keep the code they ship today.
- Out of scope: publication itself, which stays issue #17 with its interactive
  step, and wiring the pilot journey into CI, which is a follow-up.
