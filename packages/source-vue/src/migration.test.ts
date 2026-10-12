import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { APP_GRAPH_SCHEMA_VERSION, type AppGraph } from '@memolabs-apps/graph'
import { plan } from '@memolabs-apps/planner'
import { describe, expect, it } from 'vitest'
import type { Screen } from '@memolabs-apps/workflow'
import { createVueStateMigrationProvider } from './migration.js'
import { inspectStatePortability } from './state-portability.js'
import { createVueStatePortabilityRule } from './state-rule.js'
import { createVueWorkspaceProvider } from './workspace.js'
import type { WorkspaceScaffoldInput } from '@memolabs-apps/source'

const storeSource = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => {
    count.value += 1
  }

  return { count, increment }
})
`

const composableSource = `import { computed, ref } from 'vue'

export const useCounter = (initial = 0) => {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)
  return { count, doubled }
}
`

const impureSource = `import { defineStore } from 'pinia'

export const useRemoteStore = defineStore('remote', async () => {
  const response = await fetch('/api/remote')
  return { response }
})
`

const unresolvedSource = `import { defineStore } from 'pinia'
import { missing } from '@/missing'

export const useMissingStore = defineStore('missing', () => ({ missing }))
`

const screen: Screen = {
  id: 'home:screen:default',
  name: 'Home',
  source: { adapterId: 'vue', file: 'src/views/Home.vue', line: 1 },
  coverage: { kind: 'generated' },
  nodes: [],
  state: [],
  actions: [],
  routeIds: [],
  navigationActions: [],
  layout: [],
  styles: [],
  resources: [],
}

function fixture(
  id: string,
  assertions: readonly { expression: string; expected: string }[],
): string {
  return JSON.stringify({ id, assertions })
}

function unit(
  file: string,
  content: string,
  kind: 'state-module' | 'utility' = 'state-module',
): AppGraph['units'][number] {
  const assertions =
    kind === 'utility'
      ? [
          { expression: 'count', expected: '0' },
          { expression: 'doubled', expected: '0' },
        ]
      : [
          { expression: 'count', expected: '0' },
          { expression: 'increment()', expected: 'undefined' },
          { expression: 'count', expected: '1' },
        ]
  const evidence = inspectStatePortability(file, content, fixture(`${file}:fixture`, assertions))

  return {
    id: `vue:${file}:${kind}:default`,
    kind,
    source: { file, adapterId: 'vue', line: 1 },
    dependencies: [],
    metadata: { statePortability: evidence },
  }
}

function graph(units: AppGraph['units']): AppGraph {
  return {
    schemaVersion: APP_GRAPH_SCHEMA_VERSION,
    source: { adapterId: 'vue', displayName: 'Vue' },
    routes: [],
    screens: [],
    units,
    actions: [],
    data: [],
    capabilities: [],
    dependencies: [
      { id: 'vue:pinia', name: 'pinia' },
      { id: 'vue:vue', name: 'vue' },
    ],
    edges: [],
    findings: [],
  }
}

function workspaceInput(migration?: WorkspaceScaffoldInput['migration']): WorkspaceScaffoldInput {
  return {
    lowering: {
      workflow: { schemaVersion: 1, id: 'fixture', routes: [], screens: [screen] },
      coverage: { generated: 1, manualRequired: 0, excluded: 0, refused: 0 },
      findings: [],
    },
    emission: {
      files: [
        { path: 'generated/Home.vue', content: '<template><view /></template>\n' },
        {
          path: 'generated/Home.manifest.json',
          content: `${JSON.stringify({ screenId: screen.id, outputPath: 'generated/Home.vue' })}\n`,
        },
      ],
      findings: [],
    },
    ...(migration === undefined ? {} : { migration }),
  }
}

function filesFor(
  migration?: WorkspaceScaffoldInput['migration'],
): readonly { path: string; content: string }[] {
  return createVueWorkspaceProvider().scaffold(workspaceInput(migration)).files
}

function writeTree(
  root: string,
  files: readonly { readonly path: string; readonly content: string }[],
): void {
  for (const file of files) {
    const target = join(root, file.path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, file.content)
  }
}

async function migrate(
  graphValue: AppGraph,
  source: string,
  generatedFiles: readonly { path: string; content: string }[],
  migration?: WorkspaceScaffoldInput['migration'],
  planValue?: ReturnType<typeof plan>,
  workspaceFilesOverride?: readonly { readonly path: string; readonly content: string }[],
) {
  const sourceRoot = mkdtempSync(join(tmpdir(), 'navirox-vue-state-source-'))
  const workspaceFiles = workspaceFilesOverride ?? filesFor(migration)

  try {
    return await createVueStateMigrationProvider().migrate({
      sourceRoot,
      graph: graphValue,
      plan: planValue ?? plan(graphValue, { rules: [createVueStatePortabilityRule()] }),
      readText: (path) => (path === graphValue.units[0]?.source.file ? source : undefined),
      generatedFiles,
      workspaceFiles,
    })
  } finally {
    rmSync(sourceRoot, { force: true, recursive: true })
  }
}

describe('the Vue state migration provider', () => {
  it('moves a pure Pinia setup store only after its fixture passes', async () => {
    const state = graph([unit('src/stores/counter.ts', storeSource)])
    const generatedFiles = [
      { path: 'generated/Home.vue', content: '<template><view /></template>\n' },
      {
        path: 'generated/Home.manifest.json',
        content: `${JSON.stringify({ screenId: 'home', outputPath: 'generated/Home.vue' })}\n`,
      },
    ]
    const result = await migrate(state, storeSource, generatedFiles, {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    })

    expect(result.moved).toEqual([state.units[0]!.id])
    expect(result.files).toEqual([
      {
        path: '.navirox/vue-state-verification.json',
        content: expect.stringContaining('"schemaVersion": 1'),
      },
      { path: 'src/stores/counter.ts', content: storeSource },
    ])
    expect(result.behavior).toEqual([
      {
        unit: state.units[0]!.id,
        fixtureId: 'src/stores/counter.ts:fixture',
        sourceHash: expect.any(String),
        status: 'passed',
      },
    ])
  }, 30_000)

  it('preserves staged manifest dependencies and fields while adding verifier dependencies', async () => {
    const metadata = {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    }
    const workspaceFiles = [
      ...filesFor(metadata),
      {
        path: 'package.json',
        content: `${JSON.stringify(
          {
            name: 'staged-workspace',
            private: false,
            type: 'module',
            scripts: { existing: 'node existing.mjs' },
            dependencies: {
              '@vue/compiler-sfc': '3.5.43',
              'keep-runtime': '1.2.3',
              'vue-router': '4.5.0',
            },
            devDependencies: { 'keep-dev': '4.5.6' },
            customField: 'preserved',
          },
          undefined,
          2,
        )}\n`,
      },
      {
        path: 'scripts/verify-state.mjs',
        content: `import { readFileSync } from 'node:fs'
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
if (manifest.dependencies['keep-runtime'] !== '1.2.3') throw new Error('runtime dependency was lost')
if (manifest.dependencies['@vue/compiler-sfc'] !== '3.5.43') throw new Error('compiler dependency was lost')
if (manifest.dependencies['vue-router'] !== '4.5.0') throw new Error('router dependency was lost')
if (manifest.devDependencies['keep-dev'] !== '4.5.6') throw new Error('dev dependency was lost')
if (manifest.dependencies.pinia !== '4.0.3') throw new Error('Pinia was not added')
if (manifest.devDependencies.typescript !== '6.0.3') throw new Error('TypeScript was not added')
if (manifest.scripts.existing !== 'node existing.mjs') throw new Error('scripts were lost')
if (manifest.customField !== 'preserved') throw new Error('manifest fields were lost')
`,
      },
    ]
    const state = graph([unit('src/stores/counter.ts', storeSource)])
    const result = await migrate(state, storeSource, [], metadata, undefined, workspaceFiles)

    expect(result.moved).toEqual([state.units[0]!.id])
    expect(result.behavior[0]?.status).toBe('passed')
  }, 30_000)

  it('overwrites an untrusted staged state verifier with the canonical checker', async () => {
    const metadata = {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    }
    const workspaceFiles = [
      ...filesFor(metadata),
      { path: 'scripts/verify-state.mjs', content: 'process.exit(42)\n' },
    ]
    const state = graph([unit('src/stores/counter.ts', storeSource)])
    const result = await migrate(state, storeSource, [], metadata, undefined, workspaceFiles)

    expect(result.moved).toEqual([state.units[0]!.id])
    expect(result.behavior[0]?.status).toBe('passed')
  }, 30_000)

  it('keeps a pure composable inside the approved profile', async () => {
    const state = graph([unit('src/composables/useCounter.ts', composableSource, 'utility')])
    const result = await migrate(state, composableSource, [])

    expect(result.moved).toEqual([state.units[0]!.id])
    expect(result.files[0]?.content).toBe(composableSource)
    expect(result.behavior[0]?.status).toBe('passed')
  }, 30_000)

  it('ignores Pinia metadata for a composable-only provider', async () => {
    const metadata = {
      piniaVersion: '4.0.3',
      verification: 'execute a composable-only fixture',
      hasPinia: true,
    } satisfies WorkspaceScaffoldInput['migration']
    const state = graph([unit('src/composables/useCounter.ts', composableSource, 'utility')])
    const result = await migrate(state, composableSource, [], metadata)

    expect(result.moved).toEqual([state.units[0]!.id])
    expect(result.files).toEqual([
      { path: 'src/composables/useCounter.ts', content: composableSource },
    ])
    expect(result.behavior[0]?.status).toBe('passed')
  }, 30_000)

  it('uses the exported AST declaration rather than a commented decoy', async () => {
    const source = `// export const decoy = defineStore('decoy', () => ({}))\n${storeSource}`
    const state = graph([unit('src/stores/counter.ts', source)])
    const result = await migrate(state, source, [], {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    })

    expect(result.moved).toEqual([state.units[0]!.id])
    expect(result.behavior[0]?.status).toBe('passed')
  }, 30_000)

  it('refuses forged approved evidence with unsafe effects or imports', async () => {
    const valid = unit('src/stores/counter.ts', storeSource)
    const validGraph = graph([valid])
    const validPlan = plan(validGraph, { rules: [createVueStatePortabilityRule()] })
    const base = valid.metadata?.['statePortability'] as Record<string, unknown>
    const cases = [
      { imports: [{ specifier: 'lodash', status: 'allowed' }] },
      { imports: [{ specifier: '@/missing', status: 'unresolved' }] },
      { effects: ['network'] },
    ]

    for (const forged of cases) {
      const invalidUnit = {
        ...valid,
        metadata: { statePortability: { ...base, ...forged } },
      }
      const result = await migrate(
        graph([invalidUnit]),
        storeSource,
        [],
        {
          piniaVersion: '4.0.3',
          verification: 'execute the generated Pinia setup-store behavior fixture',
        },
        validPlan,
      )

      expect(result.moved).toEqual([])
      expect(result.manual).toEqual([
        expect.objectContaining({
          unit: valid.id,
          reason: expect.stringContaining('invalid-state-evidence'),
        }),
      ])
    }
  }, 30_000)

  it('does not promote all-passed output from a nonzero provider verifier', async () => {
    const source = `process.exitCode = 1
${storeSource}`
    const state = graph([unit('src/stores/counter.ts', source)])
    const result = await migrate(state, source, [], {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    })

    expect(result.moved).toEqual([])
    expect(result.behavior).toEqual([
      expect.objectContaining({
        unit: state.units[0]!.id,
        status: 'failed',
      }),
    ])
  }, 30_000)

  it('reports approved evidence without an AST export as a manual refusal', async () => {
    const source = `import { defineStore } from 'pinia'
import { ref } from 'vue'
const useCounterStore = defineStore('counter', () => ({ count: ref(0) }))
`
    const state = graph([unit('src/stores/counter.ts', storeSource)])
    const result = await migrate(state, source, [], {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    })

    expect(result.moved).toEqual([])
    expect(result.files).toEqual([])
    expect(result.manual).toEqual([
      expect.objectContaining({
        unit: state.units[0]!.id,
        reason: expect.stringMatching(/unsupported-state-profile.*src\/stores\/counter\.ts:1/),
      }),
    ])
  }, 30_000)

  it('reports an impure store as manual without moving it', async () => {
    const state = graph([unit('src/stores/remote.ts', impureSource)])
    const result = await migrate(state, impureSource, [])

    expect(result.moved).toEqual([])
    expect(result.files).toEqual([])
    expect(result.manual).toEqual([
      expect.objectContaining({
        unit: state.units[0]!.id,
        reason: expect.stringContaining('unsupported-state-effect'),
      }),
    ])
  }, 30_000)

  it('reports an unresolved import as unknown and keeps it visible', async () => {
    const state = graph([unit('src/stores/missing.ts', unresolvedSource)])
    const result = await migrate(state, unresolvedSource, [])

    expect(result.moved).toEqual([])
    expect(result.files).toEqual([])
    expect(result.unknown).toEqual([
      expect.objectContaining({
        unit: state.units[0]!.id,
        reason: expect.stringContaining('unresolved-state-import'),
      }),
    ])
    expect(result.unresolved).toEqual([
      expect.objectContaining({
        unit: state.units[0]!.id,
        specifier: '@/missing',
      }),
    ])
  }, 30_000)

  it('returns a failed fixture as manual behavior with no moved file', async () => {
    const failedSource = storeSource.replace('count.value += 1', 'count.value += 2')
    const state = graph([unit('src/stores/counter.ts', failedSource)])
    const result = await migrate(state, failedSource, [], {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    })

    expect(result.moved).toEqual([])
    expect(result.files).toEqual([])
    expect(result.behavior).toEqual([
      expect.objectContaining({
        unit: state.units[0]!.id,
        fixtureId: 'src/stores/counter.ts:fixture',
        status: 'failed',
      }),
    ])
    expect(result.manual).toEqual([
      expect.objectContaining({
        unit: state.units[0]!.id,
        reason: expect.stringContaining('behavior-fixture-failed'),
      }),
    ])
  }, 30_000)

  it('runs the generated workspace verifier and rejects a mismatched result', async () => {
    const metadata = {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    }
    const result = await migrate(
      graph([unit('src/stores/counter.ts', storeSource)]),
      storeSource,
      [],
      metadata,
    )
    const root = mkdtempSync(join(tmpdir(), 'navirox-vue-state-verifier-'))

    try {
      writeTree(root, [...filesFor(metadata), ...result.files])
      const run = () =>
        spawnSync(process.execPath, ['scripts/verify-state.mjs'], {
          cwd: root,
          encoding: 'utf8',
        })

      expect(run().status).toBe(0)
      const documentPath = join(root, '.navirox/vue-state-verification.json')
      const document = JSON.parse(readFileSync(documentPath, 'utf8')) as {
        descriptor: { units: { file: string }[] }
        results: { fixtureId: string }[]
      }
      document.results[0]!.fixtureId = 'tampered-fixture'
      writeFileSync(documentPath, `${JSON.stringify(document, undefined, 2)}\n`)
      expect(run().status).not.toBe(0)
      document.results[0]!.fixtureId = 'src/stores/counter.ts:fixture'
      document.descriptor.units[0]!.file = 'file:///tmp/navirox-state.ts'
      writeFileSync(documentPath, `${JSON.stringify(document, undefined, 2)}\n`)
      expect(run().status).not.toBe(0)
      document.descriptor.units[0]!.file = 'src/./stores/counter.ts'
      writeFileSync(documentPath, `${JSON.stringify(document, undefined, 2)}\n`)
      expect(run().status).not.toBe(0)
      writeFileSync(documentPath, 'null\n')
      expect(run().status).not.toBe(0)
      rmSync(documentPath)
      expect(run().status).not.toBe(0)
    } finally {
      rmSync(root, { force: true, recursive: true })
    }
  }, 30_000)

  it('ignores an untrusted staged verifier that would mutate staged source', async () => {
    const metadata = {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    }
    const baseFiles = filesFor(metadata)
    const state = graph([unit('src/stores/counter.ts', storeSource)])
    const mutations = [
      "writeFileSync(fileURLToPath(new URL('../src/stores/counter.ts', import.meta.url)), 'mutated')",
      "rmSync(fileURLToPath(new URL('../src/stores/counter.ts', import.meta.url)))",
    ]

    for (const mutation of mutations) {
      const workspaceFiles = [
        ...baseFiles,
        {
          path: 'scripts/verify-state.mjs',
          content: `import { rmSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
${mutation}
`,
        },
      ]
      const result = await migrate(state, storeSource, [], metadata, undefined, workspaceFiles)

      expect(result.moved).toEqual([state.units[0]!.id])
      expect(result.files).toContainEqual({
        path: 'src/stores/counter.ts',
        content: storeSource,
      })
      expect(result.behavior[0]?.status).toBe('passed')
    }
  }, 60_000)

  it('rejects URL-like and encoded traversal descriptor paths before staging', async () => {
    const metadata = {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    }
    const base = unit('src/stores/counter.ts', storeSource)

    for (const file of [
      'file:///tmp/navirox-state.ts',
      '%2e%2e/navirox-state.ts',
      '../navirox-state.ts',
      'src/./stores/counter.ts',
      'src/stores/../stores/counter.ts',
    ]) {
      const state = graph([
        {
          ...base,
          source: { ...base.source, file },
        },
      ])

      await expect(migrate(state, storeSource, [], metadata)).rejects.toThrow(
        /unsafe|absolute|escape|descriptor/i,
      )
    }
  }, 30_000)

  it('retains engine unresolved records for allowed imports', async () => {
    const state = {
      ...graph([unit('src/stores/counter.ts', storeSource)]),
      dependencies: [],
    }
    const result = await migrate(state, storeSource, [], {
      piniaVersion: '4.0.3',
      verification: 'execute the generated Pinia setup-store behavior fixture',
    })

    expect(result.unresolved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ specifier: 'pinia' }),
        expect.objectContaining({ specifier: 'vue' }),
      ]),
    )
  }, 30_000)

  it('refuses missing and malformed evidence for state units', async () => {
    const valid = unit('src/stores/counter.ts', storeSource)
    const validGraph = graph([valid])
    const validPlan = plan(validGraph, { rules: [createVueStatePortabilityRule()] })
    const cases = [
      { metadata: {}, reason: 'missing-state-evidence' },
      {
        metadata: { statePortability: { profile: 'pinia-setup' } },
        reason: 'invalid-state-evidence',
      },
      {
        metadata: {
          statePortability: {
            ...(valid.metadata?.['statePortability'] as Record<string, unknown>),
            fixture: {
              ...(valid.metadata?.['statePortability'] as { fixture: Record<string, unknown> })
                .fixture,
              assertions: [],
            },
          },
        },
        reason: 'approved fixture has no assertions',
      },
    ]

    for (const testCase of cases) {
      const invalidUnit = { ...valid, metadata: testCase.metadata }
      const result = await migrate(graph([invalidUnit]), storeSource, [], undefined, validPlan)

      expect(result.moved).toEqual([])
      expect(result.manual).toEqual([
        expect.objectContaining({
          unit: valid.id,
          reason: expect.stringContaining(testCase.reason),
        }),
      ])
    }
  }, 30_000)
})

describe('the Vue state workspace metadata', () => {
  it('adds exact Pinia and the active entrypoint only for a Pinia candidate', () => {
    const result = createVueWorkspaceProvider().scaffold(
      workspaceInput({
        piniaVersion: '4.0.3',
        verification: 'execute the generated Pinia setup-store behavior fixture',
      }),
    )
    const packageJson = result.files.find((file) => file.path === 'package.json')?.content
    const main = result.files.find((file) => file.path === 'src/main.ts')?.content

    expect(packageJson).toContain('"pinia": "4.0.3"')
    expect(main).toContain("from 'pinia'")
    expect(main).toContain('createPinia')
    expect(result.files.some((file) => file.path.includes('verify-state'))).toBe(true)
  })

  it('keeps a composable-only workspace free of Pinia', () => {
    const result = createVueWorkspaceProvider().scaffold(workspaceInput())
    const packageJson = result.files.find((file) => file.path === 'package.json')?.content
    const main = result.files.find((file) => file.path === 'src/main.ts')?.content

    expect(packageJson).not.toContain('pinia')
    expect(main).not.toContain('createPinia')
  })
})
