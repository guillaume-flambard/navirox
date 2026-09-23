## 1. Extend the accepted directives

- [x] 1.1 Accept `v-show`, `v-model` on a `text-input`, and the press events
  `@press-in`/`@press-out`/`@long-press` in the Vue target's property handling.
  Verify the compiler test asserts each is kept and produces no finding.

## 2. Prove refusal is unchanged

- [x] 2.1 Assert `v-model` outside a `text-input` and an unimplemented directive
  are still refused with an `unsupported-directive` finding and no source. Verify
  the tests.

## 3. Validate the build

- [x] 3.1 Run `corepack pnpm build`, `corepack pnpm test`,
  `corepack pnpm lint` and `corepack pnpm format:check`. Verify all exit 0.
- [x] 3.2 Run `corepack pnpm exec openspec validate vue-target-directive-breadth
  --strict`. Verify it exits 0.
