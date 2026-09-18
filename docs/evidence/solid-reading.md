# Solid: the second source read through JSX

The ninth adapter, and the second one whose source is JSX. React wrote the first,
and it answered the question a JSX source raises: the source looks like the
target, so the adapapter has to be built to refuse that reading rather than to
indulge it. Solid asks that question again, and adds a third one: its reactivity
is neither the store an imported module declares nor a set of hook names, it is
signals with a proxy on top.

## The question, and the answer

Does a third reactivity model move the model?

No. The App Graph is still `schemaVersion: 1`, no shared type gained a field, no
neutral package was touched, and the fragment for a Solid project has the same
shape as the fragment for the Vue project it mirrors. The reactivity itself is
not modelled at all, which is the same decision the other adapters made: a
signal is a framework construction, and a framework construction stays where the
graph keeps them, which is nowhere.

## What the documentation says, and why it decides the shape

Four facts from the Solid documentation decided the reading.

- A component is a function that returns elements. There are no hooks to look
  for and no class components, so the declaration is smaller than the React one:
  whether the module is a component, whether it returns elements, and whether it
  declares a store.
- A store is a proxy from `solid-js/store`, built by `createStore` or
  `createMutable`, and its setter takes a path. The library is the subpath, and
  the factories are named, so both are required before a module is called a
  store.
- The router is `@solidjs/router`, and it documents two shapes for the same
  table: `<Route path="/about" component={About} />` in JSX, and
  `defineRoutes([{ path: '/about', component: About }])` or
  `createRouter({ routes: [...] })` in objects. Both are read, because both are
  declared.
- A project that already declares a native runtime is what Navirox produces
  rather than what it reads, so it is refused, and the refusal is imported from
  the React adapter rather than written a fourth time.

## What the adapter reads now

| What                    | How                                                                              |
| ----------------------- | -------------------------------------------------------------------------------- |
| Detection               | `solid-js` in the manifest, with the range as the evidence, or nothing at all    |
| Components              | An exported function that returns elements, on a `.tsx` or `.jsx` file           |
| Stores                  | A module that imports `solid-js/store` and calls `createStore` or `createMutable` |
| Routes                  | The literal `path` of both documented shapes, with `:param` segments             |
| Capabilities            | The neutral scan, on the files a unit was read from                              |
| A nested route or a lazy one | A finding, and no route invented for it                                     |
| A `path` that is not a literal | A finding, and no route invented for it                                 |
| An untested major       | A warning naming what was declared and what was exercised                        |

The mirrored fixture reads as eight units (five component, one state-module, two
utility), five capabilities, three routes and no finding at all. That is the
same multiset of capabilities as the Vue fixture, and the same three kinds.

## Why the store is a unit and not a graph concept

A Solid store is a proxy with a setter that takes a path, which reads like
nothing else in this repository. It is still a module that holds state, which is
what `state-module` means, and the kind was already in the model for that
reason. The alternative, a kind per state library, would put a library name in a
neutral model and would have to grow again for the next one.

## What was deliberately not done

- Signals are not modelled. They are the framework's reactivity, and the graph
  does not carry framework constructions.
- `SolidStart` is not composed. It changes routing to a filesystem convention,
  which is a different reading, and it would be its own adapter on top of this
  one the way Nuxt sits on Vue.
- The route reader is textual. A route whose `path` is built at runtime is
  invisible to it, and that is why a non literal path is a finding rather than a
  guess.
- No transform, no migration, and no change to the runtime, the UI, the router
  or the acceptance app.

## Proof

| Check                                  | Result                                                    |
| -------------------------------------- | --------------------------------------------------------- |
| `@navirox/source-solid` build          | `tsc --build`, no output                                  |
| `@navirox/source-solid` tests          | 18 passed                                                 |
| `@navirox/cli` tests (the gate)        | 78 passed, nine adapters registered                       |
| Solid fixture inspection               | 8 units, 5 capabilities, 3 routes, no finding             |
| Untested fixture                       | `version-untested` and a component, nothing invented      |
| Identifier prefix                      | every node starts with `solid:`                           |

Three defects were found by measuring rather than by reading the code, and all
three were in this adapter. The JSX test only accepted an uppercase element, so
a component returning nothing but host elements read as a utility. The
inspection skipped every file that was not a component extension, so no `.ts`
application module was ever reported and two capabilities were missing. And the
not-literal pattern let its whitespace match retreat to zero characters, so it
looked at the space after `path:` instead of the quote and reported a finding
about a file whose three paths were all literals. Each one is a case where the
fixture said something the source did not.
