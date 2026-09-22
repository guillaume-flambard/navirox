# Tasks

## 1. Re-run the documented consumer path

- [x] 1.1 Re-run the documented public installation path and record its exact
  result. Verify the record names the command and the failure, including the
  unpublished package that blocks it. Verified 2026-09-22: `npx --yes
  navirox@latest doctor` exits with `npm error code E404`,
  `404 Not Found - GET https://registry.npmjs.org/navirox - Not found`, and
  `npx --yes navirox@latest analyze .` fails the same way; `npx --yes
  @memolabs-apps/cli@latest --help` fails with `404 Not Found - GET
  https://registry.npmjs.org/@memolabs-apps%2fcli - Not found`.
- [x] 1.2 Probe every workspace package against the public registry and record
  which are published. Verify the record names `@memolabs-apps/cli`,
  `@memolabs-apps/source-lit`, `@memolabs-apps/source-solid`,
  `@memolabs-apps/target-vue` and `@memolabs-apps/visual-benchmark` as not
  published. Verified 2026-09-22: 26 of 31 workspace packages resolve at `0.1.0`
  and those five do not exist on the registry (`create-navirox` resolves at
  `0.1.0`; `navirox` itself is not a published package).
- [x] 1.3 Trace the dependency links that make the public path fail. Verify the
  record shows `navirox` depends on `@memolabs-apps/cli`, and `@memolabs-apps/cli`
  depends on `@memolabs-apps/source-lit` and `@memolabs-apps/source-solid`.
  Verified: `packages/navirox/package.json` declares
  `"@memolabs-apps/cli": "workspace:*"`, and `packages/cli/package.json` declares
  `"@memolabs-apps/source-lit": "workspace:*"` and
  `"@memolabs-apps/source-solid": "workspace:*"`, so the public path fails at two
  links.

## 2. State the verified path and the limitation

- [x] 2.1 Update `docs/DEVELOPER-PREVIEW.md` to name the packed-tarball path as
  the verified consumer installation and the five unpublished packages as the
  public gap. Verify no sentence claims a working public `npx navirox` install.
  Verified: the Distribution row still reads 'Packed tarballs have a verified
  path.' with 'A fresh public `npx navirox` installation.' under Not established,
  and a new 'Installation path' paragraph names `pnpm test:e2e` as the only
  verified path and `@memolabs-apps/cli`, `@memolabs-apps/source-lit`,
  `@memolabs-apps/source-solid`, `@memolabs-apps/target-vue` and
  `@memolabs-apps/visual-benchmark` as absent from the registry.
- [x] 2.2 Update `docs/GETTING-STARTED.md` so the public path states the same
  five packages. Verify the tarball path is named as the verified one. Verified:
  the limitation paragraph now names the five packages instead of three and adds
  that `navirox` itself is not published; `scripts/e2e-scaffold.mjs` and
  `pnpm test:e2e` remain the named working reference.

## 3. Add the registry check

- [x] 3.1 Add a check that reads the packages a documented install path names
  and fails when the registry does not serve one. Verify a seeded missing package
  fails and the real set passes. Verified: `scripts/lib/public-distribution.mjs`
  declares `DOCUMENTED_PACKAGES` and `STATED_UNPUBLISHED`, and
  `scripts/check-public-distribution.mjs` fails when the registry and the stated
  limitation disagree in either direction. `node scripts/check-public-distribution.mjs`
  prints 'public distribution: 6 documented packages match the stated limitation
  (6 unpublished)' and exits 0 against the live registry.
- [x] 3.2 Add a test proving the seeded failure names the missing package.
  Verify the test fails when the check is given an unpublished name. Verified:
  `packages/visual-benchmark/src/public-distribution.test.ts` passes 3/3 and its
  seeded cases assert a `needed-but-not-stated-unpublished` finding names
  `@memolabs-apps/target-vue`, and that a package stated unpublished but served
  is flagged `stated-unpublished-but-served`. Each finding carries the package
  name only, never a version or a registry body.

## 4. Validate

- [x] 4.1 Run `pnpm format:check`, the added check, the test suite and
  `openspec validate preview-public-distribution --strict`. Verify all exit 0.
  Verified 2026-09-22: `pnpm format:check` printed 'All matched files use
  Prettier code style!'; `node scripts/check-public-distribution.mjs` printed
  'public distribution: 6 documented packages match the stated limitation (6
  unpublished)' and exited 0; `pnpm test` completed 'Tasks: 57 successful, 57
  total'; `openspec validate preview-public-distribution --strict` printed
  "Change 'preview-public-distribution' is valid". `pnpm release` is out of
  scope, as this change publishes nothing.
