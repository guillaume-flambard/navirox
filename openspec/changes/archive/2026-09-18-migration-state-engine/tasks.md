## 1. The state file

- [x] 1.1 Implement the state model: schema version, adapter, target, per unit
      status and source fingerprint, and the version check that refuses a state it
      does not know. Verify with `pnpm --filter @memolabs-apps/migrate build`.
- [x] 1.2 Implement reading and writing, including the refuse-to-guess path for an
      unknown version. Verify with a test over a state file written by an older
      schema version.
- [x] 1.3 Implement the fingerprint and prove it decides owed work: same content
      skipped, changed content owed. Verify with tests over two contents.

## 2. The engine

- [x] 2.1 Implement the transform contract: identifier, family, condition, and the
      outputs it declares. Verify with `pnpm --filter @memolabs-apps/migrate typecheck`.
- [x] 2.2 Implement the run: select units from the plan, apply the transforms that
      apply, collect the writes, and produce a report as data. Verify with a test
      over a small plan built by hand.
- [x] 2.3 Implement the dry run as the default and the explicit write, and prove
      the dry run touches nothing. Verify with a test that asserts the output
      directory is untouched after a dry run.
- [x] 2.4 Implement the output boundary: resolve every path, refuse anything
      outside the output directory, and refuse to migrate in place. Verify both
      refusals with tests.
- [x] 2.5 Implement the rollback: hold previous content for the run, restore on
      failure, remove what did not exist before, and report what was restored.
      Verify with a transform that fails after writing.
- [x] 2.6 Implement the first transform: copy the units the plan classified as
      shared, byte identical, and report the units it did not move and why. Verify
      with a fixture project and a hand built plan.

## 3. Wire it

- [x] 3.1 Add the `migrate` command to the arguments: the command union, `--out`,
      `--write`, `--framework`, and the flags it refuses. Verify with the argument
      tests.
- [x] 3.2 Wire it in the composition root: inspect, plan, then migrate, printing a
      report and returning an exit code. Verify with the CLI tests.
- [x] 3.3 Run it for real: `navirox migrate -C examples/vue-basic --out <temp>` and
      the same against the Vue adapter's fixture, both in dry run, recorded in
      `docs/evidence/migration-engine-reading.md`. The runs exposed a gap that is
      recorded there rather than worked around: no adapter reports a plain module
      as a unit, so `shared` has no producer on a real project and the first
      transform copies nothing. The engine is proven by its own suite and by the
      command suite over an adapter that does report such a unit; teaching the
      adapters to report application modules is a separate change.

## 4. Verify

- [x] 4.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 4.2 Confirm the idempotence claim on files: a second write run reports no
      work owed and changes nothing. Proven in `packages/cli/src/migrate.test.ts`
      over a real temporary directory, which is where a unit the engine moves
      exists today.
- [x] 4.3 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 4.4 Run `openspec validate migration-state-engine --strict`.
