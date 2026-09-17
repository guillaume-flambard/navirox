/**
 * What the Navirox build tooling has to know about this runtime.
 *
 * These are BUILD-time facts, not runtime ones: Metro needs to know which
 * transformer compiles a `.vue` file and which extensions its resolver must
 * accept. They live here, in the adapter, rather than in `@navirox/metro-preset`
 * on purpose.
 *
 * The preset is part of the toolchain plane, and the project's hard rule is that
 * the toolchain plane never names the renderer: only this package may. So the
 * preset asks the adapter where the Vue transformer is instead of hard-coding
 * `@symbiote-native/vue/...` itself. Two things fall out of that: the exact pin
 * stays in one place, and a second runtime becomes a preset option rather than a
 * preset fork.
 *
 * Nothing here imports the renderer — a module *specifier* is a string, and
 * `symbioteVueTransformerPath` only resolves it to a path. So this file, and the
 * barrel that re-exports it, stay loadable from plain Node.
 */

import { createRequire } from 'node:module'

/**
 * The Metro transformer that compiles a Vue SFC, and each style extension it
 * supports, into something this runtime's renderer can mount.
 */
export const SYMBIOTE_VUE_TRANSFORMER = '@symbiote-native/vue/metro-vue-transformer'

/**
 * Source extensions that transformer accepts, on top of Metro's defaults: `vue`
 * plus the five style languages `@symbiote-native/css-parser` compiles
 * (plain CSS, CSS Modules, SCSS/Sass, Less, Stylus).
 */
export const SYMBIOTE_SOURCE_EXTENSIONS: readonly string[] = [
  'vue',
  'css',
  'scss',
  'sass',
  'less',
  'styl',
]

/**
 * Absolute path to the Vue SFC transformer, for `transformer.babelTransformerPath`.
 *
 * Resolved from THIS package's tree rather than the app's, which is deliberate:
 * the adapter pins `@symbiote-native/*` exactly, so the transformer an app runs is
 * always the one the adapter was built and verified against. Metro accepts an
 * absolute path, and the path is inside the installed dependency tree.
 *
 * Throws an actionable message rather than letting Metro fail later with a
 * confusing "Cannot find module".
 */
export function symbioteVueTransformerPath(): string {
  const resolver = createRequire(import.meta.url)
  try {
    return resolver.resolve(SYMBIOTE_VUE_TRANSFORMER)
  } catch {
    throw new Error(
      `Navirox could not resolve the Vue transformer "${SYMBIOTE_VUE_TRANSFORMER}". ` +
        'It ships with @symbiote-native/vue, which is a dependency of ' +
        '@navirox/runtime-symbiote and therefore of any app that installs a Navirox runtime. ' +
        'If you are resolving this outside an installed app, install the runtime package first.',
    )
  }
}
