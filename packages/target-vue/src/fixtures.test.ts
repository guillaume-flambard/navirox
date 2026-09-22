import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  FIELD_ATTACHMENT,
  FIELD_NOTES,
  FIELD_RECORDS,
  FIELD_STATUSES,
} from '../fixtures/field-workflow/fieldRecords.js'
import { compileVueTarget, hashProvenanceManifest } from './index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const RECORDS_DIR = join(HERE, '..', 'fixtures', 'records')
const WEB_PATH = join(RECORDS_DIR, 'RecordsScreen.web.vue')
const NATIVE_PATH = join(RECORDS_DIR, 'RecordsScreen.native.vue')
const MANIFEST_PATH = join(RECORDS_DIR, 'RecordsScreen.provenance.json')
const NATIVE_OUTPUT_PATH = 'packages/target-vue/fixtures/records/RecordsScreen.native.vue'

describe('records fixture', () => {
  it('consumes the exact compiler output byte for byte', () => {
    const source = readFileSync(WEB_PATH, 'utf8')
    const output = compileVueTarget(source, 'RecordsScreen.web.vue', NATIVE_OUTPUT_PATH)

    expect(output.report.findings).toEqual([])
    expect(output.code).toBe(readFileSync(NATIVE_PATH, 'utf8'))
    expect(hashProvenanceManifest(output.manifest)).toBe(
      hashProvenanceManifest(
        compileVueTarget(source, 'RecordsScreen.web.vue', NATIVE_OUTPUT_PATH).manifest,
      ),
    )
    expect(readFileSync(MANIFEST_PATH, 'utf8')).toBe(
      `${JSON.stringify(output.manifest, undefined, 2)}\n`,
    )
  })
})

const WORKFLOW_DIR = join(HERE, '..', 'fixtures', 'field-workflow')
const WORKFLOW_WEB_PATH = join(WORKFLOW_DIR, 'FieldWorkflowScreen.web.vue')
const WORKFLOW_NATIVE_PATH = join(WORKFLOW_DIR, 'FieldWorkflowScreen.native.vue')
const WORKFLOW_MANIFEST_PATH = join(WORKFLOW_DIR, 'FieldWorkflowScreen.provenance.json')
const WORKFLOW_OUTPUT_PATH =
  'packages/target-vue/fixtures/field-workflow/FieldWorkflowScreen.native.vue'

describe('field workflow fixture', () => {
  it('consumes the exact compiler output byte for byte', () => {
    const source = readFileSync(WORKFLOW_WEB_PATH, 'utf8')
    const output = compileVueTarget(source, 'FieldWorkflowScreen.web.vue', WORKFLOW_OUTPUT_PATH)

    expect(output.report.findings).toEqual([])
    expect(output.code).toBe(readFileSync(WORKFLOW_NATIVE_PATH, 'utf8'))
    expect(hashProvenanceManifest(output.manifest)).toBe(
      hashProvenanceManifest(
        compileVueTarget(source, 'FieldWorkflowScreen.web.vue', WORKFLOW_OUTPUT_PATH).manifest,
      ),
    )
    expect(readFileSync(WORKFLOW_MANIFEST_PATH, 'utf8')).toBe(
      `${JSON.stringify(output.manifest, undefined, 2)}\n`,
    )
  })

  it('carries only invented data and its own asset', () => {
    expect(FIELD_RECORDS).toEqual([
      { id: 1, title: 'North pump station', status: 'new', notes: 'Filter change due' },
      { id: 2, title: 'River meter', status: 'in progress', notes: 'Seal replaced' },
    ])
    expect(FIELD_STATUSES).toEqual(['new', 'in progress', 'done'])
    expect(FIELD_NOTES).toEqual(['Filter change due', 'Filter replaced', 'Site secure'])
    expect(FIELD_ATTACHMENT).toEqual({ name: 'site-photo.svg', label: 'Photo attached' })
    expect(existsSync(join(WORKFLOW_DIR, FIELD_ATTACHMENT.name))).toBe(true)
  })

  it('references no external asset or service', () => {
    const files = [
      WORKFLOW_WEB_PATH,
      WORKFLOW_NATIVE_PATH,
      WORKFLOW_MANIFEST_PATH,
      join(WORKFLOW_DIR, 'fieldRecords.ts'),
      join(WORKFLOW_DIR, FIELD_ATTACHMENT.name),
    ]

    for (const file of files) {
      const text = readFileSync(file, 'utf8')

      expect(text).not.toContain('src="http')
      expect(text).not.toContain('url(http')
      expect(text).not.toContain('fetch(')
      expect(text).not.toContain('XMLHttpRequest')
    }
  })
})
