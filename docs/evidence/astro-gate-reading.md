# Astro: the pages that belong to several frameworks

This records the answer to the question the change exists for, rather than a
description of the change. Seven adapters each carried the assumption that the UI
of a project belongs to one framework. Vue and Svelte proved the pipeline is
neutral, Angular asked whether a template compiler needed new concepts, React
asked whether reading the framework the target is built on would leak the target,
Next asked whether two routers and a declared server boundary needed new ones.
Every answer was no.

Astro asks a different question. A `.astro` file is a server-rendered component
with no client runtime of its own, and the parts that are interactive are islands,
each written in whichever framework the project chose. The Astro documentation is
explicit that only Astro components can contain components from several
frameworks, so the `.astro` file is the point of composition, and the adapter has
to read a container whose payload belongs to other frameworks.

## The question, and the answer

**Did reading a project whose pages are written in three frameworks at once need
anything new in the model?**

No. No new node kind, no shared concept, no rewrite of a neutral package, no field
added to the adapter contract, and the App Graph is still schema version 1. This is
the third framework in a row that reads through the existing schema, and the
existing schema turned out to already say the right thing: `composes` was a list.

## Composition, for the fourth time and the first of its kind

Nuxt composes Vue, SvelteKit composes Svelte, Next composes React. Astro composes
Vue, React and Svelte at once, and it does so without the registry learning a
single framework name. Selection already prefers an adapter whose id another
candidate declares in `composes`, so a project that declares Astro and Vue selects
Astro, exactly as a project that declares SvelteKit and Svelte selects SvelteKit.
The gate asserts both.

Delegation works by narrowing the inspection context rather than by adding an
entry point to the contract: every adapter iterates `context.files`, so handing a
composed adapter the subset whose extension belongs to it is enough, and the
manifest stays readable because it is read by name rather than from that list.
One hazard surfaced during the reading and is handled explicitly. React, Preact and
Solid share the JSX extensions, and the Astro documentation notes that
distinguishing them needs extra configuration, so when more than one JSX family is
installed the adapter refuses to guess: it declines to delegate the JSX files and
reports the ambiguity instead.

## What is read, on the mirrored fixture

```
found:        18 files, 13 units (11 component, 2 utility)
routes:       6
capabilities: 5
dependencies: 8
findings:     3
```

The three islands of the fixture are read by the adapters of their frameworks, and
they land in one report:

```
src/components/App.vue     component   read by the Vue adapter, on <App client:load />
src/components/Counter.tsx component   read by the React adapter, on <Counter client:visible />
src/components/Widget.svelte component read by the Svelte adapter, on <Widget client:idle />
```

The routes are the documented `src/pages` contract, read from the paths:

```
routes:  /, /:lang-:version/info, /about, /blog/:slug, /posts/1, /sequences/:path
```

The set covers an `index` page naming its directory, a nested folder as a URL
segment, a bracketed folder as a parameter, a rest parameter, two parameters in
one segment, and a Markdown file that is a page and not code. A file or folder
prefixed with an underscore is excluded, because the framework excludes it.

## Why the unit kinds match Vue minus `state-module`

The gate compares the Astro report to the Vue report, and the comparison is exact
about which difference is expected. Next asserted the Vue kinds plus `layout`,
because `layout.tsx` is a contract the framework itself reads. Astro asserts the
Vue kinds minus `state-module`, and no layout at all.

Both differences are facts about the frameworks rather than gaps in the reading.
Store detection belongs to the adapter of the framework that has the store library,
and Astro has none, so a plain application module is read as the utility its
extension makes it. And `src/layouts` is a convention rather than a contract: the
Astro documentation says a layout is an ordinary component, that there is nothing
special about it, and that the directory is not a requirement. Claiming a `layout`
kind would report a convention as a fact of the framework. The fixture carries a
`src/layouts/Base.astro` and the report calls it what it is, a component.

The capabilities are the identical multiset the Vue fixture produces, which the
gate asserts entry for entry, and the schema version is checked to be 1.

## Islands are adapter metadata, not a graph concept

An hydration directive is a framework construction, and the App Graph keeps
framework constructions as metadata owned by the adapter. So each island is
recorded on the unit of the file that carries it, with the component name and the
directive, and nothing about it becomes a node or a shared field:

```
src/pages/index.astro
  islands: App (client:load), Counter (client:visible)
```

A directive that names a component which resolves to no file in the project is a
finding rather than a guess, and so is a directive on a component that resolves to
a `.astro` file, because the framework itself refuses to hydrate an Astro
component.

## Nodes are attributed to this adapter, findings keep their author

Every node in an Astro fragment carries an `astro:` identifier, including the
components the Vue, React and Svelte adapters read, because the fragment is this
adapter's declaration and the graph requires that an id names the adapter that
produced it. Findings are the other way round. A finding is an assertion rather
than a reading, and re-keying a delegated finding onto `astro:` would let two
adapters produce the same id for the same code in the same file, so a delegated
finding keeps the id of the adapter that made it. That asymmetry is the one thing
this change decided that the earlier adapters had not had to decide, and it is
covered by a test.

## The server surface, and the config file that needed no new data

An endpoint in `src/pages`, the middleware and the configuration file run outside
the browser runtime, so none becomes a unit or a route and each is named:

```
info  astro-endpoint    src/pages/api/rows.ts
info  astro-middleware  src/middleware.ts
info  astro-config      astro.config.mjs
```

The proposal expected `astro.config.mjs` to be added to the neutral configuration
file names. The reading showed that was unnecessary: the existing
`CONFIG_FILE_PATTERN` already recognizes `*.config.mjs`, so the file was never
read as an application module, and the finding comes from this adapter's server
surface rather than from a neutral list. The name was not added, because a second
entry for a fact the first one already states is data that drifts.

## The untested fixture, and what it says

A project on an older Astro reports the gap by name rather than assuming the
reading carries over:

```
warning version-untested  The project declares astro ^4.0.0. This adapter was tested against ^7.0.0.
```

## Refusing a native project

The refusal is inherited from the React adapter and not re-implemented. A project
that declares `react-native`, a `react-native-*` module or a `@symbiote-native/*`
package yields no candidate. Detection carries candidates and nothing else, so the
refusal is the absence of a candidate, and the reason travels on the inspection
when the adapter is chosen by name.
