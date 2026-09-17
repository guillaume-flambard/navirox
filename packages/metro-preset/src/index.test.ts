import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { symbioteVueTransformerPath } from '@navirox/runtime-symbiote'
import {
  createNaviroxConfig,
  NAVIROX_SOURCE_EXTENSIONS,
  PACKAGE_NAME,
  PACKAGE_ROLE,
  withNavirox,
} from './index'

const ownManifest = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as {
  dependencies?: Record<string, string>
}

describe('@navirox/metro-preset', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@navirox/metro-preset')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })

  it('never depends on the expo meta-package', () => {
    // The whole point of the preset is that `expo`'s own Metro config and Babel
    // preset never enter the pipeline. Assert the direct dependencies, which is
    // the claim this package can actually keep.
    const declared = Object.keys(ownManifest.dependencies ?? {})
    expect(declared.filter((name) => name === 'expo' || name.startsWith('expo-'))).toEqual([])
  })
})

describe('withNavirox', () => {
  it('points the transformer at the adapter-resolved Vue transformer', () => {
    const config = withNavirox()
    expect(config.transformer?.babelTransformerPath).toBe(symbioteVueTransformerPath())
  })

  it('adds every Navirox source extension to Metro defaults', () => {
    const config = withNavirox({ resolver: { sourceExts: ['js', 'ts', 'tsx'] } })
    expect(config.resolver?.sourceExts).toEqual([
      'js',
      'ts',
      'tsx',
      'vue',
      'css',
      'scss',
      'sass',
      'less',
      'styl',
    ])
  })

  it('exposes the same extensions under a Navirox name', () => {
    expect([...NAVIROX_SOURCE_EXTENSIONS]).toEqual(['vue', 'css', 'scss', 'sass', 'less', 'styl'])
  })

  it('preserves unrelated transformer and resolver keys', () => {
    const config = withNavirox({
      transformer: { babelTransformerPath: 'old', getTransformOptions: 'kept' },
      resolver: { sourceExts: ['js'], assetExts: ['png'] },
      watchFolders: ['/somewhere'],
    })
    expect(config.transformer?.getTransformOptions).toBe('kept')
    expect(config.resolver?.assetExts).toEqual(['png'])
    expect(config.watchFolders).toEqual(['/somewhere'])
  })

  it('is idempotent, so applying it twice does not duplicate extensions', () => {
    const once = withNavirox({ resolver: { sourceExts: ['js'] } })
    const twice = withNavirox(once)
    expect(twice.resolver?.sourceExts).toEqual(once.resolver?.sourceExts)
  })

  it('does not mutate the config it is given', () => {
    const input = { resolver: { sourceExts: ['js'] } }
    withNavirox(input)
    expect(input.resolver.sourceExts).toEqual(['js'])
    expect(input).not.toHaveProperty('transformer')
  })

  it('accepts extra source extensions after the defaults', () => {
    const config = withNavirox({}, { sourceExts: ['mdx', 'js'] })
    expect(config.resolver?.sourceExts).toEqual([
      'vue',
      'css',
      'scss',
      'sass',
      'less',
      'styl',
      'mdx',
      'js',
    ])
  })

  it('lets a caller replace the transformer, so a second runtime is an option', () => {
    const config = withNavirox({}, { transformerPath: '/tmp/other-transformer.cjs' })
    expect(config.transformer?.babelTransformerPath).toBe('/tmp/other-transformer.cjs')
  })
})

describe('createNaviroxConfig', () => {
  it('fails with an actionable message when the app has no Metro helper', () => {
    const emptyRoot = mkdtempSync(join(tmpdir(), 'navirox-metro-'))
    expect(() => createNaviroxConfig({ projectRoot: emptyRoot })).toThrow(
      /could not load @react-native\/metro-config from/,
    )
  })
})
