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

- [ ] `pnpm docs:check`, `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format:check` and `pnpm deps:check` are green
- [ ] New behavior has a test, and a bug fix has a test that fails without the fix
- [ ] No application code imports anything outside `@memolabs-apps/*`
- [ ] Only `@memolabs-apps/runtime-symbiote` touches Symbiote or React Native
- [ ] No Symbiote type, class, component or prop name is re-exported from a public package
- [ ] Any new dependency records its exact version and the reason it exists
- [ ] A user-facing change has a changeset (`pnpm changeset`)
- [ ] Public claims name their evidence and limitations, and committed paths are portable
