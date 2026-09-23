import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppGraph, AppGraphFragment } from '@memolabs-apps/graph'
import { APP_GRAPH_SCHEMA_VERSION } from '@memolabs-apps/graph'
import type { MigrationClass } from '@memolabs-apps/planner'
import { plan } from '@memolabs-apps/planner'
import { describe, expect, it } from 'vitest'
import { REWRITE_RULES, addRelativeExtensions, runMigration, type TransformContext } from './index'

function workspace(): { readonly root: string; readonly out: string } {
  const root = mkdtempSync(join(tmpdir(), 'navirox-rewrite-src-'))
  const out = mkdtempSync(join(tmpdir(), 'navirox-rewrite-out-'))
  return { root, out }
}

function fragment(
  units: AppGraphFragment['units'],
  dependencies: AppGraphFragment['dependencies'] = [],
): AppGraph {
  return {
    schemaVersion: APP_GRAPH_SCHEMA_VERSION,
    source: { adapterId: 'fixture', displayName: 'Fixture' },
    routes: [],
    screens: [],
    units,
    actions: [],
    data: [],
    capabilities: [],
    dependencies,
    edges: [],
    findings: [],
  }
}

const logicUnit = {
  id: 'fixture:src/lib/money.ts:domain-module:default',
  kind: 'domain-module' as const,
  source: { file: 'src/lib/money.ts', adapterId: 'fixture' },
  dependencies: [],
}

const viewUnit = {
  id: 'fixture:src/App.vue:component:default',
  kind: 'component' as const,
  source: { file: 'src/App.vue', adapterId: 'fixture' },
  dependencies: [],
}

function context(
  file: string,
  files: Readonly<Record<string, string>>,
  classification: MigrationClass = 'shared',
): TransformContext {
  const id = `fixture:${file}:domain-module:default`

  return {
    unit: { id, kind: 'domain-module', source: { file, adapterId: 'fixture' }, dependencies: [] },
    decision: { subject: id, classification, confidence: 'high', reasons: [], evidence: [] },
    readText: (path) => files[path],
  }
}

describe('the relative-extension rewrite', () => {
  it('produces the same output for the same input on every run', () => {
    const files = {
      'src/lib/money.ts': "import { a } from './helpers'\n",
      'src/lib/helpers.ts': 'export const a = 1\n',
    }
    const first = addRelativeExtensions.write(context('src/lib/money.ts', files))
    const second = addRelativeExtensions.write(context('src/lib/money.ts', files))

    expect(first).toEqual(second)
    expect(first[0]?.content).toBe("import { a } from './helpers.ts'\n")
  })

  it('cites the rule that fired for every write it makes', () => {
    const files = {
      'src/lib/money.ts': "import { a } from './helpers'\n",
      'src/lib/helpers.ts': '',
    }
    const writes = addRelativeExtensions.write(context('src/lib/money.ts', files))

    expect(writes).toHaveLength(1)
    expect(writes[0]?.rule).toBe('explicit-relative-extension')
    expect(REWRITE_RULES).toContain(writes[0]?.rule)
  })

  it('leaves a specifier it cannot resolve alone rather than guessing', () => {
    const writes = addRelativeExtensions.write(
      context('src/lib/money.ts', { 'src/lib/money.ts': "import { a } from './missing'\n" }),
    )

    expect(writes).toEqual([])
  })

  it('does not claim a copy: a file with nothing to rewrite produces no write', () => {
    const writes = addRelativeExtensions.write(
      context('src/lib/money.ts', { 'src/lib/money.ts': 'export const a = 1\n' }),
    )

    expect(writes).toEqual([])
  })
})

describe('the rewrite through the real planner and engine', () => {
  it('rewrites the moved file and leaves the surrounding code intact', () => {
    const { root, out } = workspace()
    const source = ["import { a } from './helpers'", 'export const total = a + 1', ''].join('\n')
    const graph = fragment([logicUnit])
    const report = runMigration({
      graph,
      plan: plan(graph),
      adapterId: 'fixture',
      sourceRoot: root,
      outputRoot: out,
      write: true,
      readText: (path) => {
        if (path === 'src/lib/money.ts') return source
        if (path === 'src/lib/helpers.ts') return 'export const a = 1\n'
        return undefined
      },
    })

    const written = readFileSync(join(out, 'src/lib/money.ts'), 'utf8')

    expect(written).toContain("from './helpers.ts'")
    expect(written).toContain('export const total = a + 1')
    expect(report.files[0]?.rule).toBe('explicit-relative-extension')
  })

  it('does not rewrite a unit classified outside its classes', () => {
    const { root, out } = workspace()
    const graph = fragment([viewUnit])
    const report = runMigration({
      graph,
      plan: plan(graph),
      adapterId: 'fixture',
      sourceRoot: root,
      outputRoot: out,
      write: true,
      readText: () => "import { a } from './helpers'\n",
    })

    expect(report.files).toEqual([])
    expect(report.skipped[0]?.reason).toContain('native-replacement')
  })

  it('restores a rewritten file to its previous bytes when the run fails after the write', () => {
    const { root, out } = workspace()
    // A file where a directory would have to be, so the second write cannot happen.
    writeFileSync(join(out, 'blocked'), 'a file, not a directory')
    mkdirSync(join(out, 'src/lib'), { recursive: true })
    writeFileSync(join(out, 'src/lib/money.ts'), 'PREVIOUS BYTES\n')

    const graph = fragment([logicUnit])

    expect(() =>
      runMigration({
        graph,
        plan: plan(graph),
        adapterId: 'fixture',
        sourceRoot: root,
        outputRoot: out,
        write: true,
        readText: (path) => {
          if (path === 'src/lib/money.ts') return "import { a } from './helpers'\n"
          if (path === 'src/lib/helpers.ts') return 'export const a = 1\n'
          return undefined
        },
        transforms: [
          addRelativeExtensions,
          {
            id: 'failing-transform',
            family: 'generic',
            applies: () => true,
            write: () => [{ relativePath: 'blocked/nested.txt', content: 'x', from: 'x' }],
          },
        ],
      }),
    ).toThrow(/restored/)

    expect(readFileSync(join(out, 'src/lib/money.ts'), 'utf8')).toBe('PREVIOUS BYTES\n')
  })
})
