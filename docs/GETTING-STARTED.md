# Getting started from source

Navirox is pre-alpha. The public npm package set is incomplete, so neither
`npm create navirox` nor `npx navirox` is a supported starting point today.
These instructions use the repository source and match the path verified in CI.

## Prerequisites

For analysis, generation, and repository tests you need:

- Node.js 22.13 or newer
- Corepack, with the repository's pinned pnpm version
- Git

Running native examples also needs Xcode and CocoaPods for iOS, or Java 17 and
the Android SDK for Android. The ordinary source checks below do not need a
native toolchain.

## Set up the repository

```bash
git clone https://github.com/guillaume-flambard/navirox.git
cd navirox
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

The install uses workspace dependencies. It proves the checked-out source, not
a public consumer installation.

## Analyze a project

After the build, call the CLI entry point directly:

```bash
node packages/cli/dist/bin.js analyze /path/to/project --json
```

The command selects a source adapter from the manifest and source files, then
reports routes, components, state, capabilities, and uncertainty. If more than
one framework is plausible, select one explicitly:

```bash
node packages/cli/dist/bin.js analyze /path/to/project \
  --framework angular \
  --json
```

Analysis is not a conversion claim. Detection and parsing can establish what a
repository contains without establishing that every screen is portable.

## Run the bounded Vue transform

The repository includes a small positive fixture and a refusal fixture. This is
the shortest reproducible generation path:

```bash
node packages/cli/dist/bin.js transform \
  "$PWD/packages/cli/fixtures/vue-transform-workspace/vue" \
  --profile vue-mobile \
  --out /tmp/navirox-vue-preview \
  --write \
  --json
corepack pnpm --dir /tmp/navirox-vue-preview install --ignore-scripts
corepack pnpm --dir /tmp/navirox-vue-preview test
```

The generated workspace test parses and compiles its Vue single-file
components. It does not run a browser, native shell, iOS build, Android build,
device journey, or visual comparison. The exact observed run is in
[the Vue transform evidence](evidence/vue-transform-workspace-run.md).

To see refusal behavior, replace the input with:

```text
packages/cli/fixtures/vue-transform-workspace-refused/vue
```

That run is expected to exit with code 1 and leave the output empty because the
fixture contains unsupported behavior. Refusal is part of the product contract,
not a fallback error.

## Exercise the native runtime path

The repository's native evidence comes from a separate Vue runtime example. CI
packs publishable workspaces into tarballs, installs an application outside the
monorepo, checks that it resolves one runtime copy, bundles both platforms, and
builds the native projects.

```bash
pnpm test:e2e
```

This command performs the portable bundle path. Native compilation requires the
matching platform toolchain. The full iOS, Android, and device journeys are run
by the repository workflows.

## Before opening a pull request

Run the gates listed in [CONTRIBUTING.md](../CONTRIBUTING.md), including
`pnpm docs:check`. For project boundaries and current proof claims, continue
with [the documentation index](README.md).
