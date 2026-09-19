## 1. Narrow the patterns

- [x] 1.1 In `packages/source/src/capabilities.ts`, change the two directed
      `url-navigation` patterns and their fallback so the first requires the
      `window` global and the fallback names `window.location` rather than the
      bare name. Verify by reading the three lines and confirming that the
      fallback still exists last in the list for that capability.
- [x] 1.2 Extend the docstring above `CAPABILITY_PATTERNS` to say why a pattern
      whose platform spelling is a property of a global must require that
      global, with the `location` case as the example. Verify by reading the
      comment and confirming it names the failure rather than restating the code.

## 2. Pin the behaviour in the shared test

- [x] 2.1 In `packages/source/src/capabilities.test.ts`, add a test that a local
      variable named `location` reports nothing, and one that `window.location`
      still reports `url-navigation`. Verify with
      `corepack pnpm --filter @memolabs-apps/source test`.

- [x] 2.2 Add a test that a bare `window.location` with no property to read the
      usage from reports `unknown`, so the fallback's purpose is asserted rather
      than assumed. Verify with the same command.

## 3. Record what was wrong

- [x] 3.1 Add a closing note to `docs/evidence/qwik-reading.md`,
      `docs/evidence/lit-reading.md` and `docs/evidence/vanilla-reading.md`
      where each says the trap is unfixed, naming this change as the fix. Verify
      by grepping the three files for the word trap and reading the note.

- [x] 3.2 Add a line to `docs/evidence/` for this change itself, stating what
      was measured, what the pattern was, what it is now, and that the fixtures
      were deliberately left alone. Verify by reading the file.

## 4. Verify and close

- [x] 4.1 Run the full root gate: `corepack pnpm build`, `typecheck`, `test`,
      `lint`, `format:check`, `deps:check`, all six green, and record the
      counters.

- [x] 4.2 Run the acceptance journey on both platforms, 4/4 each, with Metro
      killed first. This is a non-regression check: no file the canary reads has
      changed.

- [x] 4.3 `openspec validate capability-name-precision --strict`, then check
      every box in this file, then `openspec archive capability-name-precision
      -y`, and confirm the canonical spec count and the archive count.

- [x] 4.4 Commit locally only. No push.
