# NX-004 — the published `@symbiote-native/*` builds cannot be loaded by plain Node

Measured 2026-09-17 on this machine (Node 24.21.0, pnpm 11.27.0) against the real
npm registry, not inferred from source.

## What was tested

After `pnpm install` in `/Users/memo/projects/active/apps/navirox`, each entry point
was imported from a bare Node ESM context inside `packages/runtime-symbiote`:

```bash
node --input-type=module -e "import('<entry>').then(()=>console.log('OK')).catch(e=>console.log('FAIL:', e.message))"
```

| Entry point | Plain Node |
|---|---|
| `@symbiote-native/components/host-primitives` | **loads** |
| `@symbiote-native/engine` | fails |
| `@symbiote-native/components/register` | fails |
| `@symbiote-native/vue` | fails |

All four failures are the same error:

```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import
'.../@symbiote-native/components/build/behaviors/activity-indicator' is not supported
resolving ES modules imported from '.../@symbiote-native/components/build/register.js'
```

## Cause

The published ESM is compiled with extensionless relative imports that resolve to a
**directory** containing an `index.js` (`./behaviors/activity-indicator` →
`activity-indicator/index.js`). Metro and Vite both perform directory/index
resolution. Node's ESM resolver does not, by specification, and rejects the import
rather than guessing. This is a property of the published build, not of the workspace
link — the failing file is inside `node_modules/.pnpm/`.

`host-primitives.cjs` is the exception because it is a hand-written, data-only
CommonJS file with no relative imports at all.

## Why it matters to Navirox

Two consequences, both encoded in the code:

1. **The package barrel must stay host-free.** `@navirox/compat` and `navirox doctor`
   need to read `runtime.json` from plain Node. If `src/index.ts` imported the
   renderer, that read would fail. The renderer import therefore lives in
   `src/bootstrap.ts` alone, published as the `./bootstrap` subpath, and the barrel
   imports nothing from `@symbiote-native/*`. `src/index.test.ts` asserts this
   statically, and `src/import-boundary.test.ts` asserts it across the workspace.

2. **The renderer is injected, not imported, by the logic.** `createRuntimeFromHost`
   in `src/symbiote-runtime.ts` takes a `SymbioteHost` (the tag table, a
   `registerComponent`, a `setAppConfigurator`, an engine version). Every decision
   Navirox makes about mounting, capability reporting, screen registration and module
   reporting is therefore covered by ordinary Node tests, and the untestable part is
   reduced to a ~15-line shell that only forwards real functions.

   A side benefit: this is the same shape the seam already uses for components, where
   the caller supplies the host table. Injecting the implementation is the pattern the
   whole architecture is built on, so the constraint pushed toward the design rather
   than away from it.

## Consequence for verification

`runtime.json`'s `verified.ios` and `verified.android` stay `null` until
`examples/vue-basic` renders on each platform. Nothing in NX-004 has been observed
rendering through Metro yet; what was verified here is resolution, version agreement
and the seam contract, which is a different and smaller claim.

## Reproducing the resolution check

The unit test resolves each pinned package without loading it, walking up from its
entry point to the `package.json` that names it — necessary because several upstream
packages expose no `./package.json` subpath. `require.resolve(name)` succeeds for all
of them, so the dependency graph is sound even where the runtime import is not.
