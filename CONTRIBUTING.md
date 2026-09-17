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

## The architectural rules

`AGENTS.md` is the full contract. Two of its rules account for most review
comments:

1. **`@navirox/runtime-symbiote` is the only package allowed to import
   `@symbiote-native/*`**, `react-native`, or anything else from the Fabric
   host. Every other package depends on the seam in `@navirox/runtime`.
2. **Applications import only `@navirox/*`.** Zero `@symbiote-native/*` imports
   in application code.

Both are enforced by an import-boundary test rather than by convention. If your
change makes that test fail, the change is wrong, not the test.

A third rule is easy to break by accident: **never re-export a Symbiote type,
class, component or prop name** from a public `@navirox/*` package. Our public
API is ours. If a Symbiote concept leaks into our types, the engine stops being
swappable.

## Commits

`type(scope): imperative summary (NX-nnn)` is the convention, for example
`feat(metro-preset): compose the Vue SFC transforms (NX-005)`. Reference the
plan task your change serves when there is one.

## Changesets

A change that affects what a user sees needs a changeset:

```bash
pnpm changeset
```

## Running the example

`examples/vue-basic` is the acceptance render for the runtime and the Metro
preset. It is a workspace member, so it resolves `@navirox/*` through
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
