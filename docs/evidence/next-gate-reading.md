# Next: the third framework that did not move the model

This records the answer to the question the change exists for, rather than a
description of the change. Vue and Svelte proved that one neutral pipeline can
consume two different source frameworks. Angular then asked whether a template
compiler, dependency injection and decorators needed anything the graph did not
have, and answered no. React asked the sharper question, whether reading the
framework the target is built on would leak the target into the model, and also
answered no.

Next adds two questions of its own. It is where React projects actually live, so
the adapter has to read the framework people use rather than the library underneath
it. And its App Router makes the server boundary an explicit declaration in the
source, which is exactly the kind of framework concept a graph is tempted to adopt
as a node.

## The question, and the answer

**Did two routers and an explicit client/server boundary need anything new in the
model?**

No. No new node kind beyond `layout`, no shared concept, no rewrite of a neutral
package, and the App Graph is still schema version 1. This is the third framework
in a row that reads through the existing schema, and the gate holds the Next report
against the Vue report rather than against a fresh expectation.

## Two routers, one reading

Both routers are documented filesystem contracts, so both are read from the paths
rather than guessed from configuration.

```
routes:  /, /about, /blog/:slug, /dashboard, /pricing, /profile
```

The set covers the cases that decide whether a filesystem reading is real: an
`index` page is its directory, a folder in brackets is a parameter and not a static
segment, a `[...rest]` folder is still one parameter, and a folder in parentheses
is a route group that is omitted from the path. The Pages Router lands in the same
collection, read by the same rules, because a project part way through a migration
has both directories and under-reporting it would be a lie about the project.

## What is read, on the mirrored fixture

```
found:       17 files, 14 units (10 component, 1 layout, 1 state-module, 2 utility)
routes:      6
capabilities: 5
dependencies: 4
findings:    4
```

The capability set is the one the Vue fixture produces, which is what the gate
asserts: the same capabilities, the same unit kinds plus `layout`, and the same
schema version. The adapter composes the React adapter for everything below the
framework layer, so components, stores, application modules and capabilities are
read once, in the React adapter, and not re-implemented here.

## The server boundary is adapter metadata, not a finding per file

Almost every interactive component in an App Router project declares `use client`.
Turning that directive into a finding would bury the rest of the report under a
fact about the build target, and turning it into a graph concept would put a
framework keyword into a model that has to stay neutral. So the declared boundary
is attached as metadata on the unit, kept by the adapter that understands the
directive.

What is a finding is the surface the adapter genuinely does not model:

```
info  next-server-file     app/api/rows/route.ts is a route file. It is not a page.
info  next-server-surface  app/api/rows/route.ts
info  next-server-surface  middleware.ts
info  next-server-surface  next.config.ts
```

A route handler, middleware and the configuration file run outside the browser
runtime. None becomes a unit and none becomes a route, and each is named as code
this adapter reports rather than understands.

## The untested fixture, and what it says

A project on an older Next and React reports both gaps by name rather than
assuming the reading carries over:

```
warning version-untested  The project declares next ^13.0.0. This adapter was tested against ^15.0.0.
warning version-untested  The project declares react ^18.0.0. This adapter was tested against ^19.0.0.
```

## What the gate compares, precisely

The Next fixture cannot be a byte-for-byte twin of the Vue fixture, because a Next
project cannot exist without a root layout. Removing the layout to make a strict
assertion pass would test a project that is not a Next project, so the gate is
precise instead of strict: the same capabilities as Vue, the same three unit kinds
as Vue, and `layout` as the one named addition. The gate was shown to fail when the
mirror is broken, by removing the network call from the fixture and watching the
comparison name the missing capability.

## Refusing a native project

The refusal is inherited from the React adapter and not re-implemented. A project
that declares `react-native`, a `react-native-*` module or a `@symbiote-native/*`
package yields no candidate. Detection carries candidates and nothing else, so the
refusal is the absence of a candidate, and the reason travels on the inspection
when the adapter is chosen by name.
