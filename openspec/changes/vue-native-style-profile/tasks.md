## 1. Source style facts

- [ ] 1.1 Add static style, class, token and scoped-selector fixtures; verify `corepack pnpm --filter @memolabs-apps/source-vue test` preserves source locations and provenance.
- [ ] 1.2 Add dynamic binding, unresolved selector, pseudo-state and media-feature refusal fixtures; verify no partial style facts are emitted.

## 2. Workflow and target profile

- [ ] 2.1 Add neutral style facts, selector rewrite records and style profile identifiers to the Workflow IR; verify `corepack pnpm --filter @memolabs-apps/workflow test`.
- [ ] 2.2 Define the named native style profile and its supported feature list; verify `corepack pnpm --filter @memolabs-apps/target-native test` emits the recorded profile.
- [ ] 2.3 Generate style output and manifest provenance from IR records without importing source SFC files; verify `corepack pnpm --filter @memolabs-apps/cli test`.

## 3. Atomic refusal behavior

- [ ] 3.1 Verify one unsupported style refuses the entire mixed run with `ok=false` and an intact output directory; verify the CLI atomicity test.
- [ ] 3.2 Verify repeated style lowering is deterministic and the recorded profile id is stable.

## 4. Baseline and evidence

- [ ] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm exec openspec validate vue-native-style-profile --strict` and `corepack pnpm exec openspec validate --all`.
- [ ] 4.2 Record the exact supported style profile, refusal classes and the absence of pixel-equivalence claims before opening T3 device proof.
