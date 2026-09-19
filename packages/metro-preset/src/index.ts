import { createRequire } from 'node:module'
import { join } from 'node:path'
import {
  SYMBIOTE_SOURCE_EXTENSIONS,
  symbioteVueTransformerPath,
} from '@memolabs-apps/runtime-symbiote'

/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@memolabs-apps/metro-preset'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The Navirox Metro preset: the Vue SFC transform and the CSS parser, composed.'

/**
 * The extensions this preset adds to Metro's resolver, in order.
 *
 * Re-exported under a Navirox name so a `metro.config.js` author never has to
 * spell a renderer package to introspect the preset.
 */
export const NAVIROX_SOURCE_EXTENSIONS: readonly string[] = SYMBIOTE_SOURCE_EXTENSIONS

/**
 * Fast Refresh for single file components, as a Babel plugin an app names in its
 * own `babel.config.js`.
 *
 * It is not part of `withNavirox`, because it is a Babel plugin and not a Metro
 * one: the SFC transform is already upstream's, and the plugin runs on what that
 * transform produced. See `fast-refresh.ts` for what it generates and why.
 */
export { VUE_FAST_REFRESH_PLUGIN_NAME, fastRefreshId, withVueFastRefresh } from './fast-refresh.js'

/** The Metro config helper every React Native app already has installed. */
const RN_METRO_CONFIG_SPECIFIER = '@react-native/metro-config'

/**
 * The shape of the parts of a Metro config this preset touches.
 *
 * Structural on purpose: the preset must not depend on `metro-config`'s types, or
 * it would drag Metro's type graph into every consumer and pin us to one Metro
 * version. Anything else on the object is passed through untouched.
 */
export interface NaviroxMetroConfig {
  transformer?: { babelTransformerPath?: string; [key: string]: unknown }
  resolver?: { sourceExts?: readonly string[]; [key: string]: unknown }
  [key: string]: unknown
}

export interface NaviroxMetroOptions {
  /**
   * Absolute path to the Vue SFC transformer. Defaults to the one the installed
   * runtime adapter declares, which is the one it was verified against.
   */
  transformerPath?: string
  /** Extra source extensions, appended after the Navirox defaults. */
  sourceExts?: readonly string[]
  /** Project root, for `createNaviroxConfig`. Defaults to `process.cwd()`. */
  projectRoot?: string
}

/**
 * One call to make Metro compile a Navirox app.
 *
 * A Navirox app's `metro.config.js` is:
 *
 * ```js
 * const { createNaviroxConfig } = require('@memolabs-apps/metro-preset')
 * module.exports = createNaviroxConfig()
 * ```
 *
 * What that actually does, and why it is needed:
 *
 * - A `.vue` file is not JavaScript, and Metro has no Vue plugin. (unplugin-vue
 *   ships Vite, webpack, esbuild and Rollup adapters — not Metro.) So
 *   `transformer.babelTransformerPath` is pointed at the Vue SFC transformer,
 *   which compiles the SFC with `@vue/compiler-sfc` and hands the result to
 *   React Native's Babel preset, and the resolver is taught the six extensions
 *   that transformer accepts.
 * - The same transformer also turns each style extension into a module, so
 *   `<style scoped>`, CSS Modules, SCSS/Sass, Less and Stylus all resolve with
 *   no second transform.
 *
 * The collision this exists to avoid: the `expo` meta-package ships its own Metro
 * config and its own Babel preset. Putting both in the pipeline leaves two
 * configs and two presets competing, and the Vue SFC transform loses. Navirox
 * therefore never depends on `expo`; the supported Expo path is
 * `expo-modules-core` packages, wired per app.
 *
 * The transformer path comes from the runtime adapter, not from this package: the
 * toolchain plane is not allowed to name the renderer. A different runtime is then
 * a `transformerPath` option rather than a fork of this preset.
 */
export function withNavirox(
  config: NaviroxMetroConfig = {},
  options: NaviroxMetroOptions = {},
): NaviroxMetroConfig {
  return {
    ...config,
    transformer: {
      ...config.transformer,
      babelTransformerPath: options.transformerPath ?? symbioteVueTransformerPath(),
    },
    resolver: {
      ...config.resolver,
      sourceExts: mergeSourceExts(config.resolver?.sourceExts, options.sourceExts),
    },
  }
}

/**
 * The one-liner: React Native's default config, then the Navirox transform.
 *
 * Loads the app's own Metro helper rather than this package's, because the app's
 * Metro is the one that will run. Throws with an actionable message when it is
 * missing instead of failing later inside Metro.
 */
export function createNaviroxConfig(options: NaviroxMetroOptions = {}): NaviroxMetroConfig {
  const projectRoot = options.projectRoot ?? process.cwd()
  return withNavirox(getDefaultMetroConfig(projectRoot), options)
}

function getDefaultMetroConfig(projectRoot: string): NaviroxMetroConfig {
  const appRequire = createRequire(join(projectRoot, 'package.json'))
  let getDefaultConfig: unknown
  try {
    getDefaultConfig = (appRequire(RN_METRO_CONFIG_SPECIFIER) as { getDefaultConfig?: unknown })
      .getDefaultConfig
  } catch {
    getDefaultConfig = undefined
  }
  if (typeof getDefaultConfig !== 'function') {
    throw new Error(
      `Navirox could not load ${RN_METRO_CONFIG_SPECIFIER} from "${projectRoot}". ` +
        'It is a devDependency of every React Native app, so the usual cause is running ' +
        'Metro from outside the app. Either install it there, or build the config ' +
        'yourself with withNavirox() and pass your own base config.',
    )
  }
  return (getDefaultConfig as (root: string) => NaviroxMetroConfig)(projectRoot)
}

/** Order-preserving dedupe, so applying the preset twice is a no-op. */
function mergeSourceExts(base: readonly string[] = [], extra: readonly string[] = []): string[] {
  const merged: string[] = []
  for (const extension of [...base, ...NAVIROX_SOURCE_EXTENSIONS, ...extra]) {
    if (!merged.includes(extension)) {
      merged.push(extension)
    }
  }
  return merged
}
