## Why

The support order the repositioning pack records puts Solid after the frameworks whose
reactivity Navirox already reads, and Solid is the first source whose state is neither a
component tree with hooks nor a store the Vue adapter would recognise: it is fine grained
signals, and its stores are proxies with a path setter. Reading it is the cheapest way to
find out whether the neutral model can describe a reactivity model it has never seen, or
whether it has quietly assumed one.

It is also the second source read through JSX, which is where the model is most tempted to
read the target instead of the source. React taught that lesson. Solid sharpens it, because
Solid has no virtual DOM and no hook rules, so a component is a function that runs once and
returns elements.

## What Changes

- Add `@memolabs-apps/source-solid`, a base adapter that composes nothing.
- Detect Solid from the manifest, and refuse a project that already declares a native
  runtime, because that is what Navirox produces rather than what it reads.
- Read a component by what a module exports, the rule the React adapter holds itself to: a
  function that returns elements.
- Read a store as a state module when the file takes it from `solid-js/store`, covering both
  documented ways to declare one, `createStore` and `createMutable`.
- Read routes from the `path` literals of Solid Router in both shapes the documentation
  gives, the JSX form with a `Route` component and the object form with `defineRoutes` or
  `createRouter`.
- Report what the adapter cannot resolve instead of guessing: a nested route it did not walk,
  a lazily loaded route, and a path that is not a literal.
- Carry capabilities through the neutral scan the other adapters use, and add a fixture pair:
  one project that mirrors the shared journey, and one that declares an untested major.
- Register the adapter at the composition root and extend the cross adapter gate from eight
  adapters to nine.

## Capabilities

### New Capabilities

- `source-solid`: detection, inspection and graph construction for a Solid project.

### Modified Capabilities

None.

## Impact

`packages/source-solid` is new, and it depends only on `@memolabs-apps/graph`, `@memolabs-apps/source`
and `@memolabs-apps/source-react` (the last one for the native declaration check the React, Next
and Astro adapters already share). No package changes its public surface, the App Graph stays
at schema version 1, and no dependency is added to the workspace.

`packages/cli` gains one line at the composition root and one dependency entry, and its cross
adapter gate grows the register assertion and a Solid block. `README.md` gains a package row
and a support matrix row, `docs/evidence/` gains the reading, and `PLAN.md` does not change
since no item of the 0.1 definition of done is affected.

Nothing is published and no changeset is written, which is the established rule while the
packages carry `0.1.0` locally and reach no registry.
