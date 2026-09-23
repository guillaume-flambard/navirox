import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppGraphFragment, SemanticAnswer, SemanticJudge } from '@memolabs-apps/planner'
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

function adapterWithUnknownCapability(): SourceAdapter {
  const source = { file: 'src/a.ts', adapterId: 'fake' }

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
        capabilities: [{ key: 'bluetooth', capability: 'bluetooth', usage: 'unknown', source }],
        dependencies: [],
        routes: [],
        findings: [],
      }),
    buildGraph: (): Promise<AppGraphFragment> =>
      Promise.resolve({
        routes: [],
        screens: [],
        units: [],
        actions: [],
        data: [],
        capabilities: [
          {
            id: 'fake:src/a.ts:capability:bluetooth',
            capability: 'bluetooth',
            usage: 'unknown',
            source,
          },
        ],
        dependencies: [],
        edges: [],
        findings: [],
      }),
  }
}

/** A judge that answers without a network and records how often it was asked. */
function fakeJudge(
  answers: Record<string, SemanticAnswer>,
): SemanticJudge & { readonly calls: number } {
  let calls = 0

  return {
    get calls() {
      return calls
    },
    judge: () => {
      calls += 1
      return Promise.resolve(answers)
    },
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

describe('parsing the semantic flag', () => {
  it('accepts --semantic on plan and refuses it elsewhere', () => {
    expect(parseArguments(['plan', '--semantic']).semantic).toBe(true)
    expect(parseArguments(['plan']).semantic).toBe(false)
    expect(() => parseArguments(['inspect', '--semantic'])).toThrow(UsageError)
    expect(() => parseArguments(['dev', '--semantic'])).toThrow(UsageError)
  })
})

describe('planning with a second opinion', () => {
  it('asks nothing when the rules decided everything', async () => {
    const io = capture()
    const judge = fakeJudge({})

    const code = await runCli(['plan', '--semantic'], io.io, project(), {
      inspect: { registry: registryOf(adapterWithOneComponent()) },
      planSemantic: judge,
    })

    expect(code).toBe(0)
    expect(judge.calls).toBe(0)
    expect(io.lines.join('\n')).toContain('no judgment was requested')
  })

  it('appends a second opinion for a subject the rules could not decide', async () => {
    const io = capture()
    const judge = fakeJudge({
      q0: { choice: 'adaptable', confidence: 0.9, probabilities: { adaptable: 0.9 } },
    })

    const code = await runCli(['plan', '--semantic'], io.io, project(), {
      inspect: { registry: registryOf(adapterWithUnknownCapability()) },
      planSemantic: judge,
    })

    expect(code).toBe(0)
    expect(judge.calls).toBe(1)
    expect(io.lines.join('\n')).toContain('Second opinions')
    expect(io.lines.join('\n')).toContain('-> adaptable')
  })

  it('carries the suggestions in the JSON when JSON was asked for', async () => {
    const io = capture()
    const judge = fakeJudge({
      q0: { choice: 'portable', confidence: 0.6, probabilities: { portable: 0.6 } },
    })

    const code = await runCli(['plan', '--semantic', '--json'], io.io, project(), {
      inspect: { registry: registryOf(adapterWithUnknownCapability()) },
      planSemantic: judge,
    })

    const parsed = JSON.parse(io.lines.join('\n')) as {
      schemaVersion: number
      semantic?: { model: string; suggestions: readonly { suggested: string }[] }
    }

    expect(code).toBe(0)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.semantic?.model).toBe('jev-latest')
    expect(parsed.semantic?.suggestions).toHaveLength(1)
    expect(parsed.semantic?.suggestions[0]?.suggested).toBe('portable')
  })

  it('fails readably when no key is configured', async () => {
    const io = capture()
    const previous = process.env['TYPESAFE_API_KEY']
    delete process.env['TYPESAFE_API_KEY']

    try {
      const code = await runCli(['plan', '--semantic'], io.io, project(), {
        inspect: { registry: registryOf(adapterWithUnknownCapability()) },
      })

      expect(code).toBe(1)
      expect(io.errors.join('\n')).toContain('TYPESAFE_API_KEY')
    } finally {
      if (previous !== undefined) {
        process.env['TYPESAFE_API_KEY'] = previous
      }
    }
  })

  it('leaves every plan decision unchanged and keeps the suggestions separate', async () => {
    const withJudge = capture()
    const judge = fakeJudge({
      q0: { choice: 'adaptable', confidence: 0.9, probabilities: { adaptable: 0.9 } },
    })

    const code = await runCli(['plan', '--semantic', '--json'], withJudge.io, project(), {
      inspect: { registry: registryOf(adapterWithUnknownCapability()) },
      planSemantic: judge,
    })

    const plain = capture()
    const plainCode = await runCli(['plan', '--json'], plain.io, project(), {
      inspect: { registry: registryOf(adapterWithUnknownCapability()) },
    })

    const planned = JSON.parse(withJudge.lines.join('\n')) as {
      decisions: readonly { subject: string; classification: string }[]
      semantic?: { model: string; suggestions: readonly { subject: string }[] }
    }
    const baseline = JSON.parse(plain.lines.join('\n')) as {
      decisions: readonly { subject: string; classification: string }[]
    }

    expect(code).toBe(0)
    expect(plainCode).toBe(0)
    expect(planned.decisions).toEqual(baseline.decisions)
    expect(planned.semantic).toBeDefined()
    expect(planned.semantic?.model).toBe('jev-latest')
  })

  it('labels the second opinion and names the model in the human report', async () => {
    const io = capture()
    const judge = fakeJudge({
      q0: { choice: 'adaptable', confidence: 0.9, probabilities: { adaptable: 0.9 } },
    })

    const code = await runCli(['plan', '--semantic'], io.io, project(), {
      inspect: { registry: registryOf(adapterWithUnknownCapability()) },
      planSemantic: judge,
    })

    expect(code).toBe(0)
    expect(io.lines.join('\n')).toContain('Second opinions')
    expect(io.lines.join('\n')).toContain('jev-latest')
  })
})
