import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppGraph, AppGraphFragment } from '@memolabs-apps/graph'
import { APP_GRAPH_SCHEMA_VERSION } from '@memolabs-apps/graph'
import { plan } from '@memolabs-apps/planner'
import { describe, expect, it } from 'vitest'
import {
  GENERIC_TRANSFORMS,
  MigrationError,
  MigrationStateError,
  fingerprintOf,
  parseState,
  runMigration,
  serializeState,
} from './index'

function workspace(): { readonly root: string; readonly out: string } {
  const root = mkdtempSync(join(tmpdir(), 'navirox-migrate-src-'))
  const out = mkdtempSync(join(tmpdir(), 'navirox-migrate-out-'))
  return { root, out }
}

function fragment(units: AppGraphFragment['units']): AppGraph {
  return {
    schemaVersion: APP_GRAPH_SCHEMA_VERSION,
    source: { adapterId: 'fixture', displayName: 'Fixture' },
    routes: [],
    screens: [],
    units,
    actions: [],
    data: [],
    capabilities: [],
    dependencies: [],
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

describe('the migration state', () => {
  it('fingerprints content, and a change of content changes it', () => {
    expect(fingerprintOf('export const a = 1')).toBe(fingerprintOf('export const a = 1'))
    expect(fingerprintOf('export const a = 1')).not.toBe(fingerprintOf('export const a = 2'))
  })

  it('refuses a version it does not know rather than guessing', () => {
    expect(() => parseState('{"schemaVersion": 99}')).toThrow(MigrationStateError)
    expect(() => parseState('{"schemaVersion": 99}')).toThrow(/reads 1/)
  })

  it('round trips', () => {
    const state = {
      schemaVersion: 1,
      adapterId: 'fixture',
      outputRoot: '/out',
      units: {
        'fixture:a': { fingerprint: 'abc', output: 'a.ts', transforms: ['copy-shared-unit'] },
      },
    }

    expect(parseState(serializeState(state))).toEqual(state)
  })
})

describe('running a migration', () => {
  it('touches nothing in a dry run and reports what it would write', () => {
    const { root, out } = workspace()
    writeFileSync(join(root, 'x'), '')
    const graph = fragment([logicUnit])
    const report = runMigration({
      graph,
      plan: plan(graph),
      adapterId: 'fixture',
      sourceRoot: root,
      outputRoot: out,
      readText: (path) => (path === 'src/lib/money.ts' ? 'export const a = 1\n' : undefined),
    })

    expect(report.dryRun).toBe(true)
    expect(report.files).toHaveLength(1)
    expect(existsSync(join(out, 'src/lib/money.ts'))).toBe(false)
  })

  it('copies shared logic byte for byte when told to write', () => {
    const { root, out } = workspace()
    writeFileSync(join(root, 'x'), '')
    const content = 'export const a = 1\n\n// a comment that must survive\n'
    const graph = fragment([logicUnit])
    const report = runMigration({
      graph,
      plan: plan(graph),
      adapterId: 'fixture',
      sourceRoot: root,
      outputRoot: out,
      write: true,
      readText: () => content,
    })

    expect(report.dryRun).toBe(false)
    expect(readFileSync(join(out, 'src/lib/money.ts'), 'utf8')).toBe(content)
  })

  it('does the work once: a second run at the same content is a no-op', () => {
    const { root, out } = workspace()
    const graph = fragment([logicUnit])
    const planOf = plan(graph)
    const options = {
      graph,
      plan: planOf,
      adapterId: 'fixture',
      sourceRoot: root,
      outputRoot: out,
      write: true,
      readText: () => 'export const a = 1\n',
    }
    const first = runMigration(options)
    const state = {
      schemaVersion: 1,
      adapterId: 'fixture',
      outputRoot: out,
      units: {
        [logicUnit.id]: {
          fingerprint: fingerprintOf('export const a = 1\n'),
          output: 'src/lib/money.ts',
          transforms: ['copy-shared-unit'],
        },
      },
    }
    const second = runMigration({ ...options, state })

    expect(first.moved).toContain(logicUnit.id)
    expect(second.moved).toEqual([])
    expect(second.skipped[0]?.reason).toContain('already migrated')
  })

  it('treats a changed unit as work again', () => {
    const { root, out } = workspace()
    const graph = fragment([logicUnit])
    const report = runMigration({
      graph,
      plan: plan(graph),
      adapterId: 'fixture',
      sourceRoot: root,
      outputRoot: out,
      readText: () => 'export const a = 2\n',
      state: {
        schemaVersion: 1,
        adapterId: 'fixture',
        outputRoot: out,
        units: {
          [logicUnit.id]: {
            fingerprint: fingerprintOf('export const a = 1\n'),
            output: 'src/lib/money.ts',
            transform: 'copy-shared-unit',
          },
        },
      },
    })

    expect(report.moved).toContain(logicUnit.id)
  })

  it('leaves a view alone and says why', () => {
    const { root, out } = workspace()
    const graph = fragment([viewUnit])
    const report = runMigration({
      graph,
      plan: plan(graph),
      adapterId: 'fixture',
      sourceRoot: root,
      outputRoot: out,
      readText: () => '<template />',
    })

    expect(report.files).toEqual([])
    expect(report.skipped[0]?.reason).toContain('native-replacement')
  })

  it('refuses to migrate in place', () => {
    const { root } = workspace()
    const graph = fragment([logicUnit])

    expect(() =>
      runMigration({
        graph,
        plan: plan(graph),
        adapterId: 'fixture',
        sourceRoot: root,
        outputRoot: root,
        readText: () => undefined,
      }),
    ).toThrow(/in place/)
  })

  it('refuses a path that escapes the output directory', () => {
    const { root, out } = workspace()
    const graph = fragment([logicUnit])

    expect(() =>
      runMigration({
        graph,
        plan: plan(graph),
        adapterId: 'fixture',
        sourceRoot: root,
        outputRoot: out,
        write: true,
        readText: () => 'x',
        transforms: [
          {
            id: 'escaping-transform',
            family: 'generic',
            applies: () => true,
            write: () => [{ relativePath: '../escaped.txt', content: 'x', from: 'x' }],
          },
        ],
      }),
    ).toThrow(/outside the output directory/)
    expect(existsSync(join(out, '..', 'escaped.txt'))).toBe(true === false)
  })

  it('restores what it wrote when a run fails part way', () => {
    const { root, out } = workspace()
    // A file where a directory would have to be, so the second write cannot happen.
    writeFileSync(join(out, 'blocked'), 'a file, not a directory')
    const graph = fragment([logicUnit, viewUnit])
    const custom = plan(graph)

    try {
      runMigration({
        graph,
        plan: {
          ...custom,
          decisions: custom.decisions.map((decision) => ({
            ...decision,
            classification: 'shared' as const,
          })),
        },
        adapterId: 'fixture',
        sourceRoot: root,
        outputRoot: out,
        write: true,
        readText: () => 'x',
        transforms: [
          {
            ...GENERIC_TRANSFORMS[0]!,
            write: () => [{ relativePath: 'ok.txt', content: 'x', from: 'x' }],
          },
          {
            id: 'second-transform',
            family: 'generic',
            applies: () => true,
            write: () => [{ relativePath: 'blocked/nested.txt', content: 'x', from: 'x' }],
          },
        ],
      })
      throw new Error('the run should have failed')
    } catch (error) {
      expect(error).toBeInstanceOf(MigrationError)
      expect(String(error)).toContain('restored')
      // The first write is gone again, and the file that was already there is not.
      expect(existsSync(join(out, 'ok.txt'))).toBe(false)
      expect(readFileSync(join(out, 'blocked'), 'utf8')).toBe('a file, not a directory')
    }
  })
})
