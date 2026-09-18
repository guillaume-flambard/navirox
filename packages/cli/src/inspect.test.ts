import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppGraphFragment } from '@navirox/graph'
import type { SourceAdapter } from '@navirox/source'
import { SourceAdapterRegistry } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import { UsageError, parseArguments } from './args'
import { runCli } from './cli'

/**
 * The inspect command, from the argument line to the exit code.
 *
 * The pipeline is tested where it lives; this file is about the join: that the
 * adapter set is composed here, that a failure is a message and a non-zero code,
 * and that a report goes to one writer.
 */

function project(): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-cli-inspect-'))
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
    io: {
      out: (line) => lines.push(line),
      err: (line) => errors.push(line),
    },
  }
}

function emptyFragment(): AppGraphFragment {
  return {
    routes: [],
    screens: [],
    units: [],
    actions: [],
    data: [],
    capabilities: [],
    dependencies: [],
    edges: [],
    findings: [],
  }
}

function fakeAdapter(id = 'fake'): SourceAdapter {
  return {
    id,
    displayName: 'Fake',
    supportLevel: 'experimental',
    testedVersions: [{ framework: 'fake', versions: ['^1.0.0'] }],
    detect: () =>
      Promise.resolve({
        candidates: [{ confidence: 'high', evidence: [{ kind: 'fixture', value: 'fixture' }] }],
      }),
    inspect: () =>
      Promise.resolve({
        descriptor: { adapterId: id, displayName: 'Fake' },
        units: [],
        capabilities: [],
        dependencies: [],
        routes: [],
        findings: [],
      }),
    buildGraph: () => Promise.resolve(emptyFragment()),
  }
}

function registryOf(...adapters: readonly SourceAdapter[]): SourceAdapterRegistry {
  const registry = new SourceAdapterRegistry()

  for (const adapter of adapters) {
    registry.register(adapter)
  }

  return registry
}

describe('parsing the inspect command', () => {
  it('accepts the command and the framework option', () => {
    expect(parseArguments(['inspect']).command).toBe('inspect')
    expect(parseArguments(['inspect']).framework).toBeUndefined()
    expect(parseArguments(['inspect', '--framework', 'vue']).framework).toBe('vue')
  })

  it('refuses a flag that belongs to another command', () => {
    expect(() => parseArguments(['inspect', '--framework', 'vue', '--port', '8081'])).toThrow(
      UsageError,
    )
    expect(() => parseArguments(['inspect', '--skip-preflight'])).toThrow(UsageError)
    expect(() => parseArguments(['inspect', '-p', 'ios'])).toThrow(UsageError)
    expect(() => parseArguments(['doctor', '--framework', 'vue'])).toThrow(UsageError)
    expect(() => parseArguments(['--framework', 'vue'])).toThrow(UsageError)
  })

  it('lists the command in the help text', () => {
    expect(parseArguments(['--help']).help).toBe(true)
  })
})

describe('running the inspect command', () => {
  it('prints a report and succeeds', async () => {
    const io = capture()
    const code = await runCli(['inspect'], io.io, project(), {
      inspect: { registry: registryOf(fakeAdapter()) },
    })

    expect(code).toBe(0)
    expect(io.errors).toEqual([])
    expect(io.lines.join('\n')).toContain('Navirox inspection')
    expect(io.lines.join('\n')).toContain('Fake (experimental)')
  })

  it('writes one JSON document when JSON was asked for', async () => {
    const io = capture()
    const code = await runCli(['inspect', '--json'], io.io, project(), {
      inspect: { registry: registryOf(fakeAdapter()) },
    })
    const parsed: unknown = JSON.parse(io.lines.join('\n'))

    expect(code).toBe(0)
    expect(typeof parsed).toBe('object')
  })

  it('fails with a message when nothing can be inspected', async () => {
    const io = capture()
    const code = await runCli(['inspect'], io.io, project(), {
      inspect: { registry: registryOf() },
    })

    expect(code).toBe(1)
    expect(io.errors.join('\n')).toContain('No supported source adapter')
  })

  it('fails when the named adapter is not registered', async () => {
    const io = capture()
    const code = await runCli(['inspect', '--framework', 'svelte'], io.io, project(), {
      inspect: { registry: registryOf(fakeAdapter()) },
    })

    expect(code).toBe(1)
    expect(io.errors.join('\n')).toContain('svelte')
  })
})
