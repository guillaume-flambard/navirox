## Why

Nine adapters read nine frameworks, and each one has taught the model something
different: a store, a decorator, a directive, an island, a signal. Qwik teaches
none of those. It is built around resumability, which means its state is
serialization-first and its components are lazy boundaries rather than function
calls, and its routing lives in Qwik City where the file system is the route
table.

That matters for a migration for a reason that is not obvious from the outside:
Qwik is the first source whose components are not simply functions that render.
A component is a `component$` boundary, and the place state lives is the place it
is read from, not a module the app imports. An adapter that assumed a store
module would report nothing for a Qwik app, and an adapter that read `useStore`
as if it were one would report a component-local object as shared state.

There is also a smaller thing this source makes explicit. Qwik City documents
route groups, named layouts and plugins, so the route table is not simply the
directory tree. Reading it correctly, and saying so when a path is rewritten
outside the file system, is the difference between a report a team can act on
and one that quietly omits routes.

## What Changes

A new adapter package, `@memolabs-apps/source-qwik`, the tenth source adapter and the
first one for Qwik. It reads:

- detection from the manifest, with the native runtime refusal every JSX adapter
  has inherited since React;
- components by the `component$` boundary a module uses, with the store and
  signal usage it declares kept as adapter metadata rather than as units;
- routes from `src/routes`, following the conventions Qwik City documents:
  directory names form segments, `(name)` directories are pathless, `index.tsx`
  names its directory, a `[param]` segment is a parameter and a `[...catchall]`
  segment is the rest, `@name` selects a named layout and is not part of the
  path, and layouts are units of kind `layout`;
- the surface this adapter does not model as findings: `index.ts` endpoints,
  `404.tsx` pages, `plugin.ts` and `plugin@name.ts` request handlers, files in
  `src/routes` that are none of those, and a `rewriteRoutes` declaration in the
  Vite config, which changes paths outside the file system;
- capabilities through the shared scan, so a Qwik fixture reports the same
  capability multiset as the Vue fixture.

Then the usual tail of a new adapter: fixtures, tests, the composition root, the
gate, the README, and an evidence file.

## Capabilities

### New Capabilities

- `source-qwik`: detection, components, the file-system route table Qwik City
  documents, layouts, the unmodelled surface, and the graph a Qwik project
  produces.

### Modified Capabilities

None.

## Impact

- New package `packages/source-qwik`, depending on `@memolabs-apps/graph`,
  `@memolabs-apps/source` and `@memolabs-apps/source-react` (for the native declaration
  refusal, as Next and Astro already do).
- `packages/cli`: one line in the composition root and one dependency, which
  brings the registry to ten adapters, plus a Solid-shaped block in the gate.
- `README.md` and `docs/evidence/`.
- No change to the App Graph schema (still version 1), to `SourceInspection`, to
  the runtime, the UI, the router, the build or the acceptance app. No new
  dependency.
