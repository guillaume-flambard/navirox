# Lit: the eleventh adapter, and the framework that is mostly the platform

## The question, and the answer

Ten adapters had each answered the same shape of question by this point: what does
this framework add on top of JavaScript, and how much of that does a migration have
to know. Lit answers it differently. A Lit component is not an object the framework
owns, it is a custom element the browser registers, with a shadow root, a tag name
and a native lifecycle.

That sounds like it should force a new concept. It does not. The adapter reads the
class, the registration and the reactive property declarations, keeps the
registration shape and the tag name as adapter metadata, and stops. The App Graph
stays at schema version 1, no shared type gains a field, no neutral package is
touched, and no dependency is added.

## What the documentation says, and why it decides the shape

Three passages from the official documentation decide the reading:

1. **A component is a class plus a registration, and the documentation shows two
   shapes for the registration.** `lit.dev/docs/components/defining` defines a
   component as a class extending `LitElement` registered with the browser, shows
   `@customElement('simple-greeting')`, and then shows the plain JavaScript form
   for projects that do not use decorators: declare the class, then call
   `customElements.define('simple-greeting', SimpleGreeting)`. An adapter that
   checked only one of those would miss half the projects that exist.
2. **There is no store module.** Lit documents `@property` and `@state` as
   reactive properties of an element, and points at context controllers or the
   labs signals package for sharing. Nothing in the framework is imported as a
   store the way `pinia` or `solid-js/store` is, so a `@state` field is private
   to the element that declares it, not application state.
3. **There is no router.** `@lit-labs/router` is a labs package whose own README
   warns that it may receive breaking changes or stop being supported. It is
   configured in code, `new Router(this, [{ path: '/', render }])` or
   `new Routes(this, [...])`, and it has two `RouteConfig` shapes: a `path`
   string, and a `pattern: new URLPattern(...)` object.

A project that never configures the labs router declares no routes at all, and
that is a fact about the project rather than a defect in it.

## What the adapter reads now

| Read                        | Shape                                                              | Where it lands  |
| --------------------------- | ------------------------------------------------------------------ | --------------- |
| Element class               | class extending `LitElement` or `ReactiveElement`                   | unit metadata   |
| Registration                | `@customElement('x')` or `customElements.define('x', C)`            | unit metadata   |
| Reactive properties         | `@property` / `@state`, or the `static properties` block            | unit metadata   |
| Routes                      | `path` string literals in a `Routes` or `Router` configuration      | routes          |
| `URLPattern` routes         | `pattern: new URLPattern(...)`                                      | finding         |
| `enter` callbacks           | a guard that can reject a route                                     | finding         |
| Runtime capabilities        | the shared scanner over source with comments stripped               | capabilities    |
| Production dependencies     | the manifest                                                        | dependencies    |
| A major outside the tested range | the declared range                                             | finding         |

On the mirrored fixture: 7 units (5 components, 2 utilities), 4 routes
(`/`, `/admin`, `/child/*`, `/profile/:id`), the same 5 capabilities the Vue
fixture reports, 2 findings (`lit-route-pattern-object`, `lit-route-enter`), and
2 dependencies.

## Why there is never a state module

The unit kinds are the Vue kinds minus `state-module`. That difference is
deliberate and is asserted in both directions in the gate.

Lit has no module a project imports to create shared state. What it has is a
reactive property on an element, which is a field of that element. Reporting a
class that declares `@state()` as a `state-module` would claim that a piece of
private element state is application state a migration can carry across, which is
exactly the kind of guess the model refuses to make. The property declaration is
recorded as adapter metadata instead, where it is true.

## Why this is the narrowest route reading of the eleven

Every other adapter with routes reads a convention: Next reads `app/` and
`pages/`, Qwik City reads `src/routes`, SvelteKit reads `src/routes`, Astro reads
`src/pages`, Angular and React read a routes file. Lit has no file convention to
read. The adapter therefore scans every source file for a router configuration and
reads the `path` literals inside it, which is narrower in three ways it does not
hide:

- A project with no labs router gets no routes and no finding. Silence here means
  the project declares nothing, not that the adapter failed.
- A `URLPattern` route is a constructed object, not a literal, so it is reported
  as `lit-route-pattern-object` rather than resolved into a pattern the framework
  never wrote down.
- An `enter` guard is control flow the adapter does not model, so it is reported
  as `lit-route-enter`.

## The shared scanner has a word trap

The capability scanner in `packages/source/src/capabilities.ts` matches a bare
`location` as `url-navigation`. A component that binds the router location to a
variable named `location` therefore gains a `url-navigation:unknown` capability it
does not use, once on the binding line and once on each use.

The Qwik change recorded the same trap, and this reading records it again, because
the pattern belongs to the neutral scanner that every adapter shares rather than to
any one framework. It is not fixed here: changing it would change how all eleven
adapters read a word that is genuinely the browser global in some files and a local
variable in others. That decision deserves its own change with its own fixtures
rather than a quiet edit inside an adapter ticket.

Fixed since, by `capability-name-precision`: the `url-navigation` fallback names the
global now, so a local called `location` is no longer read as navigation and only
`window.location` reaches the fallback. The precision its own change asked for is
what that change wrote down.

## What was deliberately not done

- No SSR or hydration reading (`@lit-labs/ssr`).
- No context controllers or signals as units of state.
- No resolution of a `URLPattern` into a canonical path pattern.
- No support for any router other than the labs package.
- No reading of styles, directives or shadow DOM internals.
- No transform, and no change to `@navirox/runtime`, `@navirox/ui` or the
  acceptance app.

## Proof

| Command                                                          | Result                          |
| ---------------------------------------------------------------- | ------------------------------- |
| `corepack pnpm --filter @navirox/source-lit build`               | `tsc --build`, no output        |
| `corepack pnpm --filter @navirox/source-lit test`                | 21 passed (1 file)              |
| `corepack pnpm --filter @navirox/cli test`                       | 85 passed (7 files, eleven adapters registered) |
| `corepack pnpm build` / `typecheck` / `test`                     | 28 / 52 / 51 tasks successful   |
| `corepack pnpm lint` / `format:check` / `deps:check`             | no output / clean / no issues   |
| Detox journey, canary untouched                                  | 4/4 Android, 4/4 iOS            |
