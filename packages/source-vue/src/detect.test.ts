import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import { detect } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function temporaryProject(manifest: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-vue-detect-'))
  writeFileSync(join(directory, 'package.json'), manifest)
  return directory
}

describe('detecting a Vue project', () => {
  it('recognizes the fixture and says what it matched', async () => {
    const result = await detect(createProjectFiles(fixture('vue-app')))

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.confidence).toBe('high')
    expect(result.candidates[0]?.evidence[0]?.kind).toBe('manifest')
    expect(result.candidates[0]?.evidence[0]?.value).toContain('package.json')
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.vue')
  })

  it('returns no candidate when there is no manifest', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'navirox-vue-detect-'))
    const result = await detect(createProjectFiles(directory))

    expect(result.candidates).toEqual([])
  })

  it('returns no candidate when the manifest declares no Vue', async () => {
    const directory = temporaryProject(
      JSON.stringify({ name: 'not-vue', dependencies: { svelte: '^5.0.0' } }),
    )
    const result = await detect(createProjectFiles(directory))

    expect(result.candidates).toEqual([])
  })

  it('finds Vue in a development dependency as well', async () => {
    const directory = temporaryProject(
      JSON.stringify({ name: 'dev-only', devDependencies: { vue: '^3.5.0' } }),
    )
    const result = await detect(createProjectFiles(directory))

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('devDependencies.vue')
  })

  it('does not throw on a malformed manifest', async () => {
    const directory = temporaryProject('{ this is not json')
    const result = await detect(createProjectFiles(directory))

    expect(result.candidates).toEqual([])
  })
})
