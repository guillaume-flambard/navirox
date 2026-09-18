## 1. Implement the registry

- [x] 1.1 Implement the record model: the subject shape, the closed status set, the
      closed evidence level set, evidence with a source, and notes. Verify with
      `pnpm --filter @navirox/compat build`.
- [x] 1.2 Author the seed as data, limited to facts the acceptance application
      demonstrates, each naming where the demonstration lives. The seed is written
      as typed data in the package and re-validated by the same loader as any
      external data, so a bad edit fails when something reads it rather than when
      someone trusts it. Verify that every entry cites something a reader can
      check (asserted in `packages/compat/src/registry.test.ts`).
- [x] 1.3 Implement loading with validation: a record without evidence fails the
      load and names the record. Verify with a test over malformed data.
- [x] 1.4 Implement the deterministic lookup and listing. Verify with tests for a
      known subject, an unknown subject, and two loads in different data orders
      producing the same listing.

## 2. Make the plan read it

- [x] 2.1 Add the compatibility rule at the compatibility layer, taking an optional
      registry input, with supported, supported-with-adapter, partial and blocked
      each producing a class and an evidence entry naming the registry and level.
      Verify with tests over hand built graphs.
- [x] 2.2 Prove the unknown block shrinks by exactly what is recorded: plan the
      acceptance app's dependencies with the seed and without it, and assert that
      only recorded packages changed class.
- [x] 2.3 Prove no registry still means the previous behaviour. Verify with the
      existing planner tests passing unchanged.

## 3. Wire and verify

- [x] 3.1 Load the seed at the composition root and pass it to the plan command.
      Verify with the CLI tests.
- [x] 3.2 Run `navirox plan -C examples/vue-basic` and record the new plan under
      `docs/evidence/`, with the before and after unknown counts.
- [x] 3.3 Add the package to the README table with what it now holds.
- [x] 3.4 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 3.5 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 3.6 Run `openspec validate compatibility-registry --strict`.
