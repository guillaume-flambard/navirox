## 1. Add the plugin to the preset

- [x] 1.1 Write `packages/metro-preset/src/fast-refresh.ts` exporting `withVueFastRefresh`, a Babel plugin factory that activates only on a filename ending in `.vue.tsx`, hoists the default export declaration into a const, stamps it with a file-derived `__hmrId`, registers it with `__VUE_HMR_RUNTIME__` behind a `typeof` guard, declares the module a hot boundary with `module.hot.accept`, and re-exports the const. The plugin takes `types` from Babel rather than importing `@babel/types`. Verify with `corepack pnpm --filter @navirox/metro-preset build`.
- [x] 1.2 Export `withVueFastRefresh` (and the plugin's name constant) from `packages/metro-preset/src/index.ts` so an application reaches it from the package it already depends on. Verify with `corepack pnpm --filter @navirox/metro-preset build` and by reading the emitted `dist/index.d.ts`.
- [x] 1.3 Add `@babel/core` to `packages/metro-preset` as a devDependency and write `packages/metro-preset/src/fast-refresh.test.ts`: the plugin emits the id stamp, the registration and the accept callback for a `.vue.tsx` filename; it leaves a `.tsx` filename untouched; it leaves a module with no default export untouched; two transforms of the same path produce the same id and two different paths produce different ids; the emitted default export is still the component and the original statements are preserved. Verify with `corepack pnpm --filter @navirox/metro-preset test`.
- [x] 1.4 Confirm the plugin is inert without the runtimes by asserting on the emitted source rather than by running it: the registration and the accept call are both behind `typeof` guards, and no `process.env` branch appears in the emitted code. Verify by reading the test's expected output and by `grep -c 'process.env' packages/metro-preset/src/fast-refresh.ts` returning 0.

## 2. Enable it in the applications

- [x] 2.1 `examples/vue-basic/babel.config.js` takes `withVueFastRefresh` from `@navirox/metro-preset` and adds it to `plugins`, next to the existing local plugin, with a comment saying what the plugin does and why the file it matches is a re-labeled `.vue` rather than a `.vue`. Verify with `corepack pnpm --filter vue-basic lint` and by reading the file.
- [x] 2.2 The same change in `packages/create-navirox/template/babel.config.js`, so a scaffolded application gets it too. Verify that the two files differ only in the parts they already differed in, and that `corepack pnpm build` still produces `packages/create-navirox/dist/bin.js`.

## 3. Prove it inside the real pipeline

- [x] 3.1 Bundle the example through Metro in development mode (`corepack pnpm --filter vue-basic exec react-native bundle --platform android --dev true --entry-file index.js --bundle-output <tmp>/navirox-hmr.bundle`) and confirm the output contains the registration and the file-derived id. This is the proof that the plugin ran in the real transformation pipeline and not only under `@babel/core` in a test.
- [x] 3.2 Run the example on a device with the development server, record the counter and the history, edit a child component (`examples/vue-basic/components/CounterReadout.vue`), and read the screen again: the application must not restart and the store values must be the ones it held before the edit. Capture the exact readouts in both states, and capture the development server's log lines for the update. Then restore the file to its committed content and confirm `git diff` on it is empty.
- [x] 3.3 Repeat the edit against the root component (`examples/vue-basic/App.vue`) and record whether the application restarts. The expectation is that it does not, because the runtime reloads a root component through the app context.

## 4. Verify and close

- [x] 4.1 The full gate passes at the root: `corepack pnpm build`, `typecheck`, `test`, `lint`, `format:check`, `deps:check`. Record each result.
- [x] 4.2 The shared Detox journey still passes 4 out of 4 on both platforms, against the untouched canary, with no Metro left running beforehand. Record both results.
- [x] 4.3 `PLAN.md`: the Fast Refresh item of the 0.1 definition of done (§10, line 627) is checked, with sub-bullets that record what was measured rather than what was assumed: the mechanism, the two runtimes that have to be present, the identifier rule, that a store edit still reloads, and the proof. Record the exact lines added.
- [x] 4.4 `openspec validate vue-fast-refresh --strict` reports the change valid, then archive it, commit, push `main`, and read the run on `main` to confirm the five jobs are green. Do not call the run green without having read it.
