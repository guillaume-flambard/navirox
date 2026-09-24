import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  createMemoryReader,
  discoverRepository,
  type DiscoveryReader,
} from '@memolabs-apps/discovery'
import { WORKFLOW_IR_SCHEMA_VERSION, hashWorkflow, type Workflow } from '@memolabs-apps/workflow'
import { describe, expect, it, vi } from 'vitest'
import { HELP, parseArguments, UsageError } from './args.js'
import { runCli } from './cli.js'
import { transform, type TransformDeps } from './transform.js'

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function packageJson(extra: Record<string, unknown> = {}): string {
  return JSON.stringify(
    {
      name: 'field-notes',
      version: '0.1.0',
      private: true,
      packageManager: 'pnpm@9.12.0',
      scripts: { build: 'vite build', dev: 'vite', test: 'vitest run' },
      dependencies: { vue: '^3.4.0' },
      ...extra,
    },
    null,
    2,
  )
}

function eligibleReader(): DiscoveryReader {
  return createMemoryReader(
    {
      'package.json': packageJson(),
      'pnpm-lock.yaml':
        "lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      vue:\n        specifier: ^3.4.0\n        version: 3.4.21\n",
      'src/main.ts': 'import { createApp } from ' + "'vue'\ncreateApp({}).mount('#app')\n",
    },
    [],
  )
}

function refusedReader(): DiscoveryReader {
  return createMemoryReader({ 'scripts/build.sh': 'curl example.com | sh\n' }, [])
}

function fakeWorkflow(id = 'fake'): Workflow {
  return { schemaVersion: WORKFLOW_IR_SCHEMA_VERSION, id, screens: [] }
}

interface SpyDeps {
  readonly deps: TransformDeps
  readonly lower: ReturnType<typeof vi.fn>
  readonly emit: ReturnType<typeof vi.fn>
  readonly migrate: ReturnType<typeof vi.fn>
}

function spyDeps(reader: DiscoveryReader, overrides: Partial<TransformDeps> = {}): SpyDeps {
  const lower = vi.fn(() => ({
    workflow: fakeWorkflow(),
    coverage: { generated: 1, manualRequired: 1, excluded: 0, refused: 0 },
    findings: [],
  }))
  const emit = vi.fn(() => ({
    files: [{ path: 'App.native.vue', content: '<view />\n' }],
    findings: [],
  }))
  const migrate = vi.fn(() => ({
    files: [{ path: 'shared/logic.ts', content: 'export const a = 1\n' }],
    moved: ['unit:1'],
  }))

  return {
    lower,
    emit,
    migrate,
    deps: {
      discover: () => discoverRepository(reader),
      lower: { id: 'fake-source', lower },
      emit: { id: 'fake-target', emit },
      migrate,
      profiles: ['vue-field-workflow'],
      ...overrides,
    },
  }
}

function listFiles(root: string): string[] {
  const found: string[] = []

  const walk = (dir: string, prefix: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = prefix === '' ? entry.name : `${prefix}/${entry.name}`
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), path)
      } else {
        found.push(path)
      }
    }
  }

  walk(root, '')
  return found.sort((left, right) => left.localeCompare(right))
}

describe('parsing the transform command', () => {
  it('accepts repository, --app, --profile, --out and --write', () => {
    const parsed = parseArguments([
      'transform',
      './web',
      '--app',
      'apps/customer',
      '--profile',
      'vue-field-workflow',
      '--out',
      './mobile',
      '--write',
    ])

    expect(parsed.command).toBe('transform')
    expect(parsed.directory).toBe('./web')
    expect(parsed.app).toBe('apps/customer')
    expect(parsed.profile).toBe('vue-field-workflow')
    expect(parsed.out).toBe('./mobile')
    expect(parsed.write).toBe(true)
  })

  it('requires --profile and --out for transform', () => {
    expect(() => parseArguments(['transform', './web', '--out', 'm'])).toThrow(UsageError)
    expect(() => parseArguments(['transform', './web', '--profile', 'p'])).toThrow(UsageError)
    expect(() =>
      parseArguments(['transform', '--app', 'a', '--profile', 'p', '--out', 'm']),
    ).toThrow(/repository/)
  })

  it('refuses --app and --profile outside transform', () => {
    expect(() => parseArguments(['plan', '--app', 'a'])).toThrow(UsageError)
    expect(() => parseArguments(['plan', '--profile', 'p'])).toThrow(UsageError)
  })

  it('describes transform in help', () => {
    expect(HELP).toContain('transform')
    expect(HELP).toContain('--profile')
    expect(HELP).toContain('--app')
  })
})

