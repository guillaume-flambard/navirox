## Context

Ten adapters read ten frameworks, and every one of them has answered the same question in its own way. Angular answered that the structure comes from decorators. React answered that the component comes from what a module exports and that proximity to the target has to be refused out loud. Solid answered that a third reactivity model does not move the model. Qwik answered that a component can be a boundary rather than a function, and that a framework with no store module produces no `state-module`.

Lit is the eleventh, and it asks a question none of the others asked: what if the component is not a framework object at all? Lit is a thin layer over the platform. A component is a custom element, which is a class the browser registers under a tag name, with a shadow root and a native lifecycle. The documentation says so in one line: define a class extending `LitElement` and register it with the browser, using either the `@customElement` decorator or a direct `customElements.define` call. There is no compiler, no template language, and no file convention that the framework reads.

Three measured facts decide the shape of this adapter.

The first is registration. Because registration can be a decorator or a plain call, and because the call can live anywhere in the module (or even in another module, in application code that registers a class it imported), the only reading that is both simple and honest is the class itself: a class extending `LitElement` or `ReactiveElement` is a component, and the tag name is whatever the registration gives it. Reading only the decorator would miss the documented JavaScript form; reading only `customElements.define` would miss the common TypeScript form.

The second is state. Lit documents reactive properties, decorated with `@property` or `@state`, or declared in a `static properties` block. Both are fields of the element that declares them. The documentation for shared state points at context controllers, which are composition rather than a store module, and at the signals package, which is in labs. None of the ten previous adapters had to report the absence of a store concept; Qwik came closest, and its answer applies here as well: a private field of an element is not shared application state, and reporting it as a `state-module` would be a false claim about the architecture of the project.

The third is routing, and it is the weakest of the ten. Lit ships no router. The labs router is a reactive controller configured in code with `path` strings, and its own README warns that the package may change or stop being supported. Many Lit applications have no router at all, because the browser navigates. So the route table is whatever the project declares, and anything the adapter cannot resolve has to be a finding rather than a guess.

## Goals / Non-Goals

**Goals:**

- Read a project that declares Lit, with evidence from its manifest, and refuse a project that is already aimed at the native runtime.
- Read a component as the class the browser registers, in both documented registration forms, and read the tag name where the registration gives one.
- Keep reactive property declarations as adapter metadata, and produce no `state-module` unit, because Lit documents no store module to read.
- Read the routes a project declares with the labs router from the `path` strings in `Routes` and `Router` configurations, including parameters and the trailing wildcard a parent uses to mount a child.
- Report a `URLPattern` route, an `enter` callback and any unresolvable route shape as findings, and report that a project with no router declares no routes rather than that its table is missing.
- Read capabilities with the shared scanner.
- Keep the App Graph at version 1 and every shared type unchanged, and keep the mirror fixture comparable to the Vue fixture.

**Non-Goals:**

- Reading Lit server rendering, hydration or `@lit-labs/ssr`.
- Reading context controllers, the signals package or any shared state mechanism as a unit of its own.
- Resolving a route declared as a `URLPattern` object into a path pattern.
- Reading a route table from any router other than the labs package, and reading the router the labs package documents as "not implemented", such as named-route navigation.
- Reading styles, directives, or the shadow DOM boundary as anything other than text in a file.
- Any transform, any migration, and any change to the runtime, the UI, the router, the build tooling or the acceptance application.

## Decisions

**The adapter is a base adapter, not a composer.** It depends on `@memolabs-apps/source-react` only for the native refusal, which is imported rather than written a fifth time. There is no framework for it to compose: Lit is the framework, and its components are custom elements rather than another adapter's components. Rejected: a `source-lit` that composes a hypothetical `source-custom-elements`, which would be a package that exists only to be composed.

