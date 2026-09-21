## 1. Record the change

- [x] 1.1 Validate the proposal, design, capability deltas and task ordering.
      Verify with `openspec validate angular-suitecrm-readiness --strict`.
      `openspec validate angular-suitecrm-readiness --strict` printed "Change
      'angular-suitecrm-readiness' is valid" and exited 0.

## 2. Establish the Angular fixture and source reading

- [x] 2.1 Add a SuiteCRM-shaped fixture with extension routes, standalone
      components, services, a record detail, a record update form, an attachment
      path and a desktop configuration surface. Verify the fixture package tests
      load it without Angular runtime installation.
      `packages/source-angular/fixtures/suitecrm-app` holds 17 files: a routing
      module, a standalone record list, detail, update form, attachments and
      history component, a stateful record service, a desktop configuration
      component, and an extension with its own route file, component, service and
      computed route file. The test `loads the fixture without an Angular runtime`
      asserts the fixture carries no `node_modules` and is still read from source,
      so `pnpm --filter @memolabs-apps/source-angular test` passes with no Angular
      runtime installed.
- [x] 2.2 Compare the fixture reading to the current adapter. Add source-adapter
      support only for a concrete observed gap and add a fixture test for each
      supported construct. Verify `pnpm --filter @memolabs-apps/source-angular test`.
      The observed gap is the routing module file convention: the adapter read
      `*.routes.ts` only, while the pinned SuiteCRM revision keeps its route table
      in `core/app/shell/src/app/app-routing.module.ts`. `routes.ts` now exports
      `isRoutingModuleFile`, and `inspect.ts` reads such a file as a route table
      and still runs the module reading, so the module finding and its unit are
      kept rather than dropped. The test `reads a routing module as a route table
      without losing its module finding` asserts the seven fixture routes
      (`/`, `/admin/configuration`, `/portal/cases`, `/records/:id`,
      `/records/:id/attachments`, `/records/:id/edit`, `/records/:id/history`) and
      the two `angular-module` findings. `pnpm --filter @memolabs-apps/source-angular test`
      passes, 17 tests.
- [x] 2.3 Keep dynamic routes, NgModules, remote configuration and unread templates
      as findings. Verify a fixture containing each surface produces an explicit
      finding and no invented route or unit.
      The test `reports the surfaces it cannot read instead of guessing them`
      asserts the fixture produces `angular-remote-configuration` for the
      federated remote load, `angular-route-path-not-literal` for the computed
      path, `angular-external-template` for the unread template and no route whose
      path pattern contains an interpolation. The NgModule surface is asserted by
      2.2's `angular-module` findings. Every finding names its source file.

## 3. Add the SuiteCRM benchmark

- [x] 3.1 Add a public immutable SuiteCRM commit, frontend directory, expected
      adapter and measured baselines to `benchmarks/catalog.json`. Verify the
      benchmark protocol reads no moving branch and records the exact SHA.
      The profile pins `https://github.com/salesagility/SuiteCRM-Core.git` at
      commit `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` with `sourceDirectory`
      `.`, adapter `angular` and the measured baselines `minimumRoutes` 0,
      `minimumScreens` 0, `minimumUnits` 1588. The protocol fetches that exact
      commit (`git fetch --depth 1 origin <commit>`) and fails unless
      `git rev-parse HEAD` matches it, so no branch is ever read. Routes and
      screens are 0 because the pinned revision keeps an empty `Routes` array in
      `core/app/shell/src/app/app-routing.module.ts` and registers its real
      routes at runtime through federated extension loading.
- [x] 3.2 Extend `scripts/benchmark-projects.mjs` only as required for the
      profile. Verify `pnpm test:benchmarks -- --project suitecrm` analyzes,
      plans and writes no external files.
      The only extension is the conditional unit baseline: a project that
      declares `minimumUnits` is now checked the same way routes and screens
      already were, so `baserow` and `cal-com` are unaffected. The command exits
      0 and prints `suitecrm: angular, 0 routes, 0 screens`; the analyze and plan
      legs both report the `angular` adapter, and the profile declares no target
      diagnostic, so the run writes nothing outside its temporary workspace.
- [x] 3.3 Record source revision, route and unit counts, and all unsupported
      surfaces in `docs/evidence/angular-suitecrm-benchmark.md`. Verify that the
      document states this is analysis evidence, not a SuiteCRM partnership.
      `docs/evidence/angular-suitecrm-benchmark.md` records the pinned revision
      `2cd77380bc838b8bd6c80f9fbe25855d73ef860c`, the reproduction commands
      (`pnpm test:benchmarks -- --project suitecrm` and
      `node packages/navirox/dist/bin.js analyze /tmp/suitecrm-core --json`), the
      counts (12286 files, 1588 units as utility 1251 / component 297 /
      state-module 40, 684 capabilities, 0 routes, 0 screens, findings info 198 /
      warning 179 / error 0) and every unsupported surface with its code and count
      (`angular-external-template` 198, `angular-module` 177,
      `angular-remote-configuration` 1, `version-untested` 1 for `@angular/core`
      18.2.14 against the tested `^20`/`^21`). It explains why routes and screens
      are 0 (the shell route table is an empty literal `Routes` array and the real
      routes arrive through federated extension loading) and it states in its
      opening line and again in a closing section that this is analysis evidence
      with no migration, conversion, endorsement or visual-parity claim.

## 4. Publish bounded mobile readiness

