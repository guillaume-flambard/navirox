## 1. Widen the transform

- [x] 1.1 Change the copy transform to apply to a unit the plan classified `shared`
      or `portable`, and rename it to `copy-movable-unit` with the export
      `copyMovableUnit`, updating the package entry point. Verify with
      `pnpm --filter @memolabs-apps/migrate build` and
      `pnpm --filter @memolabs-apps/migrate typecheck`.
- [x] 1.2 Prove both classes copy byte identical and nothing else does. Verify with
      a test in `packages/migrate/src/engine.test.ts` over a `shared` logic unit, a
      `portable` state module and a `native-replacement` view.

## 2. Read the imports a moved unit leaves behind

- [x] 2.1 Add a neutral import reading helper: the specifiers a file names, the
      resolution of a relative specifier against the files a read can see, and the
      package name of a bare specifier. Verify with `packages/migrate/src/imports.test.ts`.
- [x] 2.2 Add the unresolved list to the run report and fill it from the moved
      units: a relative import that does not resolve to a file this run moved, and a
      non relative import whose package the project does not declare. Verify with a
      test that reports the first and the second and stays silent for a moved
      sibling and a declared dependency.
- [x] 2.3 Print the list in the human report. Verify with a test over the rendered
      output of a report that has an unresolved import.

## 3. Prove it end to end

- [x] 3.1 Extend the CLI migration test with a state module that imports an alias
      the project does not declare, and assert the run writes the file and names the
      unresolved import. Verify with `pnpm --filter @memolabs-apps/cli test`.
- [x] 3.2 Run the command against the pilot:
      `node packages/cli/dist/bin.js migrate -C pilots/vue-web --out <temp>` in dry
      run, and record the result in `docs/evidence/migration-portable-units.md`.
      Verify that the report moves the state module and names the two imports it did
      not carry.

## 4. Verify

- [x] 4.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 4.2 Run `openspec validate migration-portable-units --strict`.
- [x] 4.3 Confirm the acceptance app and the runtime packages are untouched, and
      that no file outside the output directory is written.
