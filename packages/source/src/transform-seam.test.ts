import { APP_GRAPH_SCHEMA_VERSION, type AppGraph } from '@memolabs-apps/graph'
import { WORKFLOW_IR_SCHEMA_VERSION, type Workflow } from '@memolabs-apps/workflow'
import { describe, expect, it } from 'vitest'
import type {
  EmissionResult,
  LoweringResult,
  LoweringSnapshot,
  SourceTransformProvider,
  TargetProvider,
} from './transform-seam.js'

/**
 * The seam, proven without either half existing in production yet.
 *
 * A fake lowerer and a fake target meet at the IR, and two contrasting lowerers
 * share one interface, which is what keeps a second framework from widening it.
 */

function graph(): AppGraph {
  return {
    schemaVersion: APP_GRAPH_SCHEMA_VERSION,
    source: { adapterId: 'fixture', displayName: 'Fixture' },
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

function snapshot(): LoweringSnapshot {
  return { adapterId: 'fixture', revision: 'fixture@1', graph: graph() }
}

function workflow(id: string): Workflow {
  return { schemaVersion: WORKFLOW_IR_SCHEMA_VERSION, id, screens: [] }
}

/** A provider that names one framework but exposes only the shared interface. */
function lowerer(id: string): SourceTransformProvider {
  return {
    id,
    lower: (selection, from, profile): LoweringResult => ({
      workflow: workflow(`${id}:${profile.id}`),
      coverage: { generated: 0, manualRequired: 0, excluded: 0, refused: 0 },
      findings:
        selection.rootDir === ''
          ? [{ code: 'empty-root', message: 'the selected root is empty' }]
          : [],
    }),
  }
}

const target: TargetProvider = {
  id: 'target:fixture',
  emit: (from, profile): EmissionResult => ({
    files: [{ path: 'App.native.vue', content: `<!-- ${from.id} for ${profile.id} -->` }],
    findings: [],
  }),
}

describe('the source transform provider seam', () => {
  it('lets a lowerer return an IR that validates', async () => {
    const result = await lowerer('lowerer:a').lower({ rootDir: '/app' }, snapshot(), { id: 'vue' })

    expect(result.workflow.schemaVersion).toBe(WORKFLOW_IR_SCHEMA_VERSION)
    expect(result.findings).toEqual([])
  })

  it('lets a target emit from the IR alone', async () => {
    const result = await target.emit(workflow('lowerer:a:vue'), { id: 'native' })

    expect(result.files[0]?.path).toBe('App.native.vue')
    expect(result.files[0]?.content).toContain('lowerer:a:vue')
  })

  it('keeps two contrasting lowerers on one interface', () => {
    const first = lowerer('lowerer:a')
    const second = lowerer('lowerer:b')

    expect(Object.keys(first).sort()).toEqual(Object.keys(second).sort())
    expect(Object.keys(first)).toEqual(['id', 'lower'])
  })

  it('reports a finding rather than throwing when a lowering cannot proceed', async () => {
    const result = await lowerer('lowerer:a').lower({ rootDir: '' }, snapshot(), { id: 'vue' })

    expect(result.findings.map((finding) => finding.code)).toEqual(['empty-root'])
  })
})
