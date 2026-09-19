const tseslint = require('typescript-eslint');
const vue = require('eslint-plugin-vue');
const prettier = require('eslint-config-prettier/flat');
const tsParser = require('@typescript-eslint/parser');

// This app is a Vue app that renders through Navirox, not a React app: it imports `@memolabs-apps/*`,
// Vue and Pinia and nothing else. The React Native preset that used to back this file brought
// rules for React, React Native, React Hooks, Jest and Flow for code that does not exist here, and
// it pins its own `eslint` peer to `^8 || ^9` in every published version, so it cannot even load on
// the single eslint major this repository installs. `typescript-eslint` is the TypeScript half of
// the config instead, and it is already a root devDependency.
//
// Its recommended set has no `files` pattern covering `.vue` at all, so ESLint's flat-config
// default (only recognized JS-like extensions unless a config explicitly opts a file in) reports
// every `.vue` file "ignored because of a matching ignore pattern" until the Vue block below
// claims them.
module.exports = tseslint.config(
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  // `flat/recommended` ends with the strongly-recommended set, which is mostly whitespace rules
  // (indentation, one attribute per line, line breaks inside tags). Prettier already owns
  // formatting in this repository (`prettier --check .` is part of the gate), and the two
  // disagree, so ESLint would emit warnings that cannot be satisfied without breaking the
  // formatter's output. This entry disables exactly the rules that overlap, and nothing else.
  prettier,
  {
    // The Node tooling files here (`eslint.config.js`, `metro.config.js`, `babel.config.js`,
    // `detox.config.js`, `index.js`) are CommonJS: the package has no `"type": "module"`, so
    // `require` is how they are loaded, not a mistake. `typescript-eslint`'s recommended set
    // assumes ESM, and its `no-require-imports` rule has no notion of a legitimate CommonJS file.
    files: ['**/*.js'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    // `<script lang="ts">` needs a real TS parser inside the SFC, or every type annotation in the
    // block is a syntax error to vue-eslint-parser's own (JS-only) script sub-parser.
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tsParser },
    },
    rules: {
      // A plain (non-type-aware) ESLint rule cannot see ambient globals a `.d.ts` lib declares
      // (`performance`, RN's own globals, …) and false-flags every one of them. typescript-eslint's
      // recommended set turns `no-undef` off for the TypeScript files it matches for exactly that
      // reason, but that override is scoped to `.ts`/`.tsx` and does not reach `.vue`, so
      // `<script lang="ts">` needs the same decision spelled out here.
      'no-undef': 'off',
      // Our own primitives take RN's exact camelCase prop names (`testID`, `onPress`, …), never DOM
      // attributes — hyphenating them is not just unwanted, it silently produces a DIFFERENT wrong
      // prop when auto-fixed (`testID` -> `test-i-d`, not `test-id`, since the rule's fixer does not
      // know these are camelCase words rather than a single unhyphenated one).
      'vue/attribute-hyphenation': 'off',
      // The rule's "is this a component" check does not know our lowercase custom host tags
      // (`text`, `view`, …) are bare Fabric elements, not Vue components — so ANY `v-text`/`v-html`
      // on one of them false-positives, not just a single call site.
      'vue/no-v-text-v-html-on-component': 'off',
    },
  },
  {
    // Deliberately re-exports FROM `@vue/runtime-core` to declare the ambient `'vue'` module —
    // that IS the fix `vue/prefer-import-from-vue` would otherwise ask for, so the rule can never
    // be satisfied here without breaking the file's one job.
    files: ['vue-runtime-core.d.ts'],
    rules: { 'vue/prefer-import-from-vue': 'off' },
  },
);
