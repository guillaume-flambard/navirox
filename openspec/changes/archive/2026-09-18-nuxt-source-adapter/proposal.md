## Why

Nuxt is the second half of the execution wedge. The repositioning names Vue and
Nuxt as what the product is for today, and the first thing a Nuxt team needs is
not a transform, it is a readiness reading: which parts of this application are
already portable, which are tied to the browser, and which are tied to the
server. That reading is exactly what the seam was built to produce, and the
Nuxt adapter is the first one whose value is obvious before any code generation
exists.

It is also the first adapter that composes rather than opens a new front. Nuxt is
Vue plus conventions, so the adapter reads what Nuxt adds and delegates the rest,
which tests the composition path the registry already supports with a second real
case.

## What Changes

- Add `@memolabs-apps/source-nuxt`: detection, filesystem routes from the pages
  directory, layout units, composable units, and findings for the directories and
  primitives it does not model (server routes, plugins, middleware, runtime
  config).
- Teach the neutral capability scan the framework spellings of a network request,
  so a Nuxt data call is reported through the same vocabulary as a browser
  `fetch` instead of a new concept.
- Register the adapter at the composition root, and extend the support matrix.

## Capabilities

### New Capabilities

- `source-nuxt`

### Modified Capabilities

- None

## Impact

- New package: `packages/source-nuxt`.
- `packages/source`: the capability pattern set gains the Nuxt data fetching
  spellings. No published requirement changes.
- `packages/cli`: one line at the composition root.
- Root `tsconfig.json`, `pnpm-lock.yaml`, `README.md`, `docs/evidence/`.
- Not touched: `examples/vue-basic`, the runtime packages, the CI workflows, and
  the cross-adapter gate, whose two fixtures stay mirror images of each other.
- Out of scope: Nuxt 2, Nitro server internals, `useAsyncData` payload caching
  semantics, module options, and any migration transform. Each is reported rather
  than guessed.
