# Nuxt: the application directory, the page macro, and the two halves

## The question, and the answer

Nuxt is one half of the execution wedge this product declares, and until this change the
adapter read the smallest part of it. It detected Nuxt, derived routes from a pages
directory, reported layouts as units, and put everything else behind a finding. That was
honest, and it was thin: four things that decide whether a Nuxt screen can move were
invisible.

The answer is that all four are now read, and none of them moved the model. The App Graph
is still at schema version 1, no shared type gained a field, and `SourceInspection` is
unchanged. What a page declares about itself is adapter metadata, exactly as the module
boundary is for Next and islands are for Astro.

## What the documentation says, and why it decides the shape

Four facts were read from the Nuxt documentation rather than recalled, and each one fixed
a decision:

- **Nuxt 4 keeps the application under `app/`.** Its pages, layouts, middleware and plugins
  live in `app/pages`, `app/layouts`, `app/middleware` and `app/plugins`. The constants this
  adapter carried were `src/pages`, `pages`, `src/layouts`, `layouts`, `plugins`,
  `src/plugins`, `middleware` and `src/middleware`, so a project on the current convention
  produced no routes at all.
- **`server/` is at the project root, not under `app/`.** The server surface this adapter
  already reported was therefore correct, and the documentation is explicit that the two
  sides must not import each other. That is the reason the server code is reported and not
  read, and it stays that way.
- **`definePageMeta` is a compiler macro** whose `path` and `alias` decide the route, and
  whose `layout` and `middleware` point at files. A route derived from a file name is
  therefore not always the whole truth.
- **A component can be one half of two.** A `.client.vue` file renders only in the browser
  after mount; a `.server.vue` file is a standalone server component that renders on the
  server and uses `NuxtIsland` underneath; a pair of them describes one component in two
  implementations.

## What the adapter reads now

| Reading | Result |
| --- | --- |
| `app/pages`, `pages`, `src/pages` | routes, with the Nuxt 4 directory added to the two that were already read |
| `definePageMeta` | `path` and `alias` become routes, `layout`, `middleware`, `name` and `key` become metadata on the page unit |
| a named layout or middleware | a finding when the name does not resolve to a file |
| two page roots claiming one path | one route, kept by a rule that does not depend on directory order, plus a finding naming both files |
| `.server.vue` | a finding, and no application unit |
| `.client.vue` | an ordinary component unit carrying a mount flag |
| `app.config` | a finding under its own code |

The mirror fixture was not touched, so its measured route set is still
`/`, `/about`, `/blog`, `/blog/:slug` and `/docs/:lang`, and the fixture rooted without
`src/` still yields `/` and `/:id`.

## Why the page macro is metadata and not a graph concept

`definePageMeta` is a compiler macro. A directive, a decorator or a macro is exactly the
kind of framework construction the App Graph keeps out of its shared model, so the reading
lands on the unit for the page file: `DiscoveredUnit` already has a metadata field, and
`DiscoveredRoute` deliberately does not. The page keeps its metadata on the unit and its
paths in the routes, and neither one teaches the graph what a Nuxt page is.

The one place the macro changes a route is `path` and `alias`, and there it is a route,
because it is a statement about the URL. This is also why the collision case had to be
reduced to a single route when it was measured: two routes for one path would have said the
project serves both.

## Why the two halves are reported and not merged

A `.server.vue` component runs in a different runtime. Reporting it as an application
component would have claimed a portability the platform does not have, and merging a
`.client` and a `.server` file into one unit would have hidden that a component has two
implementations with different runtimes. The adapter therefore drops the server half from
the units, keeps it as a finding, and leaves the client half where it is with a flag
saying when it mounts.

The documentation is candid that the suffixes only take effect through Nuxt auto-imports
and `#components` imports. The adapter does not model that boundary: a `.client.vue` file
in a project that imports it by explicit path is still reported as a client half, and the
limitation is recorded here rather than papered over.

## What was deliberately not done

- **Data calls stay one shared capability.** `useFetch`, `useAsyncData` and `$fetch` remain
  `network-request:invoke` and nothing more. The existing test that fixes this was kept
  unchanged, because a Nuxt-specific data model would have been the first framework
  construction to enter the shared graph on the strength of one adapter.
- **The server code is still reported, not read.** Nitro forbids importing across the two
  sides, and this adapter has no reading of the server runtime.
- **Markdown pages are not routes.** They need the content module, which is not what a
  bare Nuxt project has.
- **`runtimeConfig` and `useRuntimeConfig` produce nothing.** `nuxt.config` was already
  reported as unread configuration, and a secrets carrier deserves a decision rather than a
  side effect of this change.

## Proof

| Check | Result |
| --- | --- |
| `@memolabs-apps/source-nuxt` build | `tsc --build`, no output |
| `@memolabs-apps/source-nuxt` tests | 22 passed, 1 file |
| `@memolabs-apps/cli` tests, including the cross-adapter gate | 75 passed, 7 files |
| The fixture on the Nuxt 4 convention | routes `/`, `/a/:slug`, `/dashboard`, `/posts/:slug`, `/settings` |
| The fixture that must not change | routes `/`, `/about`, `/blog`, `/blog/:slug`, `/docs/:lang` |
