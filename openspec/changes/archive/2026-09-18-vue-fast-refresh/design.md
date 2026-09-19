## Context

The Vue transform in this repository is upstream's, reached through `@memolabs-apps/runtime-symbiote`'s build facts: `withNavirox` sets `transformer.babelTransformerPath` to `@symbiote-native/vue/metro-vue-transformer`, and that transformer compiles the SFC and then re-labels the result as `<file>.vue.tsx` before handing it to React Native's own Babel transformer. Editing a component therefore produces a new module, but nothing tells the running application that only one component changed, so Metro falls through to its full reload path, the surface stops and re-mounts, the app is created again and the Pinia store is constructed again.

Facts measured before designing, all from source rather than memory:

- `@vue/runtime-core` 3.5.43 defines `__VUE_HMR_RUNTIME__` on the global inside `if (process.env.NODE_ENV !== "production")`, with `createRecord(id, initialDef)`, `rerender(id, newRender)` and `reload(id, newComp)`. The production build has none of it.
- `mountComponent` calls `registerHMR(instance)` when `instance.type.__hmrId` is set, so a component that stamps its definition is tracked automatically, and `reload` with no prior record returns silently. That is why the registration has to happen while the module is evaluated.
- `createApp`'s `mount` sets `context.reload` in development, so a root component reloads through the app context instead of falling to `window.location.reload()`, which does not exist here.
- `@symbiote-native/vue`'s `render.js` mounts with `app.mount(surface)`, and its `RN$stopSurface` global calls `unmount`, which unmounts the app. That is the path the current full reload takes.
- Metro's `runUpdatedModule` re-executes the module body and then calls the accept callback, with no argument, and the callback that runs is the one registered by the newly evaluated module. `import.meta.hot` does not exist here; `module.hot.accept(callback)` is the shape.
- Upstream's transformer exports `compileSfc` and appends `.tsx` to `.vue` filenames, and contains no HMR wiring at all.
- The example's `babel.config.js` already carries a local plugin, `inlineDebugFlag`, which proves that a plugin named in the app's Babel configuration runs over every transformed module.

## Goals / Non-Goals

**Goals:**

- Editing a single file component updates the running application in place: no unmount, no store reconstruction, no full bundle reload.
- The mechanism lives in `@memolabs-apps/metro-preset`, the package that already owns the Vue build integration, and is enabled from the application's Babel configuration.
- The injected code is inert wherever Metro's hot runtime or Vue's development HMR runtime is absent, with no flag and no conditional in application code.
- The behaviour is provable twice: a unit test on the transform, and the registration's presence in a real Metro bundle.

**Non-Goals:**

- Hot updates for a changed store module, or for any module that is not a component. A store edit keeps full-reloading, and the definition of done does not claim otherwise.
- Writing a Metro transformer in place of the upstream one, or re-implementing `compileSfc` and the React Native hand-off.
- Touching the runtime seam, the source seam, the CLI or any published package's runtime dependencies.
- Preserving component-local state across an update. Vue's `reload` replaces the definition; only state that lives outside the component survives, which is exactly what the definition of done measures.

## Decisions

**A Babel plugin rather than a Metro transformer.** The transformer path would mean shipping a CommonJS entry from a `type: module` package, re-implementing the `compileSfc` call and the `.tsx` re-label, and owning the upstream cache key. A plugin named in the app's Babel configuration gets the compiled module for free, runs on exactly the files the transformer produced, is testable with `@babel/core` and vitest without starting Metro, and is the same shape `react-refresh/babel` takes for the other renderer. The repository already contains a plugin of this kind, so the pattern is not new here. Rejected: extending `withNavirox` to wrap `babelTransformerPath` in a Navirox `.cjs`, which would put a CommonJS artifact and the upstream transformer's internals inside the preset.

**The plugin detects the re-labeled filename, not the original one.** Upstream hands the compiled source on as `<file>.vue.tsx`, so the plugin activates on that suffix. Matching `.vue` alone would not fire, because the file Babel sees at that point is no longer a `.vue` file.

**The identifier is the absolute path of the source file without the re-label suffix, normalized to forward slashes.** It is stable across edits of the same file, distinct between files, and needs no registry. This is the choice `@vitejs/plugin-vue` makes, and it makes `__hmrId` meaningful in a log line. Rejected: a content hash, which would change on every edit and defeat the record; and a counter, which would not survive a process restart.

**The registration is a single generated block at the end of the module, with the default export rewritten to point at it.** The declaration is hoisted into a const, stamped, registered, and re-exported, which handles both shapes the upstream compiler emits (`export default _defineComponent({...})` and, with CSS modules, `export default <component>;`). Rejected: a per-component wrapper function, which would change the component's identity and break `reload`'s comparison.

**The guard is `typeof` on both the hot runtime and the framework runtime, and nothing else.** `module.hot` does not exist outside Metro's development bundle and `__VUE_HMR_RUNTIME__` does not exist outside the framework's development build, so the two checks are the whole condition and no `process.env.NODE_ENV` branch is needed. Rejected: a build-time flag in the plugin, which would put a Navirox-specific mode switch into application configuration that the next renderer would have to understand.

**Contract answers (AGENT-GUIDE section 12).** The shared contract is insufficient: no. `withNavirox` and `NaviroxMetroOptions` are untouched, and the new surface is one additional export from the same package. Which real integration demonstrated the need: the Vue build integration this repository already owns. Is adapter metadata enough: yes, the whole mechanism is build-side and no application API is added. Does the schema version change: not applicable, the App Graph and the runtime seam are untouched.

**No changeset.** The only dependency added is a devDependency of `@memolabs-apps/metro-preset`, nothing published gains a runtime dependency, and every package stays at 0.0.0, consistent with the previous changes.

## Risks / Trade-offs

- The registration depends on an upstream filename detail (`.vue.tsx`). If a future upstream stops re-labelling, the plugin silently stops firing and the full reload returns. Mitigation: the bundle assertion in `tasks.md` fails when the registration is absent from a real development bundle, and the plugin's own test pins the suffix it activates on.
- Vue's `reload` extends the old definition with the new one and deletes keys the new one lacks. A component whose shape changes in a way the running instance cannot express will re-render from the new definition with the old instance behind it. This is Vue's own HMR contract and its documented behaviour, and the alternative is the full reload this change replaces.
- Editing the root component takes the `appContext.reload` branch instead of the `instance.parent.update()` branch, which is a different code path from an edit to a child. Both are exercised in the manual proof, and the child case is the one the definition of done measures.
- The plugin runs over every transformed module and returns immediately for all but the components. The cost is one `endsWith` per file.

## Open Questions

- Should a changed style block alone take the `rerender` path, which exists in the runtime and would be cheaper than a definition reload? Nothing measures the difference yet, and the definition of done does not ask for it.
- Should a changed store module eventually become a hot boundary of its own? That is a different mechanism (the store's own module would have to accept, and Pinia would have to be asked to keep the active instance), and it is deliberately out of this change.
