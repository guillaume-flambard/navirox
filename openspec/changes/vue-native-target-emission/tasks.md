# vue-native-target-emission tasks

## 1. The target package and its provider

- [x] 1.1 Create `packages/target-native` (package.json, tsconfig.json, src) and
  add it to the root `tsconfig.json` references. Export
  `createNativeTarget(): TargetProvider` from `packages/target-native/src/index.ts`.
  Done: `corepack pnpm --filter @memolabs-apps/target-native build` exits 0 and
  the contract tests call `emit` on hand-written workflows.
- [x] 1.2 Emit one native single file component per `generated` screen at
  `generated/<screen-id>.vue`, built from the IR's `ViewNode`s (primitive,
  bindings, actions) and any `testID` binding. Done: a positive IR yields the
  expected file path and content, with the manifest beside it.
- [x] 1.3 Move the target-side seam types (`TargetProvider`, `TargetProfile`,
  `EmittedFile`, `EmissionResult`, `EmissionFinding`) from
  `@memolabs-apps/source` into the neutral `@memolabs-apps/workflow` package and
  re-export them from `@memolabs-apps/source`. Done: the target imports the
  contract from `@memolabs-apps/workflow`, the source-side seam re-exports it, and
  the import-boundary tests pass.

## 2. Refusal and provenance

- [x] 2.1 Refuse a screen whose `coverage.kind` is not `generated` with a finding
  and no file. Done: a `refused`, a `manual-required` and an `excluded` screen each
  yield an `uncovered-screen` finding and no emitted file.
- [x] 2.2 Emit a deterministic provenance manifest per screen naming the IR hash
  (`hashWorkflow`), the target version, the emitted path and the screen id. Done:
  the same workflow emits identical bytes and the same manifest twice.

## 3. The seam

- [x] 3.1 Keep the target neutral: it imports no source framework, no source
  adapter and no renderer. Done: the target imports only `node:*` and
  `@memolabs-apps/workflow`, and the import-boundary tests pass.

## 4. Validation

- [x] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`; verify all exit 0. Done: build 36/36, test
  64/64, lint clean, format:check clean.
- [x] 4.2 Run `corepack pnpm exec openspec validate vue-native-target-emission
  --strict`; verify it exits 0. Done: the change validates strictly.
