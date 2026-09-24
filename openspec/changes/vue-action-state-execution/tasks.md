## 1. Action and state contract

- [ ] 1.1 Add closed action operations, state targets and typed initial values to the Workflow IR; verify serialization, validation and unknown-kind refusal with `corepack pnpm --filter @memolabs-apps/workflow test`.
- [ ] 1.2 Add hand-written IR fixtures for `set`, `increment`, `toggle`, missing target and unknown operation; verify `corepack pnpm --filter @memolabs-apps/target-native test` exposes the contract without source imports.

## 2. Vue lowering

- [ ] 2.1 Lower supported inline state mutations and declared initial values with source locations; verify positive and boundary Vue fixtures with `corepack pnpm --filter @memolabs-apps/source-vue test`.
- [ ] 2.2 Refuse arbitrary handlers, watchers, effects and unsupported initializers without partial screen output; verify refusal codes and empty nodes in the lowering tests.

## 3. Target and workspace behavior

- [ ] 3.1 Emit deterministic handlers and state initialization from the IR action model; verify supported mutation and refusal cases with `corepack pnpm --filter @memolabs-apps/target-native test`.
- [ ] 3.2 Extend the generated workspace verifier with a deterministic action smoke test; verify `corepack pnpm --filter @memolabs-apps/cli test` and the generated workspace package test.

## 4. Baseline and evidence

- [ ] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-action-state-execution --strict` and `corepack pnpm exec openspec validate --all`.
- [ ] 4.2 Record the supported action/state profile, refusals and remaining device limitation in the change evidence before opening T3 device proof.
