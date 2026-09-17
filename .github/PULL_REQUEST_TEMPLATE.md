## What this changes

<!-- One or two sentences. The diff shows the how; this says the what and the why. -->

## Why

<!-- The problem being solved, or the plan task being served. -->

Refs:

## How it was verified

<!--
Be specific. "Tests pass" is weaker than the line below.
- pnpm test in packages/metro-preset
- rendered on the iOS simulator
- reproduced the failure before the fix and confirmed it is gone after
-->

## Checklist

- [ ] `pnpm build && pnpm test` is green, and so are `pnpm typecheck`, `pnpm lint`, `pnpm format:check` and `pnpm deps:check`
- [ ] New behavior has a test, and a bug fix has a test that fails without the fix
- [ ] No application code imports anything outside `@navirox/*`
- [ ] Only `@navirox/runtime-symbiote` touches Symbiote or React Native
- [ ] No Symbiote type, class, component or prop name is re-exported from a public package
- [ ] Any new dependency records its exact version and the reason it exists
- [ ] A user-facing change has a changeset (`pnpm changeset`)
