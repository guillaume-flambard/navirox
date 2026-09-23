## 1. Add the package

- [x] 1.1 Create `packages/target-angular` with its `package.json`, `tsconfig.json`
  and root-`tsconfig.json` reference. Verify `corepack pnpm build` builds it.

## 2. Compile

- [x] 2.1 Implement `compileAngularTarget` with the element map and the
  translation table (`*ngIf`, `*ngFor`, `(click)`, `[prop]`, `[(ngModel)]`).
  Verify a compiler test asserts each translation and the emitted native source.
- [x] 2.2 Refuse an unsupported construct with a finding and no source. Verify
  tests for `*ngSwitch`, a custom element and text outside a text primitive.
- [x] 2.3 Emit the deterministic provenance manifest. Verify a test asserts the
  manifest names the input, the output path and the compiler version, and that
  two runs agree.

## 3. Validate the build

- [x] 3.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
- [x] 3.2 Run `corepack pnpm exec openspec validate angular-target-conversion
  --strict`. Verify it exits 0.