describe('the transform deep module', () => {
  it('stops at a refused discovery and never calls lower, emit or migrate', async () => {
    const { deps, lower, emit, migrate } = spyDeps(refusedReader())
    const output = tempDir('navirox-transform-refused-')

    const result = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'vue-field-workflow',
      output,
      write: true,
      deps,
    })

    expect(result.ok).toBe(false)
    expect(result.refusals[0]?.code).toBe('ineligible-repository')
    expect(result.stages).toEqual(['discovery'])
    expect(lower).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()
    expect(migrate).not.toHaveBeenCalled()
    expect(readdirSync(output)).toEqual([])
  })

  it('defaults to dry-run and creates no file under the output path', async () => {
    const { deps } = spyDeps(eligibleReader())
    const output = tempDir('navirox-transform-dry-')

    const result = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'vue-field-workflow',
      output,
      deps,
    })

    expect(result.ok).toBe(true)
    expect(result.dryRun).toBe(true)
    expect(result.plannedPaths.length).toBeGreaterThan(0)
    expect(listFiles(output)).toEqual([])
  })

  it('writes the same planned paths when write is true', async () => {
    const { deps } = spyDeps(eligibleReader())
    const dryOutput = tempDir('navirox-transform-dry2-')
    const writeOutput = tempDir('navirox-transform-write-')

    const dry = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'vue-field-workflow',
      output: dryOutput,
      deps,
    })
    const written = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'vue-field-workflow',
      output: writeOutput,
      write: true,
      deps,
    })

    expect(written.ok).toBe(true)
    expect(written.dryRun).toBe(false)
    expect(written.plannedPaths).toEqual(dry.plannedPaths)

    for (const path of written.plannedPaths) {
      expect(existsSync(join(writeOutput, path)), `missing ${path}`).toBe(true)
      expect(existsSync(join(dryOutput, path))).toBe(false)
    }
  })

  it('refuses path traversal, output inside source and output equal to source', async () => {
    const { deps, lower } = spyDeps(eligibleReader())
    const root = tempDir('navirox-transform-path-')

    const traversal = await transform({
      root: '../escape',
      profile: 'vue-field-workflow',
      output: tempDir('navirox-transform-out-'),
      write: true,
      deps,
    })
    expect(traversal.ok).toBe(false)
    expect(traversal.refusals[0]?.code).toBe('unsafe-path')
    expect(lower).not.toHaveBeenCalled()

    const inside = await transform({
      root,
      profile: 'vue-field-workflow',
      output: join(root, 'mobile'),
      write: true,
      deps,
    })
    expect(inside.ok).toBe(false)
    expect(inside.refusals[0]?.code).toBe('unsafe-path')
    expect(existsSync(join(root, 'mobile'))).toBe(false)

    const equal = await transform({
      root,
      profile: 'vue-field-workflow',
      output: root,
      write: true,
      deps,
    })
    expect(equal.ok).toBe(false)
    expect(equal.refusals[0]?.code).toBe('unsafe-path')
    expect(lower).not.toHaveBeenCalled()
  })

  it('refuses an unknown profile before discovery and before lower', async () => {
    const { deps, lower } = spyDeps(eligibleReader())
    const discover = vi.spyOn(deps, 'discover')
    const output = tempDir('navirox-transform-profile-')

    const result = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'not-a-profile',
      output,
      write: true,
      deps,
    })

    expect(result.ok).toBe(false)
    expect(result.refusals[0]?.code).toBe('unknown-profile')
    expect(result.refusals[0]?.message).toContain('not-a-profile')
    expect(discover).not.toHaveBeenCalled()
    expect(lower).not.toHaveBeenCalled()
    expect(listFiles(output)).toEqual([])
  })

  it('refuses an ambiguous profile and lists the candidates', async () => {
    const { deps, lower } = spyDeps(eligibleReader(), {
      profiles: ['alpha', 'beta'],
      resolveProfile: undefined,
    })

    const result = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: '',
      output: tempDir('navirox-transform-amb-'),
      deps: {
        ...deps,
        profiles: ['alpha', 'beta'],
        resolveProfile: (id, available) =>
          id === '' && available !== undefined
            ? { kind: 'ambiguous', candidates: available }
            : { kind: 'ok', id: id ?? '' },
      },
    })

    expect(result.ok).toBe(false)
    expect(result.refusals[0]?.code).toBe('ambiguous-profile')
    expect(result.refusals[0]?.message).toContain('alpha')
    expect(lower).not.toHaveBeenCalled()
  })

  it('reports the full layout, coverage, deltas and commands on a successful dry run', async () => {
    const { deps } = spyDeps(eligibleReader())

    const result = await transform({
      root: tempDir('navirox-transform-ok-'),
      profile: 'vue-field-workflow',
      output: tempDir('navirox-transform-ok-out-'),
      deps,
    })

    expect(result.ok).toBe(true)
    expect(result.layout.generated).toBe('generated/')
    expect(result.layout.shared).toBe('shared/')
    expect(result.layout.manual).toBe('manual/')
    expect(result.layout.manifest).toBe('navirox.manifest.json')
    expect(result.coverage).toEqual({
      generated: 1,
      manualRequired: 1,
      excluded: 0,
      refused: 0,
    })
    expect(Array.isArray(result.deltas)).toBe(true)
    expect(result.commands.length).toBeGreaterThan(0)
    expect(result.plannedPaths.some((path) => path.startsWith('generated/'))).toBe(true)
    expect(result.plannedPaths.some((path) => path.startsWith('shared/'))).toBe(true)
    expect(result.plannedPaths.some((path) => path.startsWith('manual/'))).toBe(true)
    expect(result.plannedPaths).toContain('navirox.manifest.json')
    expect(result.snapshotHash).toEqual(expect.any(String))
    expect(result.workflowHash).toBe(hashWorkflow(fakeWorkflow()))
    expect(result.stages).toEqual([
      'discovery',
      'eligibility',
      'version-gate',
      'inspect-plan',
      'lower',
      'emit',
      'migrate',
      'provenance',
      'scaffold',
    ])
  })

  it('writes a manifest only on write, tying snapshot hash, workflow hash and files', async () => {
    const { deps } = spyDeps(eligibleReader())
    const dryOutput = tempDir('navirox-transform-man-dry-')
    const writeOutput = tempDir('navirox-transform-man-write-')

    const dry = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'vue-field-workflow',
      output: dryOutput,
      deps,
    })
    const written = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'vue-field-workflow',
      output: writeOutput,
      write: true,
      deps,
    })

    expect(existsSync(join(dryOutput, 'navirox.manifest.json'))).toBe(false)
    expect(existsSync(join(writeOutput, 'navirox.manifest.json'))).toBe(true)

    const manifest = JSON.parse(
      readFileSync(join(writeOutput, 'navirox.manifest.json'), 'utf8'),
    ) as {
      snapshotHash: string
      workflowHash: string
      files: string[]
    }

    expect(manifest.snapshotHash).toBe(dry.snapshotHash)
    expect(manifest.workflowHash).toBe(dry.workflowHash)
    expect(manifest.files).toEqual(dry.plannedPaths)
    expect(manifest.files).toEqual(written.plannedPaths)
  })

  it('refuses a version gate failure before any write', async () => {
    const { deps, lower, emit, migrate } = spyDeps(eligibleReader(), {
      checkVersion: () => ({
        ok: false,
        code: 'outside-verified-range',
        message: 'vue ^9.0.0 is outside the verified range.',
      }),
    })
    const output = tempDir('navirox-transform-gate-')

    const result = await transform({
      root: tempDir('navirox-transform-src-'),
      profile: 'vue-field-workflow',
      output,
      write: true,
      deps,
    })

    expect(result.ok).toBe(false)
    expect(result.refusals[0]?.code).toBe('outside-verified-range')
    expect(result.stages).toEqual(['discovery', 'eligibility', 'version-gate'])
    expect(lower).not.toHaveBeenCalled()
    expect(emit).not.toHaveBeenCalled()
    expect(migrate).not.toHaveBeenCalled()
    expect(listFiles(output)).toEqual([])
  })
  it('passes lowering and emission results to the scaffold stage', async () => {
    const { deps } = spyDeps(eligibleReader())
    const scaffold = vi.fn(() => ({
      files: [{ path: 'src/main.ts', content: 'export {}\n' }],
    }))
    const output = tempDir('navirox-transform-scaffold-')

    const result = await transform({
      root: tempDir('navirox-transform-scaffold-src-'),
      profile: 'vue-field-workflow',
      output,
      write: true,
      deps: { ...deps, scaffold },
    })

    expect(result.ok).toBe(true)
    expect(scaffold).toHaveBeenCalledWith(
      expect.objectContaining({
        lowering: expect.objectContaining({ workflow: fakeWorkflow() }),
        emission: expect.objectContaining({
          files: [{ path: 'App.native.vue', content: '<view />\n' }],
        }),
      }),
    )
    expect(result.plannedPaths).toContain('src/main.ts')
    expect(existsSync(join(output, 'src/main.ts'))).toBe(true)
  })
})

