## 1. Read the application directory Nuxt 4 uses

- [x] 1.1 Add the application roots to `src/conventions.ts`: `app/pages` for
      pages, `app/layouts` for layouts, and `app/middleware` and `app/plugins`
      for the surface that is reported rather than modelled. Keep every root
      the adapter reads today. Verify: the exported root lists name both the old
      and the new locations.
- [x] 1.2 Read pages from every root and handle a collision: when two files
      produce one pattern, keep one route by a rule that does not depend on
      directory order and report a finding that names both files. Verify: a
      project with `pages/about.vue` and `app/pages/about.vue` yields one route
      and one finding, and the same inspection twice yields the same result.
- [x] 1.3 Verify the existing route set is unchanged: the mirrored fixture still
      reads `['/', '/about', '/blog', '/blog/:slug', '/docs/:lang']` and the
      root-level fixture still reads `['/', '/:id']`.

## 2. Read the page metadata

- [x] 2.1 Read `definePageMeta` from a page: a `path` decides the route pattern,
      an `alias` adds routes pointing at the same file, and `layout`,
      `middleware`, `name` and `key` are recorded on the page's unit as adapter
      metadata. Verify: a page with a declared path and alias produces the
      declared routes, and the page's unit carries the declared layout,
      middleware, name and key.
- [x] 2.2 Report a page that names a layout or a middleware the project does not
      provide, naming the page and the missing name. Verify: two tests, one per
      kind of name, each asserting the finding and its message.
- [x] 2.3 Confirm nothing about the macro reaches the shared model: no new field
      on any graph type, no new member on `SourceInspection`, schema version
      still 1. Verify: `git diff --stat packages/graph packages/source` shows no
      change to a shared type, and the adapter's own graph test still passes.

## 3. Read the two halves of a component

- [x] 3.1 Report a `.server.vue` file as running outside the browser runtime,
      with no application unit for it, reusing the same surface mechanism the
      adapter already uses for server files. Verify: the file appears among the
      findings and appears in no unit collection.
- [x] 3.2 Keep a `.client.vue` file as a component and record in its metadata
      that it renders only after mount. Verify: the unit exists, its kind is
      `component`, and its metadata carries the flag.
- [x] 3.3 Never merge a pair: a project with both halves yields the finding for
      the server half and the unit for the client half. Verify: one test with
      both files, asserting two entries and not one.

## 4. Name the application config

- [x] 4.1 Report `app.config.ts`, `app.config.js` and `app.config.mjs` under a
      finding code of their own, distinct from the code used for
      `nuxt.config.ts`. Verify: a test asserting the new code, and a test
      asserting the runtime configuration still uses its existing code.

## 5. Fixture, gate and record

- [x] 5.1 Add a `fixtures/nuxt4-app` fixture that exercises the new conventions:
      pages, a layout, middleware and a plugin in the application directory, a
      page with `definePageMeta` (a declared path, an alias, a layout, a
      middleware, a name and a key), a page naming a layout and a middleware that
      do not exist, a `.client.vue` file, a `.server.vue` file, and an
      `app.config.ts`. Verify: the fixture exists and the package tests read it.
- [x] 5.2 Confirm the adapter gate and the mirrored fixtures are untouched:
      `corepack pnpm --filter @navirox/cli test` passes without an edit to the
      Nuxt comparison, or with one added line if the registry listing changes.
- [x] 5.3 Record the reading in `docs/evidence/` and say in `README.md` what
      Nuxt detection and inspection cover. State what was deliberately not done:
      data fetching stays the shared network capability, and server code stays
      reported rather than read.

## 6. Verify and close

- [x] 6.1 Run the full gate at the root: `corepack pnpm build`, `typecheck`,
      `test`, `lint`, `format:check`, `deps:check`. Verify: all six exit 0.
- [x] 6.2 Run the acceptance journey on both platforms as a regression check,
      killing any leftover Metro first: 4/4 on the Android emulator and 4/4 on
      the iOS simulator.
- [x] 6.3 Run `openspec validate nuxt-migration-intelligence --strict`, check
      every box above, and archive the change, which moves the `source-nuxt`
      requirements into the canonical spec.
- [x] 6.4 Commit locally only, with no push. Verify: `git log --oneline -1`
      names the change and `git status --short` is empty.
