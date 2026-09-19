# Qwik: the framework whose components are boundaries

## The question, and the answer

Every adapter so far has answered some version of "what does this framework add
that the model has to know?". Qwik is the first one whose components are not
calls: `component$` declares a lazily loaded, resumable boundary, and the state a
component keeps lives inside the component rather than in a module an application
imports. That is a fourth reactivity story, and the honest question was whether
it forces a fourth concept.

It does not. The App Graph stayed at version 1, no shared type in
`@navirox/source` gained a field, and no framework-neutral package was touched. A
`useStore` call is recorded as metadata on the component that made it, exactly as
the module boundary was for Next and the islands were for Astro.

## What the documentation says, and why it decides the shape

Four documented facts decided the reading:

- Qwik City routes by file system under `src/routes`, and only **folder names**
  match the URL. `index.tsx` (or `index.mdx`, or `index.md`) is a page,
  `index.ts` is an endpoint, and `layout.tsx` is a nested layout.
- `[id]` is a parameter and `[...catchall]` is a rest parameter.
- A folder in parentheses is pathless, its name never reaching the URL, and a
  named layout is selected by an `@name` suffix on the file name, which never
  reaches the URL either.
- `vite.config.ts` can declare `rewriteRoutes`, which changes the paths the file
  system describes, so the tree is not the whole table.

Qwik documents no store module for an application to import, which is why a
module that calls `useStore` or `useSignal` is a component with state rather than
a state module.

## What the adapter reads now

| Input                                    | Reading                                                        |
| ---------------------------------------- | -------------------------------------------------------------- |
| `src/routes/**/index.tsx|.mdx|.md`       | A route, its path taken from the folders that contain it        |
| A folder in parentheses                  | Omitted from the path                                           |
| `[id]` and `[...slug]`                   | A parameter, collected on the route                             |
| An `@name` suffix                        | Kept out of the path                                            |
| `layout.tsx` and `layout-<name>.tsx`     | A unit of kind `layout`                                         |
| A `component$` boundary                  | A unit of kind `component`                                      |
| `useStore` and `useSignal` inside it     | Metadata on that component, never a unit of their own           |
| `src/routes/**/index.ts`                 | A finding (`qwik-endpoint`), no route and no unit               |
| `404.tsx`                                | A finding (`qwik-not-found-page`)                               |
| `plugin.ts` and `plugin@<name>.ts`       | A finding (`qwik-plugin`)                                       |
| `rewriteRoutes` in a Vite config         | A finding (`qwik-route-rewrite`)                                |
| Anything else under `src/routes`         | A finding (`qwik-unread-route-file`)                            |

On the mirrored fixture the reading produces seven routes (`/`, `/about`,
`/dashboard`, `/docs/:slug`, `/posts/:id`, `/pricing`, `/profile`), the three
unit kinds `component`, `layout` and `utility`, and the same five capabilities as
the Vue fixture: `local-storage:read`, `local-storage:write`,
`local-storage:unknown`, `network-request:invoke` and `geolocation:invoke`.

## Why there is no state module here

Vue and Svelte ship a store a module can import, so a module that declares one is
a unit. Solid reaches its store through `solid-js/store`, so the same reading
applies. Qwik does not: `useStore` and `useSignal` are called inside a component,
and the value they return belongs to that component's lifetime. Reading them as a
shared store would report local state as if the application shared it, so the
adapter records the usage as metadata and leaves the kind out. That is the one
difference the gate names against the Vue report, and it is asserted in both
directions.

## What was deliberately not done

`useSignal`, `useStore`, `useTask$`, `useResource$` and the rest of the reactive
API are not modelled, because a signal is syntax a framework owns rather than a
fact a migration decision needs. The bodies of `routeLoader$`, `routeAction$` and
`server$` are not read, for the same reason the server surface of Nuxt, SvelteKit
and Astro is reported instead. Qwik Labs typed routes are neither read nor
reported, and the gap is recorded here: a project that declares its routes only
through typed routes would have them invisible. No transform was written.

## The shared scanner has a word trap, and it fired

The shared capability scan classifies a bare `location` as a URL navigation,
because that word is how the browser exposes one. A Qwik page that binds
`const location = useLocation()` therefore added four spurious
`url-navigation:unknown` capabilities, twice per page, on the binding line and on
the use line. The fixture was written to destructure the idiomatic
`const { params } = useLocation()` instead, which keeps the documented way to read
a parameter and does not bind the trap word, and the five expected capabilities
came back exactly. The trap is in `@navirox/source`, so it is available to every
adapter; it was recorded here rather than fixed at the time, because a fix would
change how every framework's `location` is read and that belongs to its own change.

Fixed since, by `capability-name-precision`: the fallback for `url-navigation` now
names the global (`window.location`) instead of the bare word, so this page's
`const location = useLocation()` would no longer be reported, and the destructuring
in the fixture is now a style choice rather than a workaround.

## Proof

| Command                                              | Result                                |
| ---------------------------------------------------- | ------------------------------------- |
| `pnpm --filter @navirox/source-qwik build`           | `tsc --build` with no output          |
| `pnpm --filter @navirox/source-qwik test`            | 19 tests, 1 file                      |
| `pnpm --filter @navirox/cli test`                    | 82 tests, 7 files, ten adapters       |
| `pnpm build` / `typecheck` / `test`                  | 27 / 50 / 49 tasks, all successful    |

The negative fixture declares `@builder.io/qwik ^0.20.0`, a major the adapter has
not been exercised against, and the reading reports `version-untested` rather
than claiming support.
