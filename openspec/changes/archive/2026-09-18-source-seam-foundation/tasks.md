## 1. Reposition the documents

- [x] 1.1 Vendor the eight canonical repositioning documents into
      `docs/repositioning/` unchanged. Verify with `diff -r` against the pack
      source: the two trees must be identical.
- [x] 1.2 Add `navirox-repositioning-pack/` to `.gitignore` and remove the
      working tree copy of the pack. Verify with
      `git check-ignore -v navirox-repositioning-pack/probe.md` (it must report
      the ignore rule) and `git status --short` (the pack must not appear).
- [x] 1.3 Rewrite the README positioning: the one line definition, the status
      block, `Why`, the architecture section showing both seams, the corrected
      package table, a support status matrix using the four declared levels with
      no green claim for an unimplemented adapter, and a documentation table that
      references `docs/repositioning/`. Verify by reading the rendered file and
      checking that no line still defines the product as a Vue stack, and that
      no adapter is listed as supported without an implementation behind it.
- [x] 1.4 Update `AGENTS.md`: replace the product definition in "What this
      project is" with the repositioned one, and add the source framework
      isolation rule as a new hard rule while keeping the five existing rules
      intact. Verify by reading the file and confirming all six rules are
      present and the removed wording appears nowhere.
- [x] 1.5 Prepend a notice to `PLAN.md` stating that
      `docs/repositioning/` defines product direction while this file remains
      the implementation evidence for the Vue and runtime path, and record the
      two deferred items (Fast Refresh, release process). Verify that the file
      still contains every original section and that the notice is the first
      content.

## 2. Add the graph package

- [x] 2.1 Create `packages/graph` as `@memolabs-apps/graph` with no dependency, using
      the package conventions of the repository (`version 0.0.0`, `type:
  module`, `main` and `types` on `dist`, scripts `build`, `typecheck`,
      `test`, `clean`, and a `tsconfig.json` extending the base config). Verify
      with `pnpm --filter @memolabs-apps/graph build`.
- [x] 2.2 Implement the App Graph v1 types: the graph itself with its schema
      version, route, screen, unit, action, data, capability, dependency and
      edge nodes, findings, evidence and source locations, plus the fragment an
      adapter returns. Verify with `pnpm --filter @memolabs-apps/graph typecheck`.
- [x] 2.3 Implement the deterministic node id helper and unit test it: the same
      inputs produce the same id, an id names the adapter, and a normalized path
      spelling change does not change the id. Verify with
      `pnpm --filter @memolabs-apps/graph test`.

## 3. Add the source package

- [x] 3.1 Create `packages/source` as `@memolabs-apps/source`, depending only on
      `@memolabs-apps/graph`, following the same package conventions. Verify with
      `pnpm --filter @memolabs-apps/source build`.
- [x] 3.2 Implement the adapter contract and its supporting types: support
      level, detection context, result and evidence, inspect context and
      inspection result, graph context, the version declaration, and the
      migration provider placeholder. Verify with
      `pnpm --filter @memolabs-apps/source typecheck`.
- [x] 3.3 Implement the adapter registry: registration, deterministic listing,
      lookup by id, multi candidate detection, and most specific selection.
      Verify with unit tests covering ordering independence, the meta-framework
      preference, the empty candidate outcome, and an unknown id lookup that
      fails in a typed way (`pnpm --filter @memolabs-apps/source test`).
- [x] 3.4 Add contract tests that any adapter can be run against: identity,
      declared support level from the closed set, detection evidence, and
      unsupported input producing findings instead of a crash. Verify with
      `pnpm --filter @memolabs-apps/source test`.

## 4. Add the framework import boundary

- [x] 4.1 Add the boundary check to `packages/source/src` as a static scan in
      the style of the renderer check: strip comments, ignore `node_modules`
      and build output, and assert an empty violation list. Verify that the
      check fails when a neutral package is made to import a framework package,
      by adding the import temporarily and observing the failure.
- [x] 4.2 Declare the forbidden framework package list in one place, assert it
      is not empty, and cover the two directions: a neutral package must not
      import a framework, and a source adapter must not import a target
      provider. Verify with `pnpm --filter @memolabs-apps/source test`, including a
      case that proves an adapter package is allowed to import its own
      framework.
- [x] 4.3 Confirm the renderer boundary check still runs and still passes.
      Verify with `pnpm --filter @memolabs-apps/runtime-symbiote test`.

## 5. Wire the workspace

- [x] 5.1 Add both new packages to the `references` list in the root
      `tsconfig.json`. Verify that `pnpm build` compiles them as part of the
      workspace rather than only when targeted directly.
- [x] 5.2 Declare the scanned sources as `inputs` on the `test` task in
      `turbo.json`, so the boundary check cannot be served a stale cached
      success after a file it reads has changed. Verify by changing a scanned
      source file with the boundary check passing, then re-running the suite and
      confirming the check actually ran.
- [x] 5.3 Confirm the root lint, format and dependency checks still pass with
      the two new packages present.

## 6. Verify the foundation

- [x] 6.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`. All must pass.
- [x] 6.2 Confirm nothing observable changed: `examples/vue-basic` still builds
      and its Detox journey still passes locally on both platforms, with no
      edit to any file under `examples/`.
- [x] 6.3 Confirm no generic package imports a framework and no existing
      package's public surface was modified, by reviewing the diff of
      `packages/` excluding the two new directories.
- [x] 6.4 Run `openspec validate source-seam-foundation --strict` and confirm
      the change is complete.
