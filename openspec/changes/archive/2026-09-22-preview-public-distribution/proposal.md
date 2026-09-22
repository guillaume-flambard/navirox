# preview-public-distribution

## Why

The Vue/Nuxt developer-preview contract accepts either of two outcomes for public
distribution: a proven public consumer path, or a retained, honestly stated
tarball limitation (`docs/DEVELOPER-PREVIEW.md`, task 3.3 of
`vue-nuxt-developer-preview-contract`). The acceptance bar requires that "a new
user can follow one documented public installation and analysis path without
workspace links or unpublished dependencies", and the verified-boundary table
currently lists Distribution as "packed tarballs have a verified path" while
"A fresh public `npx navirox` installation" is under Not established.

A registry probe on 2026-09-22 shows the public path is blocked by unpublished
packages, so this change takes the second branch: it establishes the tarball path
as the one verified consumer installation and states the registry gap exactly
rather than implying an install that cannot work.

The probe result: 26 of 31 workspace packages resolve on the public registry at
`0.1.0`, and five do not exist there at all.

- `@memolabs-apps/cli`: NOT PUBLISHED
- `@memolabs-apps/source-lit`: NOT PUBLISHED
- `@memolabs-apps/source-solid`: NOT PUBLISHED
- `@memolabs-apps/target-vue`: NOT PUBLISHED
- `@memolabs-apps/visual-benchmark`: NOT PUBLISHED

Two dependency links make this block the documented path, not merely the CLI:

- the `navirox` wrapper package depends on `@memolabs-apps/cli`, which is
  unpublished, so `npx navirox <command>` cannot resolve publicly;
- `@memolabs-apps/cli` depends on `@memolabs-apps/source-lit` and
  `@memolabs-apps/source-solid`, neither published, so even a manually published
  CLI would not install.

`create-navirox` resolves at `0.1.0`, but the published version predates the
packages it points at and writes the generated app's Navirox dependencies as
`0.0.0`, which `pnpm install` cannot resolve outside this repository.

## What Changes

- Re-run the documented consumer installation path and record its result,
  including the exact unpublished package names above.
- State in `docs/DEVELOPER-PREVIEW.md` and `docs/GETTING-STARTED.md` that the
  packed tarballs of `pnpm test:e2e` are the only verified consumer path today,
  and that the public registry path is blocked by the five unpublished packages,
  not by a documentation error.
- Do not publish packages, do not add a registry token, and do not soften the
  limitation into a claim that a public install works.
- Add a check that fails when a documented install path names a package the
  registry does not serve, so the stated limitation cannot silently drift out of
  date.

## Capabilities

### New Capabilities

- `preview-public-distribution`: the developer preview names one verified
  consumer installation path, and any public registry path it documents is
  checked against the registry rather than asserted.

### Modified Capabilities

None.

## Impact

This change touches `docs/DEVELOPER-PREVIEW.md`, `docs/GETTING-STARTED.md` and
one check script plus its test. It changes no package, no adapter, no target
provider, no runtime and no benchmark. It publishes nothing. It does not raise
the preview's support status and does not claim that the public registry path
works.
