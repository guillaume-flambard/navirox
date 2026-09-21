import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
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