- [x] 4.1 Define evidence-based candidate, desktop-only and unknown classifications
      for the fixture. Verify each classification has a source location and a
      reason in a unit test.
      `packages/source-angular/src/readiness.ts` classifies a unit from observable
      source signals only, in a documented order: an unread external template is
      `unknown`, an observed attachment, device capability or mutating record
      write is `candidate`, an administration or configuration route is
      `desktop-only`, and anything else is `unknown` because no signal was seen.
      Every classification carries a rule, a reason and evidence that includes the
      source path. `src/readiness.test.ts` (9 tests) asserts each rule and its
      ordering, including that a configuration route with an attachment signal is
      still a `candidate` and that no reason claims portability. The fixture test
      `classifies mobile readiness with a source location and a reason` asserts all
      three states appear across `fixtures/suitecrm-app` (candidate for
      `record-attachments`, `record-detail`, `record-update-form`; desktop-only for
      `configuration`; unknown for `record-history` and `record-list`) and that
      every unit's evidence names its own source file. `pnpm --filter
      @memolabs-apps/source-angular test` passes 27 tests and
      `pnpm --filter @memolabs-apps/source-angular typecheck` exits 0.
- [x] 4.2 Decide whether the classification remains Angular metadata or needs a
      neutral contract, using the four contract-change questions in the design.
      Verify no shared schema changes unless the decision records a second
      adapter or user-visible consumer.
      The decision is recorded in the design under `## Contract change questions`:
      the classification stays Angular adapter metadata and no shared contract
      changes. It travels on `DiscoveredUnit.metadata.mobileReadiness`, the field
      the neutral contract already documents as framework specific detail, and
      `buildFragment` copies that metadata verbatim into `UnitNode.metadata`, so
      the classification reaches the inspection report without a new field. The
      four questions answer as follows: the current contract is not insufficient
      because the metadata field exists for exactly this; only the Angular adapter
      demonstrated the need and only for this discovery question (the Vue path has
      no equivalent semantic); adapter metadata is not insufficient because a
      neutral contract would need a second adapter making the same decision plus a
      user-visible consumer that both share, and neither exists in this change; and
      the schema version does not change. `APP_GRAPH_SCHEMA_VERSION` and
      `INSPECT_REPORT_SCHEMA_VERSION` both remain 1 and this change touched no file
      under `packages/source` or `packages/graph`.
- [x] 4.3 Render the classification in the inspection or plan output without
      calling any route automatically portable. Verify a fixture report contains
      all three states and a command exit code remains successful.
      `packages/inspect/src/render.ts` gained an `Observations` section that prints
      the metadata entries an adapter attached to a unit, in the adapter's own
      words. The renderer stays neutral: it interprets no framework concept, it
      prints an entry only when it carries a `reason` string, and its wording never
      calls a unit portable. Two tests in `packages/inspect/src/pipeline.test.ts`
      cover it: `renders an adapter observation in the adapter own words` asserts
      the section, the state label, the reason, and the absence of both `portable`
      and an unreasoned metadata entry; `prints no observation section when no
      adapter attached one` asserts other adapters render unchanged.
      `node packages/navirox/dist/bin.js inspect -C
      packages/source-angular/fixtures/suitecrm-app` exits 0 and prints all three
      states (candidate for `record-attachments`, `record-detail` and
      `record-update-form`, desktop-only for `configuration`, unknown for the rest),
      and the same command with `--json` reports states
      `["unknown","desktop-only","candidate"]` with counts unknown 7, desktop-only 1,
      candidate 3 and no occurrence of `portable` in the document.
      `pnpm --filter @memolabs-apps/inspect test` passes 15 tests.
- [x] 4.4 Write `docs/pilots/suitecrm.md` as an integrator discovery brief.
      Verify it scopes one workflow and excludes authentication, offline and
      compliance promises until discovery confirms them.
      `docs/pilots/suitecrm.md` scopes exactly one workflow (a field worker opens
      one record, updates one field, and attaches a document or a photo, which is
      the shape the fixture classifies as `candidate` on three separately
      observable signals) and states its evidence basis: the pinned revision
      `2cd77380bc838b8bd6c80f9fbe25855d73ef860c`, its counts, and the fact that the
      shell route table is empty so route level scope must be confirmed by the
      instance owner. It describes the five-day discovery from the design (select
      one field workflow, verify API and authentication ownership, identify offline
      and compliance requirements, scope, fixed-scope proposal) and keeps
      authentication, offline synchronisation and compliance in an explicit
      `Excluded until discovery confirms them` section, with a `What is not
      promised` section that refuses a SuiteCRM mobile app, an official
      partnership, a customer name and any visual parity claim. It names no
      customer and records the pinned revision's AGPL-3.0 license as a review the
      brief is not. `pnpm prettier --check docs/pilots/suitecrm.md` is clean.

## 5. Verify and close

- [x] 5.1 Run `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`,
      `pnpm format:check`, `pnpm deps:check` and
      `pnpm test:benchmarks -- --project suitecrm`. Verify every command exits 0.
      All seven commands exit 0: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check` and `pnpm deps:check` on the whole
      workspace, and `pnpm test:benchmarks -- --project suitecrm`, which prints
      `suitecrm: angular, 0 routes, 0 screens` while reading the pinned revision
      without installing or modifying it. The gate covers the new
      `packages/source-angular/src/readiness.ts`, the adapter changes in
      `routes.ts` and `inspect.ts`, and the `Observations` section added to
      `packages/inspect/src/render.ts`.
- [x] 5.2 Run `openspec validate angular-suitecrm-readiness --strict` before
      implementation and before archival. Verify unchecked tasks remain visible
      until their evidence exists.
      `openspec validate angular-suitecrm-readiness --strict` printed
      `Change 'angular-suitecrm-readiness' is valid` and exited 0 twice: once
      before any implementation (task 1.1) and once before archival. Every task
      above was left unchecked until its stated command or artifact existed, and
      each note names the command that was run or the file that was written, so no
      task was marked complete on intent alone.

