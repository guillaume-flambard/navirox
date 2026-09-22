import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CompanionProvenanceError,
  buildCompanionProvenance,
  refreshCompanionScreen,
  serializeCompanionProvenance,
  type CompanionProvenanceInput,
} from './companion.js'
import { StaleFixtureScreenError } from './fixture-screen.js'

const OUTPUT_PATH = 'packages/target-vue/fixtures/field-workflow/FieldWorkflowScreen.native.vue'

function entry(overrides: Partial<CompanionProvenanceInput> = {}) {
  return buildCompanionProvenance({
    fixture: 'field-workflow',
    compilerVersion: '0.1.1',
    manifestHash: 'hash-abc',
    screen: OUTPUT_PATH,
    files: [
      { path: OUTPUT_PATH, origin: 'generated', reason: 'The compiler emitted it.' },
      {
        path: 'src/fieldLogic.ts',
        origin: 'moved',
        reason: 'The planner approved it as shared.',
        decision: 'shared',
        sourcePath: 'packages/target-vue/fixtures/field-workflow/fieldLogic.ts',
        sha256: 'hash-field-logic',
      },
      { path: 'src/main.ts', origin: 'manual', reason: 'The scaffolder has no entry point.' },
    ],
    ...overrides,
  })
}

function fixture(options: { readonly code?: string }): {
  readonly webFixture: string
  readonly emittedScreen: string
  readonly compilerEntry: string
} {
  const directory = mkdtempSync(join(tmpdir(), 'companion-'))
  const webFixture = join(directory, 'Screen.web.vue')
  const emittedScreen = join(directory, 'Screen.native.vue')
  const compilerEntry = join(directory, 'compiler.mjs')

  writeFileSync(webFixture, '<template><main /></template>\n')
  writeFileSync(emittedScreen, 'native output\n')
  writeFileSync(
    compilerEntry,
    [
      `const code = ${JSON.stringify(options.code)}`,
      'export function compileVueTarget() {',
      "  return { report: { findings: [] }, manifest: { compilerVersion: '9.9.9' }, code }",
      '}',
      'export function hashProvenanceManifest() {',
      "  return 'hash-abc'",
      '}',
      '',
    ].join('\n'),
  )

  return { webFixture, emittedScreen, compilerEntry }
}

describe('building the companion provenance', () => {
  it('records every origin with its reason', () => {
    const provenance = entry()

    expect(provenance.files.map((file) => file.origin)).toEqual(['generated', 'moved', 'manual'])
    expect(provenance.files[1]?.decision).toBe('shared')
    expect(provenance.files.every((file) => file.reason.length > 0)).toBe(true)
  })

  it('refuses a file with no reason', () => {
    expect(() =>
      entry({
        files: [
          { path: OUTPUT_PATH, origin: 'generated', reason: 'The compiler emitted it.' },
          { path: 'src/main.ts', origin: 'manual', reason: '  ' },
        ],
      }),
    ).toThrow(/names no reason/)
  })

  it('refuses a moved file that names no approving decision', () => {
    expect(() =>
      entry({
        files: [
          { path: OUTPUT_PATH, origin: 'generated', reason: 'The compiler emitted it.' },
          { path: 'src/fieldLogic.ts', origin: 'moved', reason: 'It looked portable.' },
        ],
      }),
    ).toThrow(/names no planner decision/)
  })

  it('refuses a moved file that names no content hash', () => {
    expect(() =>
      entry({
        files: [
          { path: OUTPUT_PATH, origin: 'generated', reason: 'The compiler emitted it.' },
          {
            path: 'src/fieldLogic.ts',
            origin: 'moved',
            reason: 'The planner approved it as shared.',
            decision: 'shared',
          },
        ],
      }),
    ).toThrow(/names no content hash/)
  })

  it('accepts a hand-written screen that says so', () => {
    const record = entry({
      files: [{ path: OUTPUT_PATH, origin: 'manual', reason: 'Written by hand.' }],
    })

    expect(record.screen).toBe(OUTPUT_PATH)
  })

  it('refuses a record that names no screen', () => {
    expect(() =>
      entry({
        files: [{ path: 'src/fieldLogic.ts', origin: 'manual', reason: 'Written by hand.' }],
      }),
    ).toThrow(/is not named in the record/)
  })

  it('refuses a screen that is marked moved', () => {
    expect(() =>
      entry({
        files: [
          {
            path: OUTPUT_PATH,
            origin: 'moved',
            reason: 'Copied from the source.',
            decision: 'shared',
            sha256: 'hash-screen',
          },
        ],
      }),
    ).toThrow(/is marked moved/)
  })

  it('refuses the same path twice', () => {
    expect(() =>
      entry({
        files: [
          { path: OUTPUT_PATH, origin: 'generated', reason: 'The compiler emitted it.' },
          { path: OUTPUT_PATH, origin: 'manual', reason: 'Also written by hand.' },
        ],
      }),
    ).toThrow(/twice/)
  })

  it('serializes stably', () => {
    const text = serializeCompanionProvenance(entry())

    expect(text.endsWith('\n')).toBe(true)
    expect(text).toBe(`${JSON.stringify(JSON.parse(text), undefined, 2)}\n`)
  })
})

