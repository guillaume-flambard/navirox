# Contributing to Navirox

Navirox is pre-alpha. `PLAN.md` is the plan of record for what gets built and in
what order, so start there when you want to know where a contribution fits. If
your change and `PLAN.md` disagree, say so in the pull request instead of quietly
diverging.

## Prerequisites

- **Node 22.13 or newer.** The floor matches upstream, and CI runs 22.x.
- **pnpm 11.x.** It is pinned through `packageManager` in the root
  `package.json`, so `corepack enable` is all you need. Do not move the project
  onto another major line to make a local problem go away.
- **Watchman** is optional, but Metro starts faster with it.

## Set up

```bash
corepack enable
pnpm install
pnpm build
pnpm test
```

## The gate suite

Every one of these has to pass before a pull request is merged:

```bash
pnpm build         # turbo, honours the TypeScript project references
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check  # pnpm format writes the fix
pnpm deps:check    # syncpack, the version drift guard
```

`pnpm build && pnpm test` green is the baseline. Do not leave the workspace red.

`pnpm install` installs a git hook that runs that same list on every commit, so
a slip is caught at the commit instead of on the runners. It is the same list
rather than a similar one, and it scans the whole repository the way CI does, so
an unrelated dirty file can block a commit. The platform builds are deliberately
not in it: they need a native toolchain and several minutes, so a green hook is
not a promise that CI is green.

## The architectural rules

`AGENTS.md` is the full contract. Two of its rules account for most review
comments:

1. **`@memolabs-apps/runtime-symbiote` is the only package allowed to import
   `@symbiote-native/*`**, `react-native`, or anything else from the Fabric
   host. Every other package depends on the seam in `@memolabs-apps/runtime`.
2. **Applications import only `@memolabs-apps/*`.** Zero `@symbiote-native/*` imports
   in application code.

Both are enforced by an import-boundary test rather than by convention. If your
change makes that test fail, the change is wrong, not the test.

A third rule is easy to break by accident: **never re-export a Symbiote type,
class, component or prop name** from a public `@memolabs-apps/*` package. Our public
API is ours. If a Symbiote concept leaks into our types, the engine stops being
swappable.

## Commits

`type(scope): imperative summary (NX-nnn)` is the convention, for example
`feat(metro-preset): compose the Vue SFC transforms (NX-005)`. Reference the
plan task your change serves when there is one.

## Changesets

A change that affects what a user sees needs a changeset. A change to a package
in `packages/` affects a user: those packages are what get installed. A change
to the docs, to a workflow or to `PLAN.md` does not, and neither does a change
to `examples/vue-basic`, which exists to exercise the packages rather than to
ship with them.

```bash
pnpm changeset                       # write one, and commit it with the change
pnpm changeset status --since=main   # see what is missing before you push
```

`pnpm changeset status --since=<ref>` compares the packages against the given
ref and exits non-zero when one of them changed without a changeset, naming the
remedy in its output (`pnpm changeset add`, or `pnpm changeset add --empty` when
the change genuinely needs no release). CI runs exactly that on a pull request,
against the commit the branch forked from, so a pull request that changes a
package without a changeset fails there rather than at the next release.

The release itself is a maintainer's job:

```bash
pnpm version-packages          # apply the changesets: bump, then write changelogs
pnpm exec changeset git-tag    # tag the release commit, one tag per package
pnpm release                   # build, then publish to npm, which needs credentials
```

## Running the example

`examples/vue-basic` is the acceptance render for the runtime and the Metro
preset. It is a workspace member, so it resolves `@memolabs-apps/*` through
`workspace:*` and exercises the code in this repository rather than a registry
that has nothing to publish yet.

## Pull requests

- Keep the change focused. One concern per pull request.
- Say what you verified. "Tests pass" is weaker than "`pnpm test` in
  `packages/metro-preset`, plus a render on the iOS simulator".
- Do not add a dependency without recording its exact version and the reason it
  exists. Upstream moves fast, and that record is what lets us tell drift from
  breakage.
- New behavior needs a test. A bug fix needs a test that fails before it.