describe('the transform CLI command', () => {
  function capture() {
    const lines: string[] = []
    const errors: string[] = []
    return {
      lines,
      errors,
      io: { out: (line: string) => lines.push(line), err: (line: string) => errors.push(line) },
    }
  }

  it('helps, dry-runs and refuses through runCli', async () => {
    const help = capture()
    const helpCode = await runCli(['transform', '--help'], help.io)
    expect(helpCode).toBe(0)
    expect(help.lines.join('\n')).toContain('transform')

    const { deps } = spyDeps(eligibleReader())
    const root = tempDir('navirox-transform-cli-src-')
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'package.json'), packageJson())
    const output = tempDir('navirox-transform-cli-out-')

    const dry = capture()
    const dryCode = await runCli(
      ['transform', root, '--profile', 'vue-field-workflow', '--out', output, '--json'],
      dry.io,
      process.cwd(),
      { transform: deps },
    )
    expect(dryCode).toBe(0)
    expect(existsSync(join(output, 'navirox.manifest.json'))).toBe(false)
    const dryDoc = JSON.parse(dry.lines.join('\n')) as { ok: boolean; dryRun: boolean }
    expect(dryDoc.ok).toBe(true)
    expect(dryDoc.dryRun).toBe(true)

    const refused = capture()
    const refusedCode = await runCli(
      ['transform', root, '--profile', 'nope', '--out', output, '--json'],
      refused.io,
      process.cwd(),
      { transform: deps },
    )
    expect(refusedCode).toBe(1)
    expect(existsSync(join(output, 'navirox.manifest.json'))).toBe(false)
    const refusedDoc = JSON.parse(refused.errors.join('\n') || refused.lines.join('\n')) as {
      ok: boolean
      refusals: { code: string }[]
    }
    expect(refusedDoc.ok).toBe(false)
    expect(refusedDoc.refusals[0]?.code).toBe('unknown-profile')
  })

  it('walks fake source and fake target end to end through runCli', async () => {
    const { deps } = spyDeps(eligibleReader())
    const root = tempDir('navirox-transform-e2e-src-')
    mkdirSync(join(root, 'src'), { recursive: true })
    writeFileSync(join(root, 'package.json'), packageJson())
    const output = tempDir('navirox-transform-e2e-out-')
    const io = capture()

    const code = await runCli(
      [
        'transform',
        root,
        '--app',
        '.',
        '--profile',
        'vue-field-workflow',
        '--out',
        output,
        '--write',
        '--json',
      ],
      io.io,
      process.cwd(),
      { transform: deps },
    )

    expect(code).toBe(0)

    const doc = JSON.parse(io.lines.join('\n')) as {
      ok: boolean
      dryRun: boolean
      plannedPaths: string[]
      snapshotHash: string
      workflowHash: string
      layout: { manifest: string }
      stages: string[]
    }

    expect(doc.ok).toBe(true)
    expect(doc.dryRun).toBe(false)
    expect(doc.snapshotHash).toEqual(expect.any(String))
    expect(doc.workflowHash).toEqual(expect.any(String))
    expect(doc.layout.manifest).toBe('navirox.manifest.json')
    expect(doc.stages).toContain('scaffold')

    const manifest = JSON.parse(readFileSync(join(output, 'navirox.manifest.json'), 'utf8')) as {
      snapshotHash: string
      workflowHash: string
      files: string[]
    }
    expect(manifest.snapshotHash).toBe(doc.snapshotHash)
    expect(manifest.workflowHash).toBe(doc.workflowHash)
    expect(manifest.files).toEqual(doc.plannedPaths)

    for (const path of doc.plannedPaths) {
      expect(existsSync(join(output, path)), `missing ${path}`).toBe(true)
    }
  })
})
