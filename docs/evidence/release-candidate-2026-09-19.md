# Release candidate verification, 2026-09-19

This records the release checks for issues #16, #17 and #18. The package
candidate is `5eb8b0c`. Later changes to the scaffold verification script do not
change the package artifacts.

## Root publication boundary

The committed root `package.json` has `private: true`. So does the only example
workspace, `examples/vue-basic`. `.changeset/config.json` ignores
`navirox-monorepo`. There are 29 publishable package workspaces: 28 scoped packages
and `create-navirox`, not 29 scoped packages plus the scaffolder.

All 28 scoped packages explicitly declare public access. The unscoped scaffolder
does not declare `publishConfig`; the changesets configuration declares public
access for the release.

The installed npm is 11.19.0. Its `libnpmpublish/lib/publish.js` checks
`manifest.private` before resolving registry configuration or making a request.
Calling that function with the actual root manifest, an empty buffer and an
unreachable localhost registry produced `EPRIVATE`. No root archive was uploaded
or even constructed for this check. A dry run alone is insufficient evidence:
the npm command skips the library publish call in dry-run mode.

The public registry metadata for `navirox-monorepo` returned an empty versions
object and an unpublication timestamp of `2026-09-19T08:48:42.903Z`. Issue #16
records the earlier accidental publication and withdrawal. The reported name
reservation period is not a reason to retry publishing the root.

## Package verification

Direct public registry requests for each local package name and version found
26 of the 29 packages at `0.1.0`. Only these returned 404 at the start of this
verification:

- `@memolabs-apps/cli`
- `@memolabs-apps/source-lit`
- `@memolabs-apps/source-solid`

Their archives were packed with pnpm 11.27.0. Inspection confirmed that the
declared entry points and CLI binary exist, internal dependency ranges have
been resolved from `workspace:*`, and the archives contain only the manifest,
license and distribution files. Registry presence must be checked again after
authentication; packing and starting a publish command are not publication
evidence.

## Scaffold regression

Running `corepack pnpm exec node scripts/e2e-scaffold.mjs` on the candidate
failed immediately with `pnpm pack wrote no artifact for @memolabs-apps/build`.
The scope rename changed archive names but left the script expecting a
`navirox-` prefix.

The script now supplies an explicit archive path through pnpm's documented
`pack --out` option and uses that same path for installation. Both scoped and
unscoped packages use their actual names.

The corrected `corepack pnpm exec node scripts/e2e-scaffold.mjs --bundle` run
passed: all 29 archives were packed, the generated app installed outside the
workspace, its lint and CLI checks passed, the runtime resolved to one copy,
and Metro produced both iOS and Android bundles.

## Tag reconciliation

The remote already has `0.1.0` and `create-navirox@0.1.0` at `4f30b8b`.
Their local counterparts had been moved to `5eb8b0c`. The remote tags are
preserved. The local candidate tag objects were first retained as
`candidates/0.1.0` and `candidates/create-navirox@0.1.0`, then the two historical
local names were restored from the remote. The 28 new `@memolabs-apps/*@0.1.0`
tags identify `5eb8b0c`. No remote tag is rewritten or deleted.

## Local gates

`corepack pnpm exec turbo run build typecheck test --force` passed all 88 tasks
with zero cache hits. Lint, formatting and dependency checks also passed.
Native build and journey results belong to the CI run for the pushed commit,
linked from issue #18; this local gate does not establish those results.
