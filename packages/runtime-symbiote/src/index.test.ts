import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertNativeRuntime, type NaviroxComponent } from '@navirox/runtime'
import { HOST_PRIMITIVES } from '@symbiote-native/components/host-primitives'
import { describe, expect, it } from 'vitest'
import {
  BUILT_ON,
  createNativeModuleRegistry,
  createRuntimeFromHost,
  createSymbioteNavigation,
  DEFAULT_APP_KEY,
  diffManifestPins,
  intrinsicTagsOf,
  PACKAGE_NAME,
  PACKAGE_ROLE,
  RUNTIME_ID,
  RUNTIME_MANIFEST,
  satisfiesRange,
  SYMBIOTE_NAVIGATION_ID,
  type ConfigureApp,
  type HostPrimitiveTable,
  type SymbioteHost,
} from './index.js'

const require = createRequire(import.meta.url)
const here = dirname(fileURLToPath(import.meta.url))

interface IPackageJson {
  readonly name?: string
  readonly version?: string
  readonly dependencies?: Record<string, string>
}

function readJson(path: string): IPackageJson {
  return JSON.parse(readFileSync(path, 'utf8')) as IPackageJson
}

/**
 * The installed version of a package, found by resolving its entry point and
 * walking up to the package.json that actually names it. Walking is necessary
 * because several upstream packages expose no `./package.json` subpath, so
 * `require('x/package.json')` is not available.
 *
 * Note this only *resolves* the entry point; it never loads it. Loading is what
 * plain Node cannot do for most `@symbiote-native/*` builds.
 */
function installedVersion(name: string): string {
  let dir = dirname(require.resolve(name))
  for (;;) {
    try {
      const pkg = readJson(join(dir, 'package.json'))
      if (pkg.name === name && typeof pkg.version === 'string') return pkg.version
    } catch {
      // Not a readable package.json; keep walking up.
    }
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`Could not find an installed package.json for ${name}`)
    dir = parent
  }
}

interface IMount {
  readonly appKey: string
  readonly provider: () => NaviroxComponent
}

function fakeHost(engineVersion = '0.5.0'): {
  host: SymbioteHost
  mounts: IMount[]
  configurators: ConfigureApp[]
} {
  const mounts: IMount[] = []
  const configurators: ConfigureApp[] = []
  return {
    mounts,
    configurators,
    host: {
      primitives: HOST_PRIMITIVES as HostPrimitiveTable,
      registerComponent(appKey, provider) {
        mounts.push({ appKey, provider })
        return appKey
      },
      setAppConfigurator(configure) {
        configurators.push(configure)
      },
      engineVersion,
    },
  }
}

