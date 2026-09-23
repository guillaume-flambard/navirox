import { describe, expect, it } from 'vitest'
import { createMemoryReader } from './readers.js'
import { discoverRepository } from './index.js'

function packageJson(extra: Record<string, unknown>): string {
  return JSON.stringify(
    {
      name: 'probe',
      version: '0.1.0',
      scripts: { build: 'vite build' },
      dependencies: { vue: '^3.4.0' },
      ...extra,
    },
    null,
    2,
  )
}

const MAIN = "import { createApp } from 'vue'\n\ncreateApp({}).mount('#app')\n"

describe('package manager and workspace detection', () => {
  it('detects npm from package-lock.json and resolves the version', () => {
    const manifest = discoverRepository(
      createMemoryReader({
        'package.json': packageJson({}),
        'package-lock.json': JSON.stringify({
          name: 'probe',
          lockfileVersion: 3,
          packages: { '': { name: 'probe' }, 'node_modules/vue': { version: '3.4.21' } },
        }),
        'src/main.ts': MAIN,
      }),
    )

    expect(manifest.packageManager.value).toBe('npm')
    expect(manifest.lockfiles.value).toEqual([{ manager: 'npm', path: 'package-lock.json' }])
    expect(manifest.resolvedVersions.value).toEqual([
      expect.objectContaining({ name: 'vue', range: '^3.4.0', resolved: '3.4.21' }),
    ])
  })

  it('detects yarn from yarn.lock', () => {
    const manifest = discoverRepository(
      createMemoryReader({
        'package.json': packageJson({}),
        'yarn.lock': [
          'vue@^3.4.0:',
          '  version "3.4.21"',
          '  resolved "https://example.invalid/x"',
          '',
        ].join('\n'),
        'src/main.ts': MAIN,
      }),
    )

    expect(manifest.packageManager.value).toBe('yarn')
    expect(manifest.resolvedVersions.value).toEqual([
      expect.objectContaining({ name: 'vue', resolved: '3.4.21' }),
    ])
  })

  it('detects bun from bun.lockb but leaves versions unresolved with an explicit delta', () => {
    const manifest = discoverRepository(
      createMemoryReader({
        'package.json': packageJson({ packageManager: 'bun@1.1.0' }),
        'bun.lockb': 'binary-lockfile-placeholder',
        'src/main.ts': MAIN,
      }),
    )

    expect(manifest.packageManager.value).toBe('bun')
    expect(manifest.resolvedVersions.value).toEqual([
      expect.objectContaining({ name: 'vue', resolved: null }),
    ])
    expect(manifest.coverage.uncovered).toContain('bun-lockfile-contents')
    expect(manifest.classification).toBe('eligible-with-deltas')
  })

  it('detects the manager from the packageManager field when no lockfile is present', () => {
    const manifest = discoverRepository(
      createMemoryReader({
        'package.json': packageJson({ packageManager: 'pnpm@9.12.0' }),
        'src/main.ts': MAIN,
      }),
    )

    expect(manifest.packageManager.value).toBe('pnpm')
    expect(manifest.deltas.map((delta) => delta.id)).toContain('missing-lockfile')
    expect(manifest.classification).toBe('eligible-with-deltas')
  })

  it('asks for manual discovery when two managers leave lockfiles', () => {
    const manifest = discoverRepository(
      createMemoryReader({
        'package.json': packageJson({}),
        'package-lock.json': JSON.stringify({ lockfileVersion: 3, packages: {} }),
        'pnpm-lock.yaml': "lockfileVersion: '9.0'\n",
        'src/main.ts': MAIN,
      }),
    )

    expect(manifest.classification).toBe('manual-discovery-required')
    expect(
      manifest.diagnostics.some((diagnostic) => diagnostic.code === 'package-manager-collision'),
    ).toBe(true)
  })
})
