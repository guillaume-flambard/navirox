# Navirox 0.1.1 release candidate

Candidate tag: `candidates/0.1.1`. This note describes what was verified on
that commit and what still has to happen by hand. It does not move any
existing tag; the `0.1.0` tags stay where they are (see "Known gaps" below).

## Prerequisites

- Node.js >= 22.13.0 and pnpm 11.x (`corepack use pnpm@11` pins it; the
  repo's `packageManager` field requires the 11.x line).
- No native toolchain is needed to verify the candidate: the Metro bundles
  for iOS and Android are produced by the pack-and-exercise run below, and
  the device/simulator journeys run in CI.
- The packed tarballs install from the local `artifacts/` directory the run
  keeps, so no registry access is needed either.

## What the candidate does

Version 0.1.1 is a single patch changeset over all 31 publishable
workspaces (29 `@memolabs-apps/*` packages plus `create-navirox` and the
`navirox` launcher) with one behaviour change:

- `npm create navirox` used to write generated apps whose Navirox
  dependencies were pinned to `0.0.0`, so `pnpm install` failed outside the
  monorepo. A generated app now records the scaffolder's own released
  version when no checkout is found, and the report says which registry
  version it used.

Everything else in 0.1.1 is the version bump and its changelogs.

## What was verified on the candidate (task 4 evidence)

The full evidence lives in
`docs/evidence/release-candidate-0.1.1.md`. In short, from the packed
tarballs, outside the monorepo checkout:

- 31/31 archives pack at 0.1.1.
- The scaffolded app installs with exactly one copy of the runtime.
- `npx navirox doctor` exits 0 on both platforms.
- `npx navirox inspect --json`, `plan --json`, and `migrate --write --json`
  each exit 0 against a Vue fixture app.
- Metro bundles build for iOS (6614 kB) and Android (6634 kB).
- `analyze`/`plan`/`migrate` were exercised for the Vue, Angular, Nuxt,
  Next, and React fixtures during the run.

## What stays manual

- **Publication.** Publishing the 31 workspaces to the public registry is
  owned by issue #17 (interactive `npm login` with a security key) and is
  deliberately not part of this candidate. Until that happens,
  `npx navirox` does not resolve against the public registry.
- **Device journeys.** Carrying the pilot journey on a real simulator and
  emulator is CI's job (see the evidence report); it is not re-run by hand
  here.

## Publication sequence (for issue #17)

1. Check out the `candidates/0.1.1` tag.
2. Run `pnpm publish -r` (changesets drives the per-package publish order).
3. Verify with `npm view <name> versions` for every published workspace;
   each one must list `0.1.1`. The check must cover all 31 names, including
   `create-navirox` and `navirox`.
4. After publication, `npm create navirox my-app && cd my-app && pnpm install`
   must succeed from the public registry with no checkout present.

## Known gaps

- The `0.1.0` tags predate the scoped rename: bare `0.1.0` and
  `create-navirox@0.1.0` point at the pre-rename commit, and the 29 scoped
  `@0.1.0` tags point at the rename commit, five commits behind the design
  baseline. They are left untouched on purpose.
- The registry still holds 26 of the 29 scoped packages at `0.1.0`
  (`cli`, `source-lit`, and `source-solid` 404). Closing that gap is the
  publication step above, owned by issue #17, not by this candidate.
