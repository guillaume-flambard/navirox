## Why

Editing a single file component today tears the whole application down. Metro rebuilds and the surface is stopped and re-mounted, so the Pinia store is constructed again and every value in it is lost. The measured before and after of one edit: the counter read `3`, `doubled: 6`, `recent: 1, 2, 3`, and then `0`, `0` with no `recent` line at all. Metro logged no `hmr`, `accept` or `reload` line, only a second full `BUNDLE ./index.js`. Nothing wires the Vue transform to Vue's own HMR runtime, so Vue never gets the chance to swap a component definition in place.

The runtime side already exists and needs nothing from us: vue 3.5.43 ships the HMR runtime in its development build only, `__VUE_HMR_RUNTIME__` is on the global, and any component whose definition carries `__hmrId` is tracked automatically, including a root component, because `createApp` sets `appContext.reload` in development. What is missing is the other half: the compiled module has to register itself and declare itself a Metro hot boundary.

## What Changes

- `@navirox/metro-preset` gains a Babel plugin, `withVueFastRefresh`, that recognizes a compiled single file component (the upstream transformer re-labels `.vue` output as `.vue.tsx`) and rewrites its default export to carry a stable `__hmrId`, register it with `__VUE_HMR_RUNTIME__`, and accept its own Metro update by calling `reload` with the newly evaluated component.
- `examples/vue-basic/babel.config.js` and `packages/create-navirox/template/babel.config.js` enable the plugin, next to the existing local plugin that already proves the pattern.
- The injected code is inert wherever the development runtime is absent, so no application flag and no build conditional is introduced.

Not in this change: hot updates for a changed store module or any other module that is not a component (a store edit stays a full reload, which the definition of done does not claim), and hot updates for a style block change taken on its own.

## Capabilities

### New Capabilities

- `vue-fast-refresh`: the development-time registration that lets an edit to a single file component update the running application in place, through Vue's own HMR runtime, instead of restarting it.

### Modified Capabilities

None. No existing requirement changes: the runtime seam and the source seam are untouched, and the behaviour of a production build is unchanged.

## Impact

- `packages/metro-preset`: new plugin module, its tests, the new export, and `@babel/core` as a devDependency for the unit tests.
- `examples/vue-basic` and `packages/create-navirox/template`: one import and one plugin entry each in `babel.config.js`.
- `PLAN.md`: the Fast Refresh item of the 0.1 definition of done is closed with its measurement.
- Nothing in `packages/source*`, `packages/runtime*` or the CLI. No new runtime dependency of any published package, and no changeset: the only dependency added is a devDependency, and nothing Navirox ships at runtime changes.
