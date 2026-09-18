## Why

`examples/vue-basic/eslint.config.js` and `packages/create-navirox/template/eslint.config.js` are byte for byte the same file, and both require three packages that neither `package.json` declares: `@react-native/eslint-config/flat`, `eslint-plugin-vue` and `@typescript-eslint/parser`. Running the example's lint script fails before the first rule is evaluated:

```
Oops! Something went wrong! :(
Error: Cannot find module '@react-native/eslint-config/flat'
Require stack: .../examples/vue-basic/eslint.config.js
```

The first fix that comes to mind, declaring the missing packages, does not work. `@react-native/eslint-config` pins its `eslint` peer to `^8.0.0 || ^9.0.0` in every published version checked, up to `0.88.0-rc.1`, while this repo is on `eslint 10.10.0`. Declaring `0.86.0` and `@typescript-eslint/parser` turns the module error into a rule crash: `eslint-plugin-eslint-comments@3.2.0` calls `context.getSourceCode()`, which eslint 10 removed. That plugin has no eslint 10 release. So the React Native preset is not one dependency away from working; it is a major version away, and the choice is which side to move.

The debt is invisible today because nothing runs these configs. The root `lint` script is `eslint "packages/*/src/**/*.ts"`, invoked directly rather than through turbo, so no CI job executes the lint script of the example or of a scaffolded app. The correct state is a lint setup that runs, and a check that says so.

## What Changes

- **Both ESLint configs are rewritten on `typescript-eslint` instead of the React Native preset.** The repo keeps one `eslint` major (10). `typescript-eslint@8.70.0` already sits in the root devDependencies and declares `eslint: '^8.57.0 || ^9.0.0 || ^10.0.0'`, and `eslint-plugin-vue@10.11.0` declares the same range. The `.vue` block, its `vue-eslint-parser`, and the four deliberately disabled rules stay, with the comments rewritten to explain the reason rather than to cite a preset that is no longer there.
- **Both `package.json` files declare what their config requires and nothing more.** The example and the template drop the two experimental React Native lint packages and gain `@typescript-eslint/parser` and `vue-eslint-parser`. `eslint-plugin-vue` keeps its entry, now actually used.
- **The example and the template keep the same lint script**, and both run it in a check that CI can see. The two configs stay identical, so a scaffolded app inherits exactly the configuration the acceptance app is linted with.

## Impact

- `examples/vue-basic/eslint.config.js`, `packages/create-navirox/template/eslint.config.js`: rewritten, still identical to each other.
- `examples/vue-basic/package.json`, `packages/create-navirox/template/package.json`: the eslint-related devDependencies.
- `pnpm-lock.yaml`: resolution changes. The two experimental packages added during the investigation leave again.
- `scripts/e2e-scaffold.mjs` or the CI workflow: one of them has to run the lint of a scaffolded app, otherwise the check that this change repairs stays unreachable from CI.
- No runtime package, no source adapter, no App Graph schema, and no public API is touched. `typescript-eslint` and `eslint-plugin-vue` are development tools, so nothing Navirox ships changes.

Two items remain deferred and are not claimed here: Fast Refresh / HMR for SFCs and stores, and the release process that tags `0.1.0` through changesets. A third, noticed while measuring: the root `package.json` still carries its pre-repositioning description, `the native mobile stack for Vue teams`.
