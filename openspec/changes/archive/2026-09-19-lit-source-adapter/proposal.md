## Why

Ten adapters read ten frameworks, and each one has been asked the same question: what does this framework call a component, a piece of state and a route? Lit is the first source where the component is not a framework object at all. A Lit component is a custom element: a class that the browser registers under a tag name, with its own shadow root and its own lifecycle. The framework is thin on purpose, the browser is the runtime, and the reusable unit is the element rather than the module.

That changes two readings. The first is identity. Everywhere else a component is found by what a module exports, by a decorator, or by a compiler directive; here it is found by what the class extends and by the registration it performs, which may be a decorator or a plain call that can sit far from the class. The second is state. Lit documents reactive properties and nothing else: `@property` and `@state` decorate a field, `static properties` declares one, and both belong to the element that owns them. There is no store module to import, and shared state goes through context controllers, which are a composition tool rather than a module. An adapter that assumed a store module would report nothing, and one that read `@state` as shared state would report a private field of an element as if the application shared it.

Routing is the third reading, and it is the narrowest of the ten. Lit ships no router of its own; the labs package documents a router as reactive controllers, configured in code with `path` strings, and plenty of Lit applications have no router at all because the browser already knows how to navigate. So the honest report is that routes come from what a project declares in code, that a route declared as a URLPattern object cannot be read as a string, and that a project with no router is not a project with a missing route table.

## What Changes

- Add `@memolabs-apps/source-lit`, a base source adapter with no composition, depending on `@memolabs-apps/graph`, `@memolabs-apps/source` and `@memolabs-apps/source-react` for the native refusal.
- Detect Lit from its manifest, with evidence, and refuse a project that already declares a native runtime.
- Read a component as the element it registers: a class extending `LitElement` or `ReactiveElement`, registered either by the `@customElement` decorator or by a `customElements.define` call.
- Read reactive property declarations as adapter metadata rather than a unit, and never produce a `state-module`, because Lit documents no such module.
- Read the routes a project declares with the labs router: the `path` strings of `Routes` and `Router` configurations, the parameters they carry, and the trailing wildcard a parent uses to mount a child. Report a URLPattern object, an `enter` callback and any other shape the adapter cannot resolve as findings rather than guessing.
- Read capabilities with the shared scanner, and record the one word trap the shared scanner has already cost, without changing the scanner in this change.
- Add the ninth fixture pair: a mirror fixture of the shared journey and a negative fixture on an untested major.
- Register the adapter at the composition root, which brings the registry to eleven, and extend the gate with a Lit block comparing its report to the Vue one.
- Record what was read in `docs/evidence/`, and say in the README what detection and inspection cover for Lit.

Not in this change: reading Lit server rendering, reading context controllers as shared state, reading signals from the labs package, resolving a route declared as a URLPattern, reading any route table from a framework other than the labs router, and any transform.

## Capabilities

### New Capabilities

- `source-lit`

### Modified Capabilities

None.

## Impact

New package `packages/source-lit` with three workspace dependencies and the two fixtures. One line in the CLI composition root and one dependency entry, which brings the registered adapters to eleven. `packages/cli/src/adapters.test.ts` gains a Lit block. `README.md` and `docs/evidence/`. The App Graph stays at version 1, no shared type changes, no neutral package changes, no runtime, UI, router, build or acceptance application change. No new dependency is added to the workspace. No changeset, because nothing is published yet.
