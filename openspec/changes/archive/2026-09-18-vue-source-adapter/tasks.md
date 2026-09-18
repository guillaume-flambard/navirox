## 1. Extend the inspection payload

- [x] 1.1 Add the discovered collections to `SourceInspection` in
      `packages/source/src/types.ts`: units, capabilities, dependencies, routes,
      each a semantic type with a source location and no framework concept.
      Keep `descriptor` and `findings`. Verify with
      `pnpm --filter @navirox/source typecheck`.
- [x] 1.2 Keep the boundary check green and the existing 24 tests passing, and
      add a test that an inspection with empty collections is valid. Verify with
      `pnpm --filter @navirox/source test`.

## 2. Add the Vue adapter

- [x] 2.1 Create `packages/source-vue` as `@navirox/source-vue`, depending on
      `@navirox/graph`, `@navirox/source` and `@vue/compiler-sfc`, following the
      package conventions and referencing its two workspace dependencies in its
      `tsconfig.json`. Verify with `pnpm --filter @navirox/source-vue build`.
- [x] 2.2 Implement detection: read the manifest, match a Vue dependency, return
      one candidate with evidence naming the manifest file and the dependency
      field, and return no candidate without throwing when there is no manifest.
      Verify with unit tests over a fixture project and an empty directory.
- [x] 2.3 Implement component discovery: walk the project, skip dependency and
      build directories, parse each single file component with the Vue compiler
      and report it as a unit with a source location and adapter owned metadata.
      Verify with a fixture project containing several components, and assert
      every component appears exactly once.
- [x] 2.4 Implement store module discovery: report a module declaring a store as
      a state module with evidence, and never report a module that only imports
      the state library. Verify with two fixture modules, one of each kind.
- [x] 2.5 Implement browser capability detection over the declared pattern set,
      with `file:line` evidence and the declared usage kinds, unknown when the
      direction cannot be determined. Verify with a fixture that writes to local
      storage, reads geolocation, and calls one capability whose direction is
      undetermined.
- [x] 2.6 Implement dependency reporting from the manifest with declared version
      ranges and no classification, plus the tested version range check that
      reports a finding outside the range. Verify with a fixture manifest inside
      the range and one outside it.
- [x] 2.7 Implement `buildGraph`: map the inspection to an App Graph fragment
      with deterministic identifiers, capability edges, and a finding for routes
      that were not extracted. Verify that two inspections of the same fixture
      produce identical fragments and that every identifier starts with the
      adapter id.
- [x] 2.8 Add a negative fixture: a component the parser rejects, a project with
      a views directory and no router, and an unmodelled construct. Verify that
      inspection completes, reports each as a finding, produces no route node,
      and still reports the healthy components.

## 3. Implement the neutral inspection pipeline

- [x] 3.1 Give `@navirox/inspect` its dependencies on `@navirox/graph` and
      `@navirox/source` and define the versioned report type: schema version,
      source descriptor, summary counts and the assembled graph. Verify with
      `pnpm --filter @navirox/inspect typecheck`.
- [x] 3.2 Implement the project file loader: a root directory, an ignore list
      covering dependency and build output, and deterministic file ordering and
      text reading. It lives in `@navirox/source` as `createProjectFiles`, next
      to the ignore list, because the adapter fixtures need the same walk and two
      walks would be two answers to what a project is. Verify with tests over a
      temporary project (the CLI tests in `packages/cli/src/inspect.test.ts`).
- [x] 3.3 Implement the pipeline: select through the registry or by explicit
      identifier, run detection, inspection and graph construction, assemble the
      graph with its schema version, and return the report as data with typed
      outcomes for no adapter and unknown adapter. Verify with a fake adapter in
      the test, so the package never imports a framework.
- [x] 3.4 Implement the two renderers: a single JSON document, and a human report
      that names the project, the adapter, what was found, what was not
      determined, and the next step. Verify with assertions on both forms.

## 4. Add the command

- [x] 4.1 Extend `packages/cli/src/args.ts`: add `inspect` to the command union,
      accept `--framework` for it, refuse it elsewhere, refuse `--port` and
      `--skip-preflight` for it, and update the help text. Verify with the
      argument tests, including the refusal cases.
- [x] 4.2 Wire the command in `packages/cli/src/cli.ts`: lazily import the
      adapter package at the composition root, build the registry, run the
      pipeline and print through the existing writer, returning the exit code
      rather than calling the process. Verify with a test that injects a
      context, so the test does not depend on the real adapter being built.
- [x] 4.3 Add the CLI dependencies on `@navirox/inspect` and
      `@navirox/source-vue`. Verify with `pnpm install --lockfile-only` or
      `pnpm install` and a clean `pnpm --filter @navirox/cli test`.

## 5. Position the new support

- [x] 5.1 Add the new package to the `references` list in the root
      `tsconfig.json` and to `pnpm-lock.yaml`. Verify with `pnpm build` at the
      root.
- [x] 5.2 Update `README.md`: the package table gains the adapter, the
      inspection package and the command, and the support matrix moves Vue from
      `planned` to a named level while every other framework stays unclaimed.
      Verify by reading the file and confirming no framework without an adapter
      claims a level.
- [x] 5.3 Confirm lint, format and the dependency check pass, and that the
      vendored documents under `docs/repositioning/` are still byte identical to
      the pack.

## 6. Verify

- [x] 6.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 6.2 Inspect the acceptance app for real:
      `navirox inspect -C examples/vue-basic` in human and machine form, and
      record the output under `docs/evidence/source-seam-vue-inspection.md`. The
      directory goes through `-C`, like every other command; the tool takes no
      positional argument. Confirm no file under `examples/` was modified.
- [x] 6.3 Confirm the acceptance app still runs: the Detox journey passes
      locally on both platforms.
- [x] 6.4 Run `openspec validate vue-source-adapter --strict` and confirm the
      change is complete.
