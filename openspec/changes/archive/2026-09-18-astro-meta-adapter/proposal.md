## Why

Seven adapters read seven frameworks, and every one of them assumes the same
thing: the UI in the repository belongs to a single framework. Astro is the
first project that breaks that assumption on purpose.

An Astro project is one repository containing several UI frameworks at once. The
`.astro` files are server-rendered components with no client runtime of their
own, and the interactive parts are islands, each one written in whichever
framework the team chose. Astro's own documentation is explicit that only Astro
components can contain components from multiple frameworks, which makes the
Astro file the composition point rather than a framework of its own.

That is why the roadmap puts Astro last and calls it a meta-adapter. Its job is
not to read a framework but to read the container, identify the islands, and
hand each island to the adapter that already knows how to read it. The
migration plan lists Vue, Svelte and React as the prerequisites, and all three
exist today.

The second thing Astro puts to the test is the model. A provider of islands is
exactly the kind of package that tempts a shared concept into the graph, and the
App Graph has to stay small enough that a project made of three frameworks does
not grow a fourth vocabulary. The answer this change is written to prove is that
the composition lives in the adapter and the graph does not move.

## What Changes

The change adds `@memolabs-apps/source-astro`, the eighth source adapter and the first
one that composes others.

- **Detection and composition.** The adapter declares itself a candidate when
  the project declares `astro`, and it lists `vue`, `react` and `svelte` as the
  adapters it composes, which is what makes the registry prefer it over any of
  them without a framework name appearing in the registry.
- **Pages and routes.** `src/pages` is a documented file contract, so routes are
  read from it: index files map to their directory, nested directories become
  segments, `[param]` becomes a parameter, `[...rest]` becomes a rest parameter,
  a segment can carry several parameters, and files or directories prefixed with
  an underscore are excluded by the framework itself.
- **The server surface.** Endpoints in `src/pages`, `src/middleware.ts` and
  `astro.config.mjs` run on the server or at build time. They are reported as
  findings rather than read as application code, the same way the Next adapter
  treats its own server surface.
- **Islands.** Each `.astro` file is read for hydration directives. The page
  records the island in its metadata, the composed adapter reads the component
  behind it, and a directive that cannot be resolved to a project file becomes a
  finding instead of a guess.
- **Attribution.** Every node in the fragment carries the `astro:` prefix,
  including the components another adapter read, because this adapter is what
  produced the fragment. Findings are different: they keep the adapter that made
  them.
- **Two values of data in the neutral package.** `.astro` joins the source
  extensions and `astro.config.mjs` joins the configuration names, which is how
  a third framework extends the reader without a branch being added to it.

## Capabilities

### New Capabilities

- `source-astro`: detection of an Astro project, its pages and routes, its
  server surface, its islands, and the delegation of island components to the
  adapters that read them.

### Modified Capabilities

None. The App Graph stays at schema version 1 and no shared concept is added:
islands are metadata owned by this adapter, exactly as the App Graph
capability requires of a framework construct.

## Impact

- New package `packages/source-astro`, depending on `@memolabs-apps/graph`,
  `@memolabs-apps/source`, `@memolabs-apps/source-vue`, `@memolabs-apps/source-react` and
  `@memolabs-apps/source-svelte`. It imports no framework and no target provider.
- `packages/source/src/files.ts`: two values of data, `.astro` in the source
  extensions and `astro.config.mjs` in the configuration names.
- `packages/cli`: the adapter is registered at the composition root and the
  inter-adapter gate gains an Astro block, so `packages/cli/package.json` and
  `packages/cli/src/cli.ts` change with it.
- `README.md`: the package table and the support matrix name the new adapter.
- `docs/evidence/`: the reading recorded, including what the composition proved
  and what it did not.
- `examples/vue-basic` and the runtime path are untouched. Nothing is renamed
  and no target provider is involved.
- Out of scope: server islands and actions, content collections, `astro:env`,
  session and caching APIs, redirects declared in the configuration, and any
  transform. A framework component rendered without a hydration directive is
  server-rendered HTML and is not reported as an island; the gap is recorded
  rather than guessed.
