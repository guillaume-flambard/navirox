## 1. Extend the mapping

- [x] 1.1 Add the presentational text and container elements to the Vue target's
  mapping table. Verify the compiler test asserts each new tag renders as its
  primitive.

## 2. Prove refusal is unchanged

- [x] 2.1 Assert an element outside the set is still refused with an
  `unsupported-element` finding and no source, and that text directly inside a
  non-text primitive is still refused. Verify the tests.

## 3. Validate the build

- [x] 3.1 Run `corepack pnpm build`, `corepack pnpm test`,
  `corepack pnpm lint` and `corepack pnpm format:check`. Verify all exit 0.
- [x] 3.2 Run `corepack pnpm exec openspec validate
  vue-target-presentational-breadth --strict`. Verify it exits 0.