describe('refreshing the companion screen', () => {
  it('accepts a generated screen whose fresh output matches', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({ code: 'native output\n' })
    const provenance = entry()

    const compilation = await refreshCompanionScreen({
      compilerEntry,
      webFixture,
      emittedScreen,
      outputPath: OUTPUT_PATH,
      sourceName: 'Screen.web.vue',
      provenance,
    })

    expect(compilation.compilerVersion).toBe('9.9.9')
  })

  it('refuses a generated screen whose fresh output drifted', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({ code: 'hand edited\n' })
    const provenance = entry()

    await expect(
      refreshCompanionScreen({
        compilerEntry,
        webFixture,
        emittedScreen,
        outputPath: OUTPUT_PATH,
        sourceName: 'Screen.web.vue',
        provenance,
      }),
    ).rejects.toBeInstanceOf(StaleFixtureScreenError)
  })

  it('refuses a record that names no generated file at the emitted path', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({ code: 'native output\n' })
    const provenance = buildCompanionProvenance({
      fixture: 'field-workflow',
      compilerVersion: '0.1.1',
      manifestHash: 'hash-abc',
      screen: 'src/Other.native.vue',
      files: [
        { path: 'src/Other.native.vue', origin: 'generated', reason: 'The compiler emitted it.' },
      ],
    })

    await expect(
      refreshCompanionScreen({
        compilerEntry,
        webFixture,
        emittedScreen,
        outputPath: OUTPUT_PATH,
        sourceName: 'Screen.web.vue',
        provenance,
      }),
    ).rejects.toBeInstanceOf(CompanionProvenanceError)
  })
})

const HERE = dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = join(HERE, '..', '..', '..')
const ASSEMBLED_PROVENANCE = join(
  REPOSITORY_ROOT,
  'docs',
  'evidence',
  'vue-companion-assembly.provenance.json',
)

function digest(path: string): string {
  return createHash('sha256').update(readFileSync(path, 'utf8')).digest('hex')
}

/**
 * The record the assembly script wrote. Its moved hashes are the only check
 * that notices an edit to a moved unit, because the fixture test only
 * recompiles the web source.
 */
describe('the assembled companion', () => {
  const record = JSON.parse(readFileSync(ASSEMBLED_PROVENANCE, 'utf8')) as {
    readonly screen: string
    readonly files: readonly {
      readonly path: string
      readonly origin: string
      readonly reason: string
      readonly decision?: string
      readonly sourcePath?: string
      readonly sha256?: string
    }[]
  }

  it('rebuilds through the provenance builder', () => {
    expect(buildCompanionProvenance(record)).toEqual(record)
  })

  it('names every file with an origin and a reason', () => {
    expect(record.files.length).toBeGreaterThan(0)
    expect(
      record.files.every((file) => ['generated', 'moved', 'manual'].includes(file.origin)),
    ).toBe(true)
    expect(record.files.every((file) => file.reason.length > 0)).toBe(true)
    expect(record.screen).toBe(record.files.find((file) => file.origin === 'generated')?.path)
  })

  it('moves only units a planner decision approved', () => {
    for (const file of record.files.filter((entry) => entry.origin === 'moved')) {
      expect(['shared', 'portable']).toContain(file.decision)
    }
  })

  it('carries the bytes the record says it moved', () => {
    for (const file of record.files.filter((entry) => entry.origin === 'moved')) {
      expect(digest(join(REPOSITORY_ROOT, file.sourcePath ?? ''))).toBe(file.sha256)
    }
  })

  it('names a reason for every manual file', () => {
    for (const file of record.files.filter((entry) => entry.origin === 'manual')) {
      expect(file.reason.length).toBeGreaterThan(0)
    }
  })
})

const ANGULAR_PROVENANCE = join(
  REPOSITORY_ROOT,
  'docs',
  'evidence',
  'angular-companion.provenance.json',
)

/**
 * The Angular record. Its journey has no target compiler, so it must name a
 * hand-written screen and mark no file generated, and its moved hash is the only
 * check that notices an edit to the copied module.
 */
describe('the assembled Angular companion', () => {
  const record = JSON.parse(readFileSync(ANGULAR_PROVENANCE, 'utf8')) as {
    readonly screen: string
    readonly compilerVersion: string
    readonly manifestHash: string
    readonly files: readonly {
      readonly path: string
      readonly origin: string
      readonly reason: string
      readonly decision?: string
      readonly sourcePath?: string
      readonly sha256?: string
    }[]
  }

  it('rebuilds through the provenance builder', () => {
    expect(buildCompanionProvenance(record)).toEqual(record)
  })

  it('names a hand-written screen and marks nothing generated', () => {
    expect(record.files.length).toBeGreaterThan(0)
    expect(
      record.files.every((file) => ['generated', 'moved', 'manual'].includes(file.origin)),
    ).toBe(true)
    expect(record.files.every((file) => file.reason.length > 0)).toBe(true)
    expect(record.files.some((file) => file.origin === 'generated')).toBe(false)
    expect(record.files.find((file) => file.path === record.screen)?.origin).toBe('manual')
  })

  it('moves only the unit a planner decision approved', () => {
    for (const file of record.files.filter((entry) => entry.origin === 'moved')) {
      expect(['shared', 'portable']).toContain(file.decision)
    }
  })

  it('carries the bytes the record says it moved', () => {
    for (const file of record.files.filter((entry) => entry.origin === 'moved')) {
      expect(digest(join(REPOSITORY_ROOT, file.sourcePath ?? ''))).toBe(file.sha256)
    }
  })

  it('records that no compiler produced this screen', () => {
    expect(record.compilerVersion).toBe('none')
    expect(record.manifestHash).toBe('none')
  })
})
