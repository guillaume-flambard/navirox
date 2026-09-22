# Tasks

## 1. Diagnose the red run

- [x] 1.1 Read the failed log of CI run `35765671500` on commit `41a7b56` and
  link every failing job to its cause. Verify the diagnosis names the run, the
  commit, `capture the records fixture on a simulator` and `... on an emulator`
  as `Unknown argument --workspace.`, and `run vue-pilot journey on a simulator`
  as `TOEXIST WITH MATCHER(id == "product-detail")` at `e2e/journey.test.ts:118`.
- [x] 1.2 Confirm the non-fatal React Native DevTools message did not fail a job.
  Verify the emulator capture job's conclusion is `success` in the same run in
  which it printed the message.

## 2. Repair the capture script

- [x] 2.1 Accept `--workspace <path>` in `scripts/capture-angular-companion.mjs`,
  create the named workspace and skip the temporary cleanup when it is supplied.
  Verify a run with `--workspace` no longer reports `Unknown argument
  --workspace.` and an unknown flag still reports `Unknown argument <flag>.`.
- [x] 2.2 Confirm `pnpm format:check` stays clean for the script.

## 3. Repair the pilot journey spec

- [x] 3.1 Open the product through the `product-open-1` pressable and wait on
  `product-detail` with the `exists` helper and `SETTLE_TIMEOUT`. Verify the file
  no longer contains a single-shot `expect(element(by.id('product-detail')))`.
- [x] 3.2 Typecheck the spec. Verify `tsc --noEmit -p e2e/tsconfig.json` exits 0
  and `pnpm format:check` stays clean for the edited file.

## 4. Validate

- [ ] 4.1 Confirm a CI run in which both previously failing job families succeed.
  Verify the Angular companion captures and the pilot journey jobs conclude
  `success` on the repair commit.
