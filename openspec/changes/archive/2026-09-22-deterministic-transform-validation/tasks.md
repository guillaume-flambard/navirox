# Tasks

## 1. Add the transform

- [x] 1.1 Add one transform that performs a bounded, deterministic rewrite and
  records the input, the rule that fired and the output for every write. Verify
  the same input produces byte-identical output on two runs.
- [x] 1.2 Declare the transformation's rule set so each replacement names its
  rule. Verify every substitution the transform makes cites a rule identifier
  rather than an anonymous rewrite.

## 2. Prove the rollback

- [x] 2.1 Force the engine to fail after a write and assert the output directory
  is restored to its previous bytes. Verify the test exercises the real
  `restore(held)` path and not a hand-built substitute.

## 3. Validate behaviour

- [x] 3.1 Drive the new transform through the real planner and engine on a graph
  fragment and assert on the rewritten file. Verify the substitution happened and
  the surrounding code is unchanged.
- [x] 3.2 Assert the transform is selected only for the classification it is
  written for. Verify a unit classified otherwise is not rewritten by it.

## 4. Validate the build

- [x] 4.1 Run `pnpm build` and confirm the workspace is clean. Verify the build
  exits 0 after the increment.
- [x] 4.2 Run `pnpm format:check`, the migrate test suite and `openspec validate
  deterministic-transform-validation --strict`. Verify all exit 0.
