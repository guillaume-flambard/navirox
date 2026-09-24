# vue-transform-workspace-run tasks

## 1. Contract and fixtures

- [x] 1.1 Create the proposal, design and requirement delta for the delivered CLI path and compiler-backed generated workspace. Done: `openspec/changes/vue-transform-workspace-run/` contains the artifacts and `corepack pnpm exec openspec validate vue-transform-workspace-run --strict` passes.
- [x] 1.2 Add a positive Vue fixture with literal routes and supported `script setup`, state, interpolation, event and `v-model` constructs. Done: `packages/cli/fixtures/vue-transform-workspace/vue/`.
- [x] 1.3 Add a separate refusal fixture with one supported screen and one explicitly refused construct. Done: `packages/cli/fixtures/vue-transform-workspace-refused/vue/`.

## 2. Valid generated source

- [x] 2.1 Preserve non-empty static text as a `text` binding in `source-vue` lowering. Done: `corepack pnpm --filter @memolabs-apps/source-vue test` passes 38/38.
- [x] 2.2 Render target bindings as valid Vue syntax and derive deterministic import-safe screen stems. Done: `corepack pnpm --filter @memolabs-apps/target-native test` passes 9/9, `corepack pnpm --filter @memolabs-apps/source test` passes 58/58, and both target/source-vue builds exit 0.

## 3. Workspace scaffold

- [x] 3.1 Pass lowering and emission results to the scaffold stage and add the generated Vue workspace files. Done: `corepack pnpm --filter @memolabs-apps/cli test` passes 138/138 and the CLI build exits 0.
- [x] 3.2 Add a generated workspace verifier that compiles every SFC and fails on compiler errors. Done: the positive generated workspace test exits 0 with `Verified 3 Vue SFCs.`; the refusal output remains empty.

## 4. Real CLI composition

- [x] 4.1 Add the production Vue-only composition root and wire it into `runCli()` when no test context supplies transform dependencies. Done: `createDefaultTransformDeps()` composes the real Vue inspection, lowering, target and scaffold; `corepack pnpm install` and the no-context CLI test pass.
- [x] 4.2 Keep explicit fake-provider tests isolated and retain the existing missing-provider refusal for direct `transform()` calls without dependencies. Done: `corepack pnpm --filter @memolabs-apps/cli test` passes 140/140 and the direct transform contract remains injectable.

## 5. Evidence and baseline

- [x] 5.1 Run the delivered positive fixture through `runCli()` without injected providers, run the generated workspace test and retain the command, hashes and result. Done: `transform-delivered.test.ts` passes, the workspace test reports `Verified 3 Vue SFCs.`, and `docs/evidence/vue-transform-workspace-run.md` records hashes and commands.
- [x] 5.2 Run the refusal fixture and retain its finding and no-file result. Done: the delivered refusal run exits 1 with `unsupported-watcher` and `uncovered-screen`, and the output directory remains empty.
- [x] 5.3 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-transform-workspace-run --strict` and `corepack pnpm exec openspec validate --all`. Done: build 66/66, tests 66/66, lint clean, format clean, strict change valid, all specs 60/60.
