## Context

The example and the scaffolder template share one ESLint config, copied verbatim into both places. It was written against `@react-native/eslint-config`'s flat config, which is the preset React Native ships, and it composes that preset with `eslint-plugin-vue`'s flat recommended set, adding a `.vue` block that hands `<script lang="ts">` to a real TypeScript parser.

The config was written when the root was on an eslint 9 line. It is now on `eslint 10.10.0`, and the React Native preset has not moved with it: `@react-native/eslint-config` declares `eslint: '^8.0.0 || ^9.0.0'` in every version published up to `0.88.0-rc.1`. The incompatibility is not only a peer range. `eslint-plugin-eslint-comments@3.2.0`, which the preset pulls in, calls `context.getSourceCode()`, an API eslint 10 removed, so the run dies inside a rule even when the module resolves. No eslint 10 release of that plugin exists.

The pressure toward abandoning the preset is that the app it lints is not a React app. `examples/vue-basic` imports only `@navirox/*` plus Vue and Pinia; the config already disables `react-hooks/rules-of-hooks` because it fires on Vue composables, and `no-undef` because a non-type-aware linter cannot see ambient globals. What remains of the React Native preset's value here is thin. Meanwhile `typescript-eslint@8.70.0` is already a root devDependency and declares support for eslint 10, and `eslint-plugin-vue@10.11.0`, already used by both packages, declares the same range.

## Goals / Non-Goals

**Goals:**

- Both ESLint configs load and run to completion against the example and against a freshly scaffolded app, on the single eslint major the repo already installs.
- Each `package.json` declares exactly the packages its config requires, so the failure mode of the last months (a config requiring a package nobody declared) cannot recur silently.
- The two configs stay identical, so a scaffolded app is linted by the same configuration the acceptance app is.
- A check that CI can reach actually runs one of those lint scripts, so the repair is not invisible the way the defect was.

**Non-Goals:**

- Keeping the React Native preset at the cost of pinning the example and the template to an older eslint major. That was the alternative, and it buys React Native's lint rules for a package that contains almost no React.
- Removing lint from the example or the template. A config that is never run is the defect being repaired, not the remedy.
- Linting `packages/*` with anything other than the root config, or changing the root `lint` script.
- Type-aware linting. `typescript-eslint`'s recommended set without type information is what the root config already uses, and matching it keeps one behavior to reason about.

## Decisions

**Build the flat config on `typescript-eslint` rather than on the React Native preset.** Both configs become `tseslint.config(...)` with the recommended set, then `eslint-plugin-vue`'s flat recommended set, then the `.vue` block carrying the TypeScript parser, then the `vue-runtime-core.d.ts` block. Rationale: eslint 10 is already the repo's major and `typescript-eslint` supports it; the preset does not and cannot without a downgrade. Rejected: pinning the example and the template to `eslint ^9.39.5` (two eslint majors in one repo, and the config keeps depending on a preset that is not being tracked); dropping lint from the two packages (the defect is an unrun config, and deleting it hides the problem rather than fixing it).

**`vue-eslint-parser` is declared in both packages.** `eslint-plugin-vue` lists it as a peer (`^10.3.0`), not as a dependency, and the registry resolves our pnpm store in strict peer mode. Declaring it is what makes the plugin's own parser resolvable. Rejected: relying on hoisting from an unrelated package, which is what produced the missing-module failure in the first place.

**`@typescript-eslint/parser` is declared even though `typescript-eslint` bundles it.** The `.vue` block needs the parser as a value passed to `parserOptions.parser`, and the package that reads that option is the config file, not the meta package. A direct require of a package that is only present transitively is the exact defect being repaired. Rejected: importing the parser off `tseslint.parser`, which works today but couples the config to the meta package's internal layout.

**The four disabled rules stay disabled, with their reasons rewritten.** `react-hooks/rules-of-hooks` disappears with the preset it came from, so the entry goes rather than lingering as a rule nobody defines. `no-undef`, `vue/attribute-hyphenation` and `vue/no-v-text-v-html-on-component` stay, because their reasons are about this codebase and not about the preset: a non-type-aware linter cannot see ambient globals, Navirox's primitives take React Native's camelCase props and the Vue fixer would rewrite `testID` to `test-i-d`, and the lowercase host tags are not Vue components. Rejected: keeping the rules without comments, which would leave three unexplained switches for the next reader.

