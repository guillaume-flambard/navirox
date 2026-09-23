import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  COVERAGE_KINDS,
  WORKFLOW_IR_SCHEMA_VERSION,
  WorkflowIrError,
  hashWorkflow,
  parseWorkflow,
  serializeWorkflow,
  validateWorkflow,
  type Workflow,
} from './index.js'

const source = { adapterId: 'fixture', file: 'src/App.vue' }

const positive: Workflow = {
  schemaVersion: WORKFLOW_IR_SCHEMA_VERSION,
  id: 'positive',
  screens: [
    {
      id: 'screen:home',
      name: 'Home',
      source,
      coverage: { kind: 'generated' },
      nodes: [
        {
          id: 'node:title',
          primitive: 'text',
          source: { ...source, line: 3, column: 5 },
          coverage: { kind: 'generated' },
          bindings: [{ name: 'value', expression: 'title' }],
          children: [],
        },
      ],
      state: [{ name: 'title', kind: 'ref' }],
      actions: [{ id: 'action:go', name: 'go', source }],
      layout: [{ axis: 'vertical', value: 'start' }],
      styles: [{ name: 'title', value: 'text' }],
      resources: [{ name: 'logo', kind: 'image', path: 'assets/logo.png' }],
    },
  ],
}

const boundary: Workflow = {
  schemaVersion: WORKFLOW_IR_SCHEMA_VERSION,
  id: 'boundary',
  screens: [
    {
      id: 'screen:empty',
      name: 'Empty',
      source,
      coverage: { kind: 'manual-required', reason: 'nothing to generate yet' },
      nodes: [],
      state: [],
      actions: [],
      layout: [],
      styles: [],
      resources: [],
    },
  ],
}

const refused = {
  schemaVersion: WORKFLOW_IR_SCHEMA_VERSION,
  id: 'refused',
  screens: [
    {
      id: 'screen:home',
      name: 'Home',
      source,
      coverage: { kind: 'generated' },
      nodes: [{ id: 'node:title', primitive: 'text', source, bindings: [], children: [] }],
      state: [],
      actions: [],
      layout: [],
      styles: [],
      resources: [],
    },
  ],
} as unknown as Workflow

describe('the workflow IR', () => {
  it('serializes the same workflow to the same bytes and hash', () => {
    expect(serializeWorkflow(positive)).toBe(serializeWorkflow(positive))
    expect(hashWorkflow(positive)).toBe(hashWorkflow(positive))
  })

  it('keeps the provenance of every node through a round trip', () => {
    const parsed = parseWorkflow(serializeWorkflow(positive))

    expect(parsed.screens[0]?.nodes[0]?.source).toEqual({ ...source, line: 3, column: 5 })
  })

  it('accepts the positive, boundary and refused classification fixtures', () => {
    expect(validateWorkflow(positive)).toEqual([])
    expect(validateWorkflow(boundary)).toEqual([])
    expect(COVERAGE_KINDS).toHaveLength(4)
  })

  it('refuses a node with no coverage', () => {
    const findings = validateWorkflow(refused)

    expect(findings.map((finding) => finding.code)).toContain('unknown-coverage')

    const payload = JSON.parse(serializeWorkflow(positive)) as {
      screens: { nodes: { coverage?: unknown }[] }[]
    }

    delete payload.screens[0]?.nodes[0]?.coverage

    expect(() => parseWorkflow(JSON.stringify(payload))).toThrow(WorkflowIrError)
  })

  it('refuses a schema version it does not know, naming it', () => {
    const serialized = serializeWorkflow(positive).replace(
      `"schemaVersion": ${WORKFLOW_IR_SCHEMA_VERSION}`,
      '"schemaVersion": 99',
    )

    expect(() => parseWorkflow(serialized)).toThrow(/99/)
  })

  it('imports nothing but a node builtin, so no framework can leak in', () => {
    const text = readFileSync(new URL('./index.ts', import.meta.url), 'utf8')
    const imports = [...text.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1] ?? '')

    expect(imports).toEqual(['node:crypto'])
  })
})
