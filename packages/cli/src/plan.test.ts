import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppGraphFragment } from '@memolabs-apps/planner'
import type { SourceAdapter } from '@memolabs-apps/source'
import { SourceAdapterRegistry } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import { UsageError, parseArguments } from './args'
import { runCli } from './cli'

/**
 * The plan command, from the argument line to the exit code.
 *
 * The rules are tested where they live. This file is about the join: that the
 * command reuses the inspection pipeline, that a plan is what comes out, and
 * that the flags which belong to another command are refused.
 */

function project(): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-cli-plan-'))
  writeFileSync(join(directory, 'index.ts'), 'export const app = 1\n')
  return directory
}

function capture(): {
  lines: string[]
  errors: string[]
  io: { out: (line: string) => void; err: (line: string) => void }
} {
  const lines: string[] = []
  const errors: string[] = []

  return {
    lines,
    errors,
    io: { out: (line) => lines.push(line), err: (line) => errors.push(line) },
  }
}

function adapterWithOneComponent(): SourceAdapter {
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
        units: [
          { key: 'default', kind: 'component', source: { file: 'src/App.vue', adapterId: 'fake' } },
        ],
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
            id: 'fake:src/App.vue:component:default',
            kind: 'component',
            source: { file: 'src/App.vue', adapterId: 'fake' },
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

function registryOf(...adapters: readonly SourceAdapter[]): SourceAdapterRegistry {
  const registry = new SourceAdapterRegistry()

  for (const adapter of adapters) {
    registry.register(adapter)
  }

  return registry
}

describe('parsing the plan command', () => {
  it('accepts the command, the framework flag and the directory', () => {
    expect(parseArguments(['plan']).command).toBe('plan')
    expect(parseArguments(['plan', '--framework', 'vue']).framework).toBe('vue')
    expect(parseArguments(['plan', '-C', 'app']).directory).toBe('app')
  })

  it('refuses the flags that belong to another command', () => {
    expect(() => parseArguments(['plan', '--port', '8081'])).toThrow(UsageError)
    expect(() => parseArguments(['plan', '--skip-preflight'])).toThrow(UsageError)
    expect(() => parseArguments(['plan', '-p', 'ios'])).toThrow(UsageError)
    expect(() => parseArguments(['dev', '--framework', 'vue'])).toThrow(UsageError)
  })
})

describe('running the plan command', () => {
  it('prints a plan and succeeds', async () => {
    const io = capture()
    const code = await runCli(['plan'], io.io, project(), {
      inspect: { registry: registryOf(adapterWithOneComponent()) },
    })

    expect(code).toBe(0)
    expect(io.errors).toEqual([])
    expect(io.lines.join('\n')).toContain('Navirox migration plan')
    expect(io.lines.join('\n')).toContain('native-replacement')
  })

  it('writes one JSON document when JSON was asked for', async () => {
    const io = capture()
    const code = await runCli(['plan', '--json'], io.io, project(), {
      inspect: { registry: registryOf(adapterWithOneComponent()) },
    })
    const parsed = JSON.parse(io.lines.join('\n')) as { schemaVersion: number; graph?: unknown }

    expect(code).toBe(0)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.graph).toBeUndefined()
  })

  it('fails with a message when nothing can be inspected', async () => {
    const io = capture()
    const code = await runCli(['plan'], io.io, project(), { inspect: { registry: registryOf() } })

    expect(code).toBe(1)
    expect(io.errors.join('\n')).toContain('No supported source adapter')
  })

  it('reuses the inspection pipeline rather than a second one', async () => {
    const io = capture()

    await runCli(['plan', '--json'], io.io, project(), {
      inspect: { registry: registryOf(adapterWithOneComponent()) },
    })

    const parsed = JSON.parse(io.lines.join('\n')) as { source: { adapterId: string } }

    expect(parsed.source.adapterId).toBe('fake')
    expect(parsed.schemaVersion).toBe(1)
  })
})