**A scaffolded app is linted as part of the existing end-to-end check.** `scripts/e2e-scaffold.mjs` already scaffolds an app outside the workspace, installs it and builds it. Adding its lint script there means the config in the template is proven by running it against a real generated app, which is the only place the template's copy is ever exercised. Rejected: adding a lint step to the example's CI job only, which would leave the template's copy untested; and adding a new CI job, which the existing scaffold job already covers.

**The example's lint becomes a step of the existing `verify` job.** The root `lint` script is a single `eslint "packages/*/src/**/*.ts"` call, so it never reads the example's config; the config was broken for months precisely because nothing executed it. The first plan was to widen the root script, which would have meant either running pnpm inside a pnpm script or moving the root script to turbo; a step in a job CI already runs proves the same thing with no restructuring. Rejected: widening the root script (fragile, and it changes what `pnpm lint` means for every contributor) and a new dedicated job (the `verify` job already has the checkout, the install and the toolchain).

**`eslint-config-prettier` is added, which the plan did not foresee.** `eslint-plugin-vue`'s flat recommended set ends with its strongly-recommended set, which is mostly formatting: `vue/max-attributes-per-line`, `vue/html-indent`, `vue/html-closing-bracket-newline` and friends. Prettier is already the formatter of this repository (`prettier --check .` is part of the gate), and the first successful run produced 65 warnings from rules the two formatters disagree on. `eslint-config-prettier@10.1.8` disables exactly the overlapping rules and nothing else, so the config reports what Prettier cannot fix instead of a formatting argument between two tools. Rejected: hand-listing the conflicting Vue rules, which drifts the moment either tool adds one.

**`typescript-eslint` is declared in both packages, and the scaffold proof is what found it.** The first version of the configs required `typescript-eslint` as a value while only `@typescript-eslint/parser`, `vue-eslint-parser` and `eslint-config-prettier` were declared. In the workspace that require resolved from the root devDependency; in a scaffolded app there is no root, so the run failed with `Cannot find module 'typescript-eslint'`. Declaring it is the same rule as the parser entry: a config requires what it reads. This is the defect the end-to-end lint step exists to catch, caught by the step on its first run.

**`@typescript-eslint/no-require-imports` is turned off for `**/*.js`.** `typescript-eslint`'s recommended set assumes ESM and flags every `require` in the example's Node tooling files (`eslint.config.js`, `metro.config.js`, `babel.config.js`, `detox.config.js`, `index.js`) as an error with the repo at six errors. Those packages have no `"type": "module"`, so CommonJS is how they load, not a mistake, and the rule offers no `sourceType`-aware exemption. Scoped to `**/*.js`, the rule keeps working on the `.ts` sources where it means something.

## Risks / Trade-offs

- **The React Native lint rules are gone.** `react-hooks`, `react-native`, `jest`, `ft-flow` and `eslint-comments` no longer run on the example. The example contains no React components of its own and already disabled the two rules of that set that fired; the risk is accepted, and it is the cost Guillaume chose.
- **The example and the template now lint differently from an app generated by bare React Native.** A developer who adds a React Native community template's config on top will get two configs disagreeing. Mitigated by the config being short and by the reasons being written down in it.
- **A lint error in a scaffolded app now fails the scaffold job.** That is the point, but it makes the job a little more brittle: a new rule in `typescript-eslint`'s recommended set can turn the job red without anyone changing the template. Accepted, because a lint failure in a generated app is a real defect in the generated app.
- **`pnpm-lock.yaml` changes twice over**: the two experimental packages leave, two real ones arrive. The lockfile churn is expected and the resolution is the proof the peers are satisfiable.

## Open Questions

- Whether the root `lint` script should become a turbo task, so every package's own lint script runs in CI rather than only `packages/*/src/**/*.ts`. That would have caught this defect years earlier, and it is a larger change than this one; recorded here for whoever picks it up.
- Whether the root `package.json` description should be updated to the repositioned wording. It is unrelated to the lint configuration and is left alone deliberately.
