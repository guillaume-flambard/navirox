# NX-005 — the Metro preset is ESM and a Metro config is CJS

Measured 2026-09-17 on this machine (Node 24.21.0, pnpm 11.27.0), against the real
module graph, not inferred from documentation.

## The dependency being verified

`@memolabs-apps/metro-preset` is ESM (`"type": "module"`, `dist/index.js`). A Navirox app's
`metro.config.js` is CommonJS, because that is what Metro loads. The preset is therefore
reached through Node's `require(esm)` support, which was unflagged in Node 22.12 and is
stable from 22.13. Navirox's own `engines.node` floor is `>=22.13.0`, so the dependency
is inside contract rather than a lucky accident of this machine.

This matters because the whole point of NX-005 is that an app needs one line of Metro
config. If `require` could not load the preset, the app would need a build step, a
wrapper file, or a duplicate of the preset in CJS, and the one-line promise would be
false.

## What was tested

From `packages/metro-preset`, in a CommonJS context:

```bash
node --input-type=commonjs -e "
const m = require('@memolabs-apps/metro-preset');
console.log('exports:', Object.keys(m).sort().join(', '));
const c = m.withNavirox({ resolver: { sourceExts: ['js','ts'] } });
console.log('sourceExts:', c.resolver.sourceExts.join(','));
console.log('transformer:', c.transformer.babelTransformerPath);
console.log('transformer exists:', require('node:fs').existsSync(c.transformer.babelTransformerPath));
"
```

Observed, verbatim:

```
exports: NAVIROX_SOURCE_EXTENSIONS, PACKAGE_NAME, PACKAGE_ROLE, createNaviroxConfig, withNavirox
sourceExts: js,ts,vue,css,scss,sass,less,styl
transformer: /Users/memo/projects/active/apps/navirox/node_modules/.pnpm/@symbiote-native+vue@2.0.0_.../node_modules/@symbiote-native/vue/metro-vue-transformer.cjs
transformer exists: true
```

## What that proves

Three things at once, none of which the source alone could establish:

1. **CJS loads the ESM preset.** All five value exports arrive, including the two
   functions an app calls.
2. **The extension merge works through the real module graph.** `['js','ts']` in, the
   six Navirox extensions appended in a stable order out.
3. **The pin is what runs.** `symbioteVueTransformerPath()` resolves across a package
   boundary into the `@symbiote-native/vue@2.0.0` copy that
   `@memolabs-apps/runtime-symbiote` pins, inside `node_modules/.pnpm/`, and the resolved file
   exists. The transformer an app runs is the one the adapter was built against, not a
   hoisted or independently resolved stranger. This is the exact-pin rule paying off
   at build time rather than only at install time.

The resolution happens from the adapter's own tree (`createRequire(import.meta.url)` in
`packages/runtime-symbiote/src/build-integration.ts`), which is what makes point 3 true.

## Why the preset does not name the renderer

`PLAN.md` line 180 states the hard rule: the toolchain plane must not import Symbiote,
only the runtime layer may. The preset sits in the toolchain plane, so it cannot name
`@memolabs-apps/runtime-symbiote`'s transformer specifier, let alone a `@symbiote-native/*`
one.

The resolution is that **the adapter declares its build-time requirements and the preset
asks the adapter**: the transformer specifier and the source extensions live in
`build-integration.ts` on the adapter side, and the preset imports them. The hard rule
holds, the exact pin lives in exactly one place, and a second runtime becomes an option
(`transformerPath`) instead of a second preset.

This adds an edge, `metro-preset -> runtime-symbiote`, which is not in the PLAN section 7
dependency graph. Recorded here as an intentional addition, not an oversight.

## Reproducing the check

Any package in the workspace can run the snippet above. It needs no native toolchain and
no simulator, because it exercises resolution only: the transformer file is located and
statted, never executed.

## Open loose end found while investigating

`@types/node@26.6.1` declares an unmet `undici-types` dependency. Compiling its
`index.d.ts` with `--skipLibCheck false` reports `Cannot find module 'undici-types'` from
`http.d.ts`, `web-globals/fetch.d.ts` and `worker_threads.d.ts`. This is not currently
blocking, because `skipLibCheck` is on, but it means a future change that disables
`skipLibCheck` will fail for reasons unrelated to Navirox code. Not fixed here; recorded
so the failure is recognisable when it appears.
