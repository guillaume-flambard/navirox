## 1. Action and state contract

- [x] 1.1 Bump Workflow IR to schema 3; add typed state initial values, state provenance, closed action kind/operations, event/handler fields and explicit event `actionId`; verify serialization, round-trip and unknown action/target refusal with `corepack pnpm --filter @memolabs-apps/workflow test`.
- [x] 1.2 Add hand-written IR fixtures for `set`, `increment`, `toggle`, missing target, unknown operation, scalar initial values and unsupported state kinds; verify `corepack pnpm --filter @memolabs-apps/target-native test` consumes the neutral contract without source imports.

## 2. Vue lowering

- [x] 2.1 Lower scalar `ref` initializers and the accepted inline or one-statement named-handler grammar into linked action records with source locations; verify positive and boundary Vue fixtures with `corepack pnpm --filter @memolabs-apps/source-vue test`.
- [x] 2.2 Refuse arbitrary handlers, watchers, effects, parameters, modifiers, multiple statements and unsupported initializers without partial screen output; verify refusal codes and empty nodes in the lowering tests.

## 3. Target and workspace behavior

- [x] 3.1 Emit typed state initialization and deterministic handlers from the IR action model; verify supported mutations, linkage and refusal cases with `corepack pnpm --filter @memolabs-apps/target-native test`.
- [x] 3.2 Extend the generated workspace verifier with a deterministic action smoke test; verify `corepack pnpm --filter @memolabs-apps/cli test` and the generated workspace package test.

## 4. Baseline and evidence

- [x] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-action-state-execution --strict` and `corepack pnpm exec openspec validate --all`.
- [x] 4.2 Record the supported action/state profile, refusal codes and remaining device limitation in the change evidence before opening T3 device proof.
