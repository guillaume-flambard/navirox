# React: the framework the target also uses

This records the answer to the question the change exists for, rather than a
description of the change. Every other adapter reads a framework the target does
not use. React is the renderer Navirox builds on, React Native is React, and the
identifiers in the App Graph are written in React's language, so an adapter for a
web React application is the sharpest available test of the boundary the
architecture depends on.

## The question, and the answer

**Did the proximity to the target leak into the model, or did reading React need
anything new?**

Neither. No new node kind, no shared concept, no rewrite of a neutral package, and
the App Graph is still schema version 1. The cross-adapter gate holds the React
report and the Vue report to the same shape: the same node collections, the same
unit kinds, the same keys on a unit node, the same dependency keys, and the same
capability vocabulary.

The gate was shown to fail when the mirror is broken, by removing the network call
from the React fixture and watching the comparison name the missing capability.

## Where the proximity was handled, deliberately

Two decisions exist because of it, and both are the adapter's rather than the
core's.

**Detection refuses a native project.** A React Native application is what Navirox
produces, not what it reads. A project that declares `react-native`, a
`react-native-*` module or a `@symbiote-native/*` package yields no candidate, so
the tool cannot be pointed at a target and asked to read it as a source. Detection
carries candidates and nothing else, so the refusal is the absence of a candidate;
the reason is carried by the inspection, which names the native dependency as a
finding when the adapter is chosen by name.

**A native dependency in a web project is a finding.** A web application that
reaches the target's own packages is a migration question rather than a plain
reading, and the report says which dependency caused it. This is the one place
where the proximity the architecture warns about becomes visible to a user instead
of staying a rule in a document.

## What is read, on the mirrored fixture

```
components:   App, Counter, List, NameInput, Profile      (found by what a module exports)
state module: src/stores/counter.ts                        (a declared store, not an import)
utilities:    src/lib/api.ts, src/lib/storage.ts
capabilities: geolocation:invoke, local-storage:read, local-storage:unknown,
              local-storage:write, network-request:invoke
routes:       /, /about, /blog/:slug
```

A file named `NotAComponent.tsx` that exports a string is not a component, which
is the assertion that keeps the reading about exports rather than about names. A
class component is reported as a component and a finding, because the adapter reads
the function era and saying nothing would imply the class had been understood.

## One thing that changed in every adapter

Capability use is now read only from the files a reading is about: a component file
or an application module. A build configuration or an entry point that touches the
document is not a capability the application uses, and reporting it put a fact in
the report that named no unit. The React fixture's entry file is what exposed it;
the rule now applies to the Vue, Svelte and Angular adapters too, and their
readings did not change because none of their entry files used a capability.

## What this does not prove

- No real React project was inspected. There is none on this machine, and the
  evidence rests on a fixture written to mirror the others.
- JSX is not parsed. Component and capability discovery are textual over
  comment-stripped source, so a capability used only inside JSX is not in the
  reading. Stated as a limit rather than solved.
- Next.js, Remix and the React Router data APIs are out of scope, as are class
  component lifecycles, server components and concurrent features.
- The route reading duplicates the Angular one on purpose. Two copies is the point
  at which the previous changes moved a helper into the neutral core, and leaving
  it duplicated here is a recorded exception: the third adapter that needs it
  should move it.
