## 1. Add the planner package

- [x] 1.1 Create `packages/planner` as `@memolabs-apps/planner`, depending only on
      `@memolabs-apps/graph`, following the package conventions and referencing the graph
      package in its tsconfig. Verify with `pnpm --filter @memolabs-apps/planner build`.
- [x] 1.2 Implement the decision model: the closed classification set, the
      confidence set, reasons, evidence and blockers, with the type requiring a
      reason and evidence. Verify with `pnpm --filter @memolabs-apps/planner typecheck`.
- [x] 1.3 Implement the rule engine: rules as data, the declared precedence
      layers, deterministic ordering, and the fallback that produces `unknown`
      rather than nothing. Verify with unit tests covering override precedence,
      layer precedence and a node no rule covers.
- [x] 1.4 Implement the generic rules: shared logic, the adaptable capabilities,
      the native replacements, and the manual cases where the reading could not
      establish a purpose. Verify each rule with a graph fixture built in the
      test, so no framework is needed to test a rule.
- [x] 1.5 Implement the plan: the summary counting every class, the decision
      list, and the separate unknown list, deterministic across two runs. Verify
      with the summary assertions and a two-run identity check.

## 2. Make it visible

- [x] 2.1 Add the `plan` command to `packages/cli/src/args.ts`: the command union,
      the flags it refuses, and the help text. Verify with the argument tests.
- [x] 2.2 Wire it in `packages/cli/src/cli.ts` using the inspection pipeline the
      `inspect` command already has, with a human renderer and a JSON form. Verify
      with a test that injects a registry so the test does not depend on a
      framework being installed.
- [x] 2.3 Report a plan for a real graph: run `navirox plan -C examples/vue-basic`
      and record the output under `docs/evidence/`.

## 3. Position

- [x] 3.1 Add the package to the root `tsconfig.json` references and to
      `pnpm-lock.yaml`. Verify with a root `pnpm build`.
- [x] 3.2 Update `README.md`: the package table gains the planner, and the roadmap
      section names what now exists between inspection and migration.

## 4. Verify

- [x] 4.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 4.2 Confirm the framework boundary check reports no violation with the
      planner present, and that the planner's own test suite proves the rules
      without importing a framework.
- [x] 4.3 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 4.4 Run `openspec validate migration-classification-planner --strict` and
      confirm the change is complete.
