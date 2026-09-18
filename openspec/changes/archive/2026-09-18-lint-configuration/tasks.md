## 1. Rewrite the two ESLint configs

- [x] 1.1 Replace the React Native preset with `typescript-eslint` in `examples/vue-basic/eslint.config.js`: require `typescript-eslint`, spread `tseslint.configs.recommended` in place of `...reactNativeFlatConfig`, and keep `eslint-plugin-vue`'s flat recommended set and the two `files` blocks that follow it. Verified by reading the file back and by the lint run in 4.1, which must load the config without an unknown-rule error.
- [x] 1.2 Rewrite the `.vue` block's comment and its disabled rules: drop the `react-hooks/rules-of-hooks` entry (the rule lived in the preset that is gone), keep `no-undef`, `vue/attribute-hyphenation` and `vue/no-v-text-v-html-on-component`, and state each reason in terms of this codebase rather than of the preset. Verified by `grep -c 'react-native' examples/vue-basic/eslint.config.js`, which must return 0, and by the run in 4.1.
- [x] 1.3 Copy the rewritten file over `packages/create-navirox/template/eslint.config.js` so the two stay identical. Verified by `diff examples/vue-basic/eslint.config.js packages/create-navirox/template/eslint.config.js`, which must print nothing.

## 2. Declare what the configs require

- [x] 2.1 In `examples/vue-basic/package.json`, remove the two experimental devDependencies (`@react-native/eslint-config` and `@typescript-eslint/parser` as it stands now, both added during the investigation) and add `@typescript-eslint/parser` and `vue-eslint-parser` in alphabetical position. Verified by `node -e` printing the eslint-related devDependencies and by the install in 2.3.
- [x] 2.2 Apply the same change to `packages/create-navirox/template/package.json`, keeping its extra `@navirox/cli` entry and its missing e2e entries intact. Verified by `node -e` on that file and by the scaffolded lint run in 4.2.
- [x] 2.3 Run `corepack pnpm install` at the root. Verified by the command succeeding, and by `corepack pnpm peers check` reporting no unmet peer for `eslint-plugin-vue` or `typescript-eslint`.

## 3. Make the check reachable

- [x] 3.1 Run the example's own lint script in a check CI already executes. The example's lint is currently unreachable: the root `lint` script is `eslint "packages/*/src/**/*.ts"`, so no job ever evaluates `examples/vue-basic/eslint.config.js`. Add the example's lint to the root lint script, or to a job that runs it. Verified by running the root script and seeing the example's files listed, then by the CI run in 4.5.
- [x] 3.2 Run the scaffolded app's lint in `scripts/e2e-scaffold.mjs`, after the install step, so the template's config is exercised against a real generated app rather than only against the copy in `examples/`. Verified by running `node scripts/e2e-scaffold.mjs` and seeing the lint step complete without an ESLint module error.

## 4. Verify

- [x] 4.1 `corepack pnpm --filter vue-basic lint` exits 0 and reports no lint error in `examples/vue-basic`. Record the exact command output in the run report.
- [x] 4.2 A scaffolded app lints clean: scaffold once with `node scripts/e2e-scaffold.mjs --keep`, run its lint script, and confirm exit 0. This is the proof that the template's copy works, and it is the assertion `--keep` exists for.
- [x] 4.3 `corepack pnpm build`, `typecheck`, `test`, `lint`, `format:check` and `deps:check` all pass at the root. `deps:check` matters here because the two `package.json` files changed.
- [x] 4.4 The Detox journey still passes 4/4 on Android and 4/4 on iOS against the unchanged canary. The example's source was not touched, so this only has to still hold; kill any leftover Metro first.
- [x] 4.5 `openspec validate lint-configuration --strict`, then archive the change, commit, push `main`, and read the CI run on `main` confirming the five jobs are green. Do not call the CI green without having seen it.