**A component is a class extending `LitElement` or `ReactiveElement`.** The declaration also records whether the class registers itself with the `@customElement` decorator or with a `customElements.define` call, plus whether it declares a reactive property, and whether the tag name could be read. Rejected: reading only the decorator (misses the documented JavaScript form) and reading only `customElements.define` (misses the common TypeScript form). Rejected: treating any class that calls `customElements.define` as a component, which would report a registration site rather than the element it registers.

**Reactive property declarations are metadata and never a unit.** The unit kind set stays the one the graph already has (`component`, `utility`, `layout`, `state-module`, and the rest), and the adapter produces `component` for an element and `utility` for an application module that is not one. Rejected: a `state-module` for a class that declares `@state`, which would claim a module the framework does not have, and rejected: a metadata-free component, which would lose the only state information the framework provides.

**Routes come from the labs router, read from code.** The adapter reads the `path` strings of `Routes` and `Router` configurations, converts `:name` segments to parameters, and keeps a trailing wildcard as the fact that the parent mounts a child. A route declared with `pattern: new URLPattern({...})` cannot be read as a string and becomes a finding. An `enter` callback is a fact the adapter does not resolve and becomes a finding. Rejected: inferring routes from the file layout, because Lit documents no file convention and a directory structure would be a convention of one project; rejected: ignoring the router entirely, which would report a routable application as having no routes.

**A project with no router is reported as such and not as a defect.** An application that never calls the labs router produces no routes and no finding. Rejected: a finding per project, which would turn a legitimate architecture into a warning; the fixture negative for the untested major covers the version rule instead.

**The version range is declared as `^3.0.0`.** The measured `lit` release is 3.3.3 and the 2.x line predates the current decorator story, so a project on 2.x is reported as an untested major rather than assumed supported.

**The shared scanner keeps its word trap.** The scanner reads a bare `location` as a url navigation capability, which the Qwik change already paid for and recorded. This change does not alter the scanner, because changing it would change the reading for all ten frameworks and is a change of its own; the fixture avoids binding a variable named `location`, and the trap is recorded again in the evidence.

**No shared contract changes, App Graph stays at version 1.** The four contract questions of the agent guide all answer the same way as the Solid and Qwik changes: the current contract is sufficient (`detect`, `inspect`, `buildGraph`, the metadata field, and the unit kinds cover everything Lit needs), the real adapter that demonstrated the need is this one, adapter metadata is enough because a reactive property is a fact about one file, and no schema version changes.

## Risks / Trade-offs

- **The component reading is textual.** A class built by a factory, or an element registered from a module that imports the class, is reported as the module it lives in rather than as an element. The mitigation is that the two documented registration forms are the readings, and a file that only registers another module's class is reported as a utility that calls `customElements.define`, which is the honest reading of that file.
- **The route reading is the narrowest of the ten and it knows it.** A project using another router, or no router, gets no routes. The mitigation is that the finding names the shape it could not read, and that the acceptance fixture for Lit is not required to be a strict twin of the Vue fixture in its route set.
- **The report differs from the Vue report by one kind.** Lit produces no `state-module`, and the gate names that difference rather than smoothing it, exactly as the Qwik gate does. A second kind difference appears if the Lit fixture has no layout, since Lit documents no layout contract either; the gate asserts the named difference in both directions.
- **`@lit-labs/router` is a labs package** that may change or stop being supported. The version is pinned in the fixture and declared as tested; the alternative would be to claim support for a router the adapter has never read, which is worse.
- **The word trap of the shared scanner** costs this adapter one fixture detail. It is recorded in the evidence and left for its own change.

## Open Questions

- Should a project that declares `lit-element` alone (the 2.x package) be detected as Lit, or refused as an untested major? The current reading treats `lit` as the framework name and reports a project on the old package by version, which is a decision to revisit when a project is actually seen on it.
- Should a context controller that publishes a value become a shared-state unit, once a migration decision needs it? The signal is recorded here as metadata only.
- Should the labs router be scoped into its own adapter if it ever becomes the documented default, the way Qwik City is treated as part of Qwik today? The answer waits for evidence.
