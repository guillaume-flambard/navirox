import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import { detect } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function temporaryProject(manifest: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-svelte-detect-'))
  writeFileSync(join(directory, 'package.json'), manifest)
  return directory
}

describe('detecting a Svelte project', () => {
  it('recognizes the fixture and says what it matched', async () => {
    const result = await detect(createProjectFiles(fixture('svelte-app')))

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('package.json')
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.svelte')
  })

  it('returns no candidate when there is no manifest', async () => {
    const result = await detect(createProjectFiles(mkdtempSync(join(tmpdir(), 'navirox-svelte-'))))

    expect(result.candidates).toEqual([])
  })

  it('returns no candidate for a project that is not Svelte', async () => {
    const directory = temporaryProject(
      JSON.stringify({ name: 'not-svelte', dependencies: { vue: '^3.5.43' } }),
    )

    expect((await detect(createProjectFiles(directory))).candidates).toEqual([])
  })

  it('does not throw on a malformed manifest', async () => {
    const directory = temporaryProject('{ not json')

    expect((await detect(createProjectFiles(directory))).candidates).toEqual([])
  })
})