describe('@navirox/runtime-symbiote', () => {
  it('identifies itself and declares the seam it is built on', () => {
    expect(PACKAGE_NAME).toBe('@navirox/runtime-symbiote')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
    expect(BUILT_ON).toBe('@navirox/runtime')
  })

  it('keeps the renderer edge in exactly one file', () => {
    // The barrel must stay host-free so plain-Node tooling can read the manifest;
    // the host import belongs in ./bootstrap.ts alone.
    const barrel = readFileSync(join(here, 'index.ts'), 'utf8')
    expect(barrel).not.toMatch(/from '@symbiote-native\//)

    const bootstrap = readFileSync(join(here, 'bootstrap.ts'), 'utf8')
    expect(bootstrap).toMatch(/from '@symbiote-native\/components\/host-primitives'/)
    expect(bootstrap).toMatch(/from '@symbiote-native\/vue'/)
  })
})

describe('runtime.json', () => {
  it('pins exactly the same versions the package declares as dependencies', () => {
    const own = readJson(join(here, '..', 'package.json'))
    expect(diffManifestPins(own.dependencies ?? {})).toEqual([])
  })

  it('matches the versions actually installed, and those satisfy the declared ranges', () => {
    for (const [name, pinned] of Object.entries(RUNTIME_MANIFEST.packages)) {
      const installed = installedVersion(name)
      expect(installed, `${name} installed version`).toBe(pinned)
      const range = RUNTIME_MANIFEST.versionRange[name]
      if (range === undefined) throw new Error(`runtime.json has no versionRange for ${name}`)
      expect(satisfiesRange(installed, range), `${name} ${installed} satisfies ${range}`).toBe(true)
    }
  })

  it('leaves `verified` null until the adapter is observed rendering, rather than claiming intent', () => {
    for (const value of Object.values(RUNTIME_MANIFEST.verified)) {
      expect(value === true || value === null).toBe(true)
    }
  })

  it('reports a drifted or missing pin instead of silently accepting it', () => {
    const problems = diffManifestPins({ '@symbiote-native/vue': '^2.0.0' }).join('\n')
    expect(problems).toMatch(
      /@symbiote-native\/vue is declared as "\^2\.0\.0" but the manifest pins 2\.0\.0/,
    )
    expect(problems).toMatch(
      /is pinned in the manifest at 0\.5\.0 but is not declared as a dependency/,
    )
  })

  it('compares versions without pulling in a semver dependency', () => {
    expect(satisfiesRange('2.0.0', '^2.0.0')).toBe(true)
    expect(satisfiesRange('2.1.3', '^2.0.0')).toBe(true)
    expect(satisfiesRange('2.0.0', '^2.1.0')).toBe(false)
    expect(satisfiesRange('3.0.0', '^2.0.0')).toBe(false)
    expect(satisfiesRange('0.86.0', '>=0.86')).toBe(false)
    expect(satisfiesRange('0.86.0', '>=0.86.0')).toBe(true)
    expect(satisfiesRange('not-a-version', '^1.0.0')).toBe(false)
  })
})

describe('host components', () => {
  const fixture: HostPrimitiveTable = {
    View: { intrinsic: 'view', aliases: { id: 'nativeID' } },
    Text: {
      intrinsic: 'text',
      aliases: { id: 'nativeID' },
      defaults: { ellipsizeMode: { op: 'nullish', value: 'tail' } },
    },
    ScrollView: {
      intrinsic: 'scroll-view',
      aliases: { id: 'nativeID' },
      intrinsicWhen: { prop: 'horizontal', intrinsic: 'horizontal-scroll-view' },
    },
  }

  it('derives the tag alphabet, including the prop-selected twins, and ignores props', () => {
    expect(intrinsicTagsOf(fixture)).toEqual([
      'horizontal-scroll-view',
      'scroll-view',
      'text',
      'view',
    ])
  })

  it("reads upstream's real table and finds every primitive @navirox/ui requires", () => {
    const tags = intrinsicTagsOf(HOST_PRIMITIVES as HostPrimitiveTable)
    for (const required of ['view', 'text', 'pressable', 'text-input', 'scroll-view']) {
      expect(tags, `${required} is derived from the upstream table`).toContain(required)
    }
  })
})

describe('createRuntimeFromHost', () => {
  it('satisfies the NativeRuntime seam', () => {
    const { host } = fakeHost()
    const runtime = createRuntimeFromHost(host)
    expect(() => assertNativeRuntime(runtime)).not.toThrow()
    expect(runtime.id).toBe(RUNTIME_ID)
  })

  it('reports the renderer version it was handed', () => {
    expect(createRuntimeFromHost(fakeHost('0.5.0').host).version).toBe('0.5.0')
  })

  it('claims the capabilities the manifest records', () => {
    const runtime = createRuntimeFromHost(fakeHost().host)
    expect(runtime.capabilities.newArch).toBe(RUNTIME_MANIFEST.capabilities.newArch)
    expect(runtime.capabilities.fabric).toBe(RUNTIME_MANIFEST.capabilities.fabric)
    expect(runtime.capabilities.legacyFallback).toBe(RUNTIME_MANIFEST.capabilities.legacyFallback)
    expect(runtime.capabilities.platforms).toEqual(['ios', 'android'])
  })

  it("exposes the host's whole tag table as renderable host components", () => {
    const runtime = createRuntimeFromHost(fakeHost().host)
    expect(runtime.hostComponents['view']).toEqual({ tag: 'view', platforms: ['ios', 'android'] })
    expect(Object.keys(runtime.hostComponents).length).toBe(
      intrinsicTagsOf(HOST_PRIMITIVES as HostPrimitiveTable).length,
    )
  })

  it('registers the root under the default app key, and under a named one when asked', () => {
    const first = fakeHost()
    const root = { name: 'App' } as NaviroxComponent
    createRuntimeFromHost(first.host).mount(root)
    expect(first.mounts).toHaveLength(1)
    expect(first.mounts[0]?.appKey).toBe(DEFAULT_APP_KEY)
    expect(first.mounts[0]?.provider()).toBe(root)

    const second = fakeHost()
    createRuntimeFromHost(second.host).mount(root, { name: 'OtherRoot' })
    expect(second.mounts[0]?.appKey).toBe('OtherRoot')
  })

  it('installs the app configurator at build time, not at mount time', () => {
    const { host, configurators } = fakeHost()
    const configure: ConfigureApp = () => {}
    const runtime = createRuntimeFromHost(host, { configure })
    expect(configurators).toEqual([configure])
    runtime.mount({} as NaviroxComponent)
    expect(configurators).toHaveLength(1)
  })

  it('does not install a configurator when none was supplied', () => {
    expect(fakeHost().configurators).toEqual([])
  })

  it('reports the modules the application supplied', () => {
    const runtime = createRuntimeFromHost(fakeHost().host, {
      modules: { haptics: { vibrate() {} } },
    })
    expect(runtime.nativeModules.ids).toEqual(['haptics'])
    expect(runtime.capabilities.modules).toEqual(['haptics'])
  })

  it('stops claiming liveness when unmounted', () => {
    const handle = createRuntimeFromHost(fakeHost().host).mount({} as NaviroxComponent)
    expect(handle.mounted).toBe(true)
    handle.unmount()
    expect(handle.mounted).toBe(false)
  })

  it('records a custom native component with its declared props and events', () => {
    const runtime = createRuntimeFromHost(fakeHost().host)
    runtime.registerNativeComponent({
      tag: 'map-view',
      nativeName: 'RNMapView',
      props: { region: 'object' },
      events: ['regionChange'],
    })
    expect(runtime.hostComponents['map-view']).toEqual({
      tag: 'map-view',
      platforms: ['ios', 'android'],
      props: { region: 'object' },
      events: ['regionChange'],
    })
  })

  it('accepts the factory options shape from the seam', () => {
    const runtime = createRuntimeFromHost(fakeHost().host, {
      config: { appKey: 'CustomRoot', modules: { device: {} } },
    })
    expect(runtime.nativeModules.ids).toEqual(['device'])
    expect(DEFAULT_APP_KEY).toBe('NaviroxRoot')
  })
})

describe('navigation', () => {
  it('advertises the navigators upstream actually ships', () => {
    const navigation = createSymbioteNavigation()
    expect(navigation.id).toBe(SYMBIOTE_NAVIGATION_ID)
    expect(navigation.supports).toEqual({
      stack: true,
      tabs: true,
      drawer: true,
      modal: true,
      deepLinks: true,
    })
  })

  it('holds the name to component map our routing layer populates', () => {
    const navigation = createSymbioteNavigation()
    const component = { name: 'Home' }
    navigation.registerScreen('home', component as never)
    expect(navigation.screen('home')).toBe(component)
    expect(navigation.screens).toEqual(['home'])
  })

  it('rejects an empty screen name rather than registering an unreachable screen', () => {
    expect(() => createSymbioteNavigation().registerScreen('  ', {} as never)).toThrow(
      /cannot be empty/,
    )
  })
})

describe('native module registry', () => {
  it('sorts the ids and answers membership without leaking values', () => {
    const registry = createNativeModuleRegistry({ haptics: 1, camera: 2 })
    expect(registry.ids).toEqual(['camera', 'haptics'])
    expect(registry.has('haptics')).toBe(true)
    expect(registry.has('nope')).toBe(false)
    expect(registry.get<number>('camera')).toBe(2)
    expect(registry.get('nope')).toBeUndefined()
  })

  it('treats an inherited property as absent', () => {
    expect(createNativeModuleRegistry({}).has('toString')).toBe(false)
  })
})
