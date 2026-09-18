## Why

Nuxt is half of the execution wedge this product declares, and the adapter reads the smaller half of what a Nuxt project says. Today it finds pages under `src/pages` or `pages`, turns layouts into units, and reports the server surface instead of reading it. Four things a Nuxt project actually contains are invisible to it:

- The directory Nuxt 4 uses. The current release moved the application into `app/`, so `app/pages`, `app/layouts`, `app/middleware` and `app/plugins` are the defaults now, and none of them are read.
- `definePageMeta`, the compiler macro that says which layout a page uses, which middleware guards it, and whether the route the file name implies is the route the page really has. A page can declare `path` or `alias` and the file name stops being the whole truth.
- The two halves of a component. A `.server.vue` file is a server component that runs in a different runtime, a `.client.vue` file renders only after mount, and a component that ships both is two implementations of one thing.
- `app.config`, the application configuration file that is published to the client bundle and must never hold a secret, which is a different fact from `nuxt.config` and deserves its own name in the report.

A team asking "what of my app can move" gets a report that is silent on the things that most often decide whether a screen can move at all. The roadmap calls this stage Nuxt migration intelligence for exactly this reason: the wedge framework is read like the framework it is.

## What Changes

- The adapter reads the application directory Nuxt 4 documents: `app/pages`, `app/layouts`, `app/middleware`, `app/plugins`, alongside the root and `src/` locations it already reads. When two page roots claim one path, one route is kept deterministically and a finding names both files.
- `definePageMeta` is read: `path` and `alias` decide the routes a page really has, and `layout`, `middleware`, `name` and `key` are recorded on the page's unit as adapter metadata. Nothing about the macro becomes a shared graph concept.
- A page that names a layout or a middleware the project does not have is reported instead of passing silently.
- The two halves of a component are read as two runtimes: a `.server.vue` file is reported as running outside the browser runtime, a `.client.vue` file stays a component and records that it renders after mount, and a pair is never merged into one unit.
- `app.config.ts`, `.js` and `.mjs` are reported as application configuration this adapter does not read, with its own finding code so it is not confused with `nuxt.config`.
- A new fixture exercises these conventions. The existing fixtures and their measured route sets are left alone.

Data fetching is deliberately unchanged. The adapter still reports `useFetch`, `useAsyncData` and `$fetch` as the shared `network-request` capability and models nothing of its own, which an existing test states on purpose.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `source-nuxt`: the capability gains requirements for the application directory, for page metadata, for the layout and middleware a page names, for the two halves of a component, and for `app.config`. No existing requirement changes.

## Impact

- `packages/source-nuxt`: `src/conventions.ts` gains the application directory roots, the page metadata reading and the config file; `src/inspect.ts` gains the findings and the metadata; `src/index.ts` re-exports whatever changes shape; a new `fixtures/nuxt4-app` fixture and new tests.
- `packages/cli`: only if the adapter gate needs a line for the new fixture. The existing Nuxt comparison is untouched.
- `README.md` and `docs/evidence/`: the support matrix names what Nuxt detection and inspection cover, and the reading is recorded as evidence.
- `PLAN.md`: no definition of done item moves. This is depth inside a capability that already exists.
- Nothing in the runtime, the UI, the router, the toolchain packages or the acceptance app changes. No new dependency. No changeset until the packages are actually published.
