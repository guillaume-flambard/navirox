## 1. Select the target

- [x] 1.1 Refactor `packages/cli/src/convert.ts` so `runConversion` takes a
  `target` object (an id and a `compile` that returns findings, optional code and
  the serialized provenance manifest) instead of importing the Vue target. Verify
  the convert tests pass with a fake target.
- [x] 1.2 Add `targetFor(adapterId)` to `packages/cli/src/cli.ts` (Angular ->
  `@memolabs-apps/target-angular`, otherwise `@memolabs-apps/target-vue`) and add
  `@memolabs-apps/target-angular` to the CLI dependencies and tsconfig references.
  Verify `corepack pnpm build` resolves both targets.

## 2. Read an Angular template

- [x] 2.1 Read an Angular screen's template from its component: the inline
  `template:` string or the `templateUrl` file. Verify a test for each.
- [x] 2.2 Refuse a screen whose template cannot be read with a finding and write
  nothing for it. Verify a test.

## 3. Validate the build

- [x] 3.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
- [x] 3.2 Run `corepack pnpm exec openspec validate convert-target-selection
  --strict`. Verify it exits 0.
