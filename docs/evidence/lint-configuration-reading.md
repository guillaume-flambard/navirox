# The lint config nobody ran

This file records what the repair of the example's ESLint configuration measured, because the interesting part is not the rewrite but the chain of failures that made the rewrite necessary, and the fact that every one of them was invisible until something actually executed the file.

## The question, and the answer

The example and the scaffolder template shared one `eslint.config.js`, copied verbatim. It required three packages that neither `package.json` declared, and its first line required a preset that cannot load on eslint 10. The defect survived because nothing in the repository, locally or in CI, ever ran that config.

The answer to the question the change was written to settle is that declaring the missing packages is not a repair. `@react-native/eslint-config` pins its `eslint` peer to `^8.0.0 || ^9.0.0` in every published version checked, up to `0.88.0-rc.1`, and `eslint-plugin-eslint-comments@3.2.0`, which it pulls in, calls `context.getSourceCode()`, removed in eslint 10. With the packages declared, the missing-module error became a rule crash while linting `App.vue`:

```
TypeError: Error while loading rule 'eslint-comments/no-aggregating-enable':
context.getSourceCode is not a function
```

There is no eslint 10 release of that plugin. The preset has to go, not the dependencies.

## Why nothing noticed

The root `lint` script is a single direct call:

```
eslint "packages/*/src/**/*.ts"
```

It never loads `examples/vue-basic/eslint.config.js`, and it never loads the template's copy either. No CI job runs `pnpm --filter vue-basic lint`, and the scaffold job installed and built a generated app without linting it. A config that cannot load produces no signal when nothing loads it.

`corepack pnpm --filter vue-basic lint` reproduces the original defect on demand:

```
Oops! Something went wrong! :(
ESLint: 10.10.0
Error: Cannot find module '@react-native/eslint-config/flat'
    at .../examples/vue-basic/eslint.config.js:1:31
```

## What the replacement is

`typescript-eslint@8.70.0` was already a root devDependency and declares `eslint: ^8.57.0 || ^9.0.0 || ^10.0.0`; `eslint-plugin-vue@10.11.0` declares the same range. Both configs are now `tseslint.config(...)` with the recommended set, then the Vue flat recommended set, then `eslint-config-prettier`'s flat entry, then a `**/*.js` block, then the `.vue` block, then the `vue-runtime-core.d.ts` block. The two files remain identical (`diff` prints nothing).

## Three things the plan did not foresee, all found by running it

1. **`typescript-eslint` itself had to be declared.** The workspace resolved it from the root devDependency; a scaffolded app has no root and died on `Cannot find module 'typescript-eslint'`. The end-to-end lint step found this on its first run, which is the whole reason it exists.
2. **65 formatting warnings** came from `eslint-plugin-vue`'s strongly-recommended set (`vue/max-attributes-per-line`, `vue/html-indent`, `vue/html-closing-bracket-newline`, and two more) arguing with Prettier, which is already this repository's formatter. `eslint-config-prettier@10.1.8` disables exactly the overlapping rules and nothing else.
3. **Six `@typescript-eslint/no-require-imports` errors** on the example's Node tooling files. Those packages have no `"type": "module"`, so `require` is how they load. The rule has no `sourceType`-aware exemption, so it is turned off for `**/*.js` only, where it keeps working on the `.ts` sources.

## Proof

| Command | Result |
| --- | --- |
| `corepack pnpm --filter vue-basic lint` | `$ eslint .`, no output, exit 0 |
| `node scripts/e2e-scaffold.mjs --keep` | `== Linting the app` then `$ eslint .`, clean; the rest of the scaffold checks pass |
| `corepack pnpm build` / `typecheck` / `test` | 25/25, 46/46, 45/45 |
| `corepack pnpm lint` / `format:check` / `deps:check` | silent, `All matched files use Prettier code style!`, `No issues found` |
| Detox, unchanged canary | Android 4/4, iOS 4/4 |

The example's source was not touched, so the journey passing is a regression check rather than a new claim.

## What is now reachable that was not

- `examples/vue-basic/eslint.config.js` runs in the `verify` job, as a step after `pnpm lint`.
- The template's copy runs inside `scripts/e2e-scaffold.mjs`, against an app generated outside the workspace, in the same job set that already builds that app.

Both copies are therefore executed by CI, and a config that cannot load now fails a job rather than sitting unread.
