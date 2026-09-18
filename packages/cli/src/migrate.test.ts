import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppGraphFragment } from '@navirox/planner'
import type { SourceAdapter } from '@navirox/source'
import { SourceAdapterRegistry } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import { UsageError, parseArguments } from './args'
import { runCli } from './cli'

function project(): string {
  const root = mkdtempSync(join(tmpdir(), 'navirox-cli-migrate-'))
  writeFileSync(join(root, 'logic.ts'), 'export const a = 1\n')
  return root
}

function capture() {
  const lines: string[] = []
  const errors: string[] = []
  return {
    lines,
    errors,
    io: { out: (l: string) => lines.push(l), err: (l: string) => errors.push(l) },
  }
}

function adapter(): SourceAdapter {
  const file = 'logic.ts'
  return {
    id: 'fake',
    displayName: 'Fake',
    supportLevel: 'experimental',
    testedVersions: [{ framework: 'fake', versions: ['^1.0.0'] }],
    detect: () =>
      Promise.resolve({
        candidates: [{ confidence: 'high', evidence: [{ kind: 'fixture', value: 'fixture' }] }],
      }),
    inspect: () =>
      Promise.resolve({
        descriptor: { adapterId: 'fake', displayName: 'Fake' },
        units: [],
        capabilities: [],
        dependencies: [],
        routes: [],
        findings: [],
      }),
    buildGraph: (): Promise<AppGraphFragment> =>
      Promise.resolve({
        routes: [],
        screens: [],
        units: [
          {
            id: `fake:${file}:utility:default`,
            kind: 'utility',
            source: { file, adapterId: 'fake' },
            dependencies: [],
          },
        ],
        actions: [],
        data: [],
        capabilities: [],
        dependencies: [],
        edges: [],
        findings: [],
      }),
  }
}

function registryOf(adapterInstance: SourceAdapter): SourceAdapterRegistry {
  const registry = new SourceAdapterRegistry()
  registry.register(adapterInstance)
  return registry
}

describe('parsing the migrate command', () => {
  it('accepts the command, the output and the write flag', () => {
    expect(parseArguments(['migrate']).command).toBe('migrate')
    expect(parseArguments(['migrate', '--out', 'mobile']).out).toBe('mobile')
    expect(parseArguments(['migrate', '--write', '--out', 'mobile']).write).toBe(true)
    expect(parseArguments(['migrate']).write).toBe(false)
  })

  it('refuses a write without an output directory', () => {
    expect(() => parseArguments(['migrate', '--write'])).toThrow(/needs --out/)
  })

  it('refuses another command the migrate flags, and the reverse', () => {
    expect(() => parseArguments(['inspect', '--out', 'x'])).toThrow(UsageError)
    expect(() => parseArguments(['plan', '--write'])).toThrow(UsageError)
    expect(() => parseArguments(['migrate', '--port', '8081'])).toThrow(UsageError)
    expect(() => parseArguments(['migrate', '-p', 'ios'])).toThrow(UsageError)
  })
})

describe('running the migrate command', () => {
  it('writes nothing without --write', async () => {
    const root = project()
    const out = join(root, 'mobile')
    const io = capture()
    const code = await runCli(['migrate', '--out', out], io.io, root, {
      inspect: { registry: registryOf(adapter()) },
    })

    expect(code).toBe(0)
    expect(io.lines.join('\n')).toContain('dry run')
    expect(existsSync(join(out, 'logic.ts'))).toBe(false)
  })

  it('writes the shared logic and records the run when told to', async () => {
    const root = project()
    const out = join(root, 'mobile')
    const io = capture()
    const code = await runCli(['migrate', '--write', '--out', out], io.io, root, {
      inspect: { registry: registryOf(adapter()) },
    })

    expect(code).toBe(0)
    expect(existsSync(join(out, 'logic.ts'))).toBe(true)
    expect(existsSync(join(out, '.navirox', 'migration.json'))).toBe(true)
    expect(io.lines.join('\n')).toContain('performed')
  })

  it('does the work once on a second run', async () => {
    const root = project()
    const out = join(root, 'mobile')
    const context = { inspect: { registry: registryOf(adapter()) } }

    await runCli(['migrate', '--write', '--out', out], capture().io, root, context)
    const second = capture()
    const code = await runCli(['migrate', '--write', '--out', out], second.io, root, context)

    expect(code).toBe(0)
    expect(second.lines.join('\n')).toContain('already migrated')
  })

  it('fails with a message when nothing can be inspected', async () => {
    const root = project()
    const io = capture()
    const code = await runCli(['migrate', '--out', join(root, 'mobile')], io.io, root, {
      inspect: {
        registry: registryOf({ ...adapter(), detect: () => Promise.resolve({ candidates: [] }) }),
      },
    })

    expect(code).toBe(1)
    expect(io.errors.join('\n')).toContain('No supported source adapter')
  })
})
