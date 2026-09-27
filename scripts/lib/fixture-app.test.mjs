/**
 * The named workspace contract, and the scaffolder's failure report.
 *
 * Both of these exist because a capture retry could never succeed and could not
 * say why. A named workspace is not cleaned when a run ends, so the next attempt
 * on it found the previous attempt's `app` directory, and `scaffold` refuses a
 * target that is not empty. The second attempt therefore died at the scaffolder
 * every time, and the report said only "The scaffolder exited 1." because the
 * scaffolder writes a `--json` failure to stdout while the report was built from
 * stderr alone.
 */
import { existsSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { prepareNamedWorkspace } from './fixture-app.mjs'

describe('prepareNamedWorkspace', () => {
  it('leaves a workspace ready for the scaffolder', () => {
    const parent = mkdtempSync(join(tmpdir(), 'navirox-named-workspace-'))

    const first = prepareNamedWorkspace(join(parent, 'capture'))

    expect(first.workspace).toBe(join(parent, 'capture'))
    expect(first.artifactsDir).toBe(join(first.workspace, 'artifacts'))
  })

  it('clears the previous attempt so a retry can scaffold at all', () => {
    const parent = mkdtempSync(join(tmpdir(), 'navirox-named-workspace-'))
    const workspace = join(parent, 'capture')

    const first = prepareNamedWorkspace(workspace)

    // Exactly what a finished attempt leaves behind: a scaffolded app, including
    // the captures the upload step reads, plus the packed artifacts.
    mkdirSync(join(first.workspace, 'app', 'scenario-artifacts'), { recursive: true })
    writeFileSync(join(first.workspace, 'app', 'scenario-artifacts', 'rest.ios.png'), 'png')
    writeFileSync(join(first.workspace, 'app', 'package.json'), '{}')
    writeFileSync(join(first.artifactsDir, 'ui.tgz'), 'tgz')

    prepareNamedWorkspace(workspace)

    // The target the scaffolder refuses when it is not empty has to be gone, or
    // the retry dies in front of the scaffolder instead of reaching it. This is
    // the assertion the old code failed: it only created the artifacts directory
    // and left `app` exactly where the previous attempt had put it.
    expect(existsSync(join(workspace, 'app'))).toBe(false)
    expect(existsSync(join(workspace, 'artifacts'))).toBe(true)
  })

  it('reports the same directory and artifacts path on every attempt', () => {
    const parent = mkdtempSync(join(tmpdir(), 'navirox-named-workspace-'))
    const workspace = join(parent, 'capture')

    const first = prepareNamedWorkspace(workspace)
    const second = prepareNamedWorkspace(workspace)

    expect(second.workspace).toBe(first.workspace)
    expect(second.artifactsDir).toBe(first.artifactsDir)
  })
})
