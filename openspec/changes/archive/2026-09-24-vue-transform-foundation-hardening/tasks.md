## 1. Binding contract

- [x] 1.1 Add the explicit literal/expression value kind to the Workflow IR serializer and parser; verify round-trip and unknown-version tests in `packages/workflow` and `corepack pnpm --filter @memolabs-apps/workflow test`.
- [x] 1.2 Update Vue lowering to preserve literal text with the literal kind and expressions with the expression kind; verify the positive and boundary fixtures with `corepack pnpm --filter @memolabs-apps/source-vue test`.
- [x] 1.3 Update target-native rendering to emit literal text literally and expressions through the target expression path; verify deterministic output and literal text with `corepack pnpm --filter @memolabs-apps/target-native test`.

## 2. Atomic refusal and seam metadata

- [x] 2.1 Make any non-generated screen a transform refusal and block the write loop; verify the mixed-refusal CLI test leaves the output directory unchanged with `corepack pnpm --filter @memolabs-apps/cli test -- transform-delivered.test.ts`.
- [x] 2.2 Move Vue-specific workspace construction behind a provider contract and make the neutral CLI composition provider-driven; verify the static CLI boundary test with `corepack pnpm --filter @memolabs-apps/source test`.
- [x] 2.3 Remove `@memolabs-apps/source` from `target-native` package metadata and TypeScript references; verify the static boundary test with `corepack pnpm --filter @memolabs-apps/source test`.
- [x] 2.4 Limit generated manifest commands to commands exposed by the generated package; verify the compiler-only workspace manifest with the delivered CLI test.

## 3. Evidence and baseline

- [x] 3.1 Correct the Vue T2 spec, evidence and backlog to describe all-or-nothing refusals and the compiler-only scope; verify the files agree with the test result and the stale backlog text is absent.
- [x] 3.2 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-transform-foundation-hardening --strict` and `corepack pnpm exec openspec validate --all`.
- [x] 3.3 Perform an independent read-only review of the boundary, IR migration, refusal transaction and evidence; verify no blocker remains before opening the next Vue profile change.
