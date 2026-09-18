## Context

The Nuxt adapter is the smaller half of the execution wedge the product declares, and it is the smaller half of what Nuxt says. Measured against the current package: `conventions.ts` reads pages from `src/pages` and `pages`, layouts from `src/layouts` and `layouts`, reports `server`, `src/server`, `plugins`, `src/plugins`, `middleware` and `src/middleware` as surface it does not model, and names `nuxt.config.ts` and `nuxt.config.js` as runtime configuration it does not read. `inspect.ts` composes the Vue adapter, drops the units that live outside the browser runtime, replaces the framework version with the Nuxt range, and adds the routes and the layouts. Its own tests fix two behaviours on purpose: the route set of the mirrored fixture, and the rule that `useFetch` is reported as the shared `network-request` capability and nothing more.

Four facts from the framework documentation shape this change, all read rather than assumed:

- Nuxt 4 moved the application into `app/`. `app/pages`, `app/layouts`, `app/app.vue` are the defaults the current documentation describes, so the directories this adapter reads are the ones Nuxt left behind.
- `server/` stayed at the project root, which the existing constants already cover, and the documentation states plainly that application code must not be imported into server routes or the other way round. That is the justification for reporting server files rather than reading them, and it does not change here.
- `definePageMeta` is a compiler macro on page components. It carries `layout` and `middleware`, which reference `app/layouts` and `app/middleware`, and `path` and `alias`, which mean the file name is not the whole truth about a route.
- A component file may end in `.client` or `.server`. The first renders only after mount, the second is a server component that never runs in the browser, and a project may ship both halves of one component under one name. `app.config` is a separate, client-visible configuration file with an explicit warning never to put a secret in it.

Constraints: no new dependency, the existing mirrored fixtures keep the route sets their tests assert, the shared App Graph does not grow a concept for any of this, and everything stays deterministic and traceable.

## Goals / Non-Goals

**Goals:**

- Read the application directory the current documentation describes, without losing the older ones.
- Read the page metadata that decides a page's routes, its layout and its middleware, and keep it as adapter metadata.
- Report a page that names a layout or a middleware the project does not have.
- Read the two halves of a component as two runtimes, and a pair as two entries.
- Name the application config file under a code of its own.
- Keep every reading deterministic, traceable, and free of any shared model change.

**Non-Goals:**

- Modelling data fetching. `useFetch`, `useAsyncData`, `useLazyFetch`, `useLazyAsyncData` and `$fetch` stay the shared `network-request` capability, which an existing test states on purpose.
- Reading server code. The Nitro surface keeps being reported, and the documentation's own warning about importing across the boundary is the reason.
- Reading the content module's Markdown pages, the `runtimeConfig` keys of `nuxt.config`, or `nuxt.config` itself.
- Any transform, any migration output, any change to the runtime, the router, the UI or the acceptance app.
- Any shared contract change. The App Graph stays at schema version 1 and `SourceInspection` gains no field.
- Renaming what the package already exports, beyond what the new roots require.

## Decisions

**The application directory is added as another root, not as the only one.** A project created today is read, and a project created in the last two years keeps being read by the same adapter. Rejected: replacing `src/pages` and `pages` with `app/pages`, which would stop reading the framework's own older layouts and would invalidate the fixtures this package and the adapter gate already measure.

**Page metadata is adapter metadata, carried on the page's unit.** `DiscoveredRoute` has no metadata field and the shared contract is deliberately semantic, so the place a page's declared layout, middleware, name and key are recorded is the unit for that file, which is the same place Next records its module boundary and Astro records its islands. Rejected: extending the route type, which would make one adapter's need a field every adapter must carry.

**`path` and `alias` produce routes; `layout`, `middleware`, `name` and `key` are metadata.** A page that declares a path serves that path, and a report that printed the file-derived pattern would be wrong about the route set. Rejected: ignoring the macro, which would leave the report describing a route the framework does not serve.

**A page that names a layout or a middleware the project does not have is reported.** Rejected: silence. A page naming something absent is exactly the kind of fact a migration plan needs before someone estimates the work.

**A server half is a finding, a client half is a component with metadata, and a pair is two entries.** Rejected: treating both halves as components, which would quietly put server code in the browser column. Rejected: merging the pair into one unit, which would hide that one half never runs on the device. The documented limitation that the suffixes only take effect through auto-imports is recorded rather than resolved.

**The application config is reported under its own finding code.** `app.config` is client-visible by design and warns against secrets, while `nuxt.config` may hold them, so the two facts must not share a code. Rejected: reading the file, because nothing downstream consumes its values yet. Rejected: folding it into the existing runtime configuration code, because the distinction is the point.

**Two page roots that claim one path keep one route and produce one finding.** This is the same rule the Astro adapter applies to two files with one route. Rejected: reporting both routes, which would report a route set the framework would not serve.

**No shared contract changes, and the App Graph stays at version 1.** Working through the contract questions: no existing contract was shown insufficient; the need is this adapter's and is expressed with what the contract already has; adapter metadata is enough for everything the macro carries; and the schema version therefore does not move.

**A new fixture rather than converting the mirrored one.** The Nuxt 4 layout, the macro, the two halves and the application config go into their own fixture. Rejected: moving `nuxt-app` to `app/`, which would move the route set that two test suites measure and would prove the new convention by deleting the old one.

## Risks / Trade-offs

- More roots means a project that keeps both `pages/` and `app/pages/` now produces a collision finding. That is a real signal during a migration, and the finding names both files, but it will be the first thing a half-migrated project sees.
- `definePageMeta` is read with a pattern, because the project has no Nuxt compiler dependency and is not going to take one. An argument that is not an object literal cannot be resolved, and the honest outcome is a finding rather than a guess.
- The `.client` and `.server` suffixes only take effect through auto-imports. A project that uses the names and imports by path gets a reading that follows the name rather than the behaviour. The limitation is documented in the framework's own page and is recorded here rather than resolved.
- The support claim does not move. Nuxt stays at the level it declares: detected, inspected, and nothing more.

## Open Questions

- Whether a `definePageMeta` argument that is not an object literal deserves a finding of its own, or whether the absence of metadata is quiet enough.
- Whether the `Lazy` prefix, the `.global` suffix and the `hydrate-*` strategies should be recorded, when a migration decision exists that consumes them.
