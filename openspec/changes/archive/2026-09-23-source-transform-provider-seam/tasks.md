## 1. Define the lowering contract

- [x] 1.1 Declare `SourceTransformProvider.lower(selection, snapshot, profile)`
  and its coverage report beside the adapter contract in
  `@memolabs-apps/source`. Verify the type compiles and exports from the package.
  Done: `packages/source/src/transform-seam.ts` declares `SourceTransformProvider`
  with `LoweringSelection`/`LoweringSnapshot`/`LoweringProfile` and returns
  `LoweringResult` carrying `Workflow`, `LoweringCoverage` and
  `LoweringFinding[]`. `packages/source/src/index.ts` re-exports the type and
  `corepack pnpm build` reports 35/35.

## 2. Define the emission contract

- [x] 2.1 Declare `TargetProvider.emit(workflow, targetProfile)` so a target
  consumes the IR without naming a source framework. Verify the type compiles.
  Done: `TargetProvider.emit(workflow, targetProfile)` returns
  `EmissionResult` with `EmittedFile[]` and findings; the type is exported from
  `packages/source/src/index.ts` and builds with the package.

## 3. Enforce the seam

- [x] 3.1 Extend the static boundary check with both directions: an adapter never
  imports a target or the runtime, a target never imports a source framework.
  Verify `corepack pnpm --filter @memolabs-apps/source test` catches a deliberate
  violation and passes otherwise.
  Done: `TARGET_PROVIDER_PATTERNS` and `SOURCE_PROVIDER_PATTERNS` live in
  `packages/source/src/boundaries.ts`; `boundary.test.ts` scans every adapter and
  target package for real violations, and asserts that
  `forbiddenSpecifiers('adapter', ['@memolabs-apps/runtime'])` and
  `forbiddenSpecifiers('target', ['@memolabs-apps/source-vue'])` catch deliberate
  violations while `['vue']` on an adapter and `['@angular/compiler']` on a
  target pass. `corepack pnpm --filter @memolabs-apps/source test` exits 0 with
  58/58 tests.

## 4. Prove the interface

- [x] 4.1 Add a fake lowerer, a fake target and two contrasting test adapters.
  Verify a test drives both through the same interface and that neither adds a
  framework-specific field.
  Done: `packages/source/src/transform-seam.test.ts` drives `lowerer('lowerer:a')`
  and `lowerer('lowerer:b')` through the shared interface, asserts both expose
  exactly `['id', 'lower']`, runs the fake target from the IR alone, and checks a
  finding (not a throw) on an empty root.

## 5. Validate the build

- [x] 5.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
  Done: build 35/35, test 63/63, lint exit 0, format:check exit 0.
- [x] 5.2 Run `corepack pnpm exec openspec validate source-transform-provider-seam
  --strict`. Verify it exits 0.
  Done: `Change 'source-transform-provider-seam' is valid`, exit 0.
