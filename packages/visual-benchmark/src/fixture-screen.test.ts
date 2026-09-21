import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { StaleFixtureScreenError, compileFixtureScreen } from './fixture-screen.js'

interface FakeCompilerOptions {
  readonly code?: string
  readonly findings?: readonly { readonly code: string }[]
}

function fixture(options: FakeCompilerOptions): {
  readonly webFixture: string
  readonly emittedScreen: string
  readonly compilerEntry: string
} {
  const directory = mkdtempSync(join(tmpdir(), 'fixture-screen-'))
  const webFixture = join(directory, 'Screen.web.vue')
  const emittedScreen = join(directory, 'Screen.native.vue')
  const compilerEntry = join(directory, 'compiler.mjs')

  writeFileSync(webFixture, '<template><main /></template>\n')
  writeFileSync(emittedScreen, 'native output\n')
  writeFileSync(
    compilerEntry,
    [
      `const findings = ${JSON.stringify(options.findings ?? [])}`,
      `const code = ${JSON.stringify(options.code)}`,
      'export function compileVueTarget() {',
      "  return { report: { findings }, manifest: { compilerVersion: '9.9.9' }, code }",
      '}',
      'export function hashProvenanceManifest() {',
      "  return 'hash-abc'",
      '}',
      '',
    ].join('\n'),
  )

  return { webFixture, emittedScreen, compilerEntry }
}

describe('compiling the fixture screen', () => {
  it('accepts a fresh compilation that matches the emitted file', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({ code: 'native output\n' })

    const compilation = await compileFixtureScreen({
      compilerEntry,
      webFixture,
      emittedScreen,
      outputPath: 'packages/target-vue/fixtures/records/RecordsScreen.native.vue',
      sourceName: 'Screen.web.vue',
    })

    expect(compilation.code).toBe('native output\n')
    expect(compilation.manifestHash).toBe('hash-abc')
    expect(compilation.compilerVersion).toBe('9.9.9')
  })

  it('refuses a fresh compilation that differs from the emitted file', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({ code: 'hand edited\n' })

    await expect(
      compileFixtureScreen({
        compilerEntry,
        webFixture,
        emittedScreen,
        outputPath: 'packages/target-vue/fixtures/records/RecordsScreen.native.vue',
        sourceName: 'Screen.web.vue',
      }),
    ).rejects.toBeInstanceOf(StaleFixtureScreenError)
  })

  it('names the emitted file as the thing to regenerate', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({ code: 'hand edited\n' })

    await expect(
      compileFixtureScreen({
        compilerEntry,
        webFixture,
        emittedScreen,
        outputPath: 'packages/target-vue/fixtures/records/RecordsScreen.native.vue',
        sourceName: 'Screen.web.vue',
      }),
    ).rejects.toThrow(/Regenerate the fixture instead of editing it/)
  })

  it('refuses a fixture that no longer compiles cleanly', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({
      findings: [{ code: 'unsupported-element' }],
    })

    await expect(
      compileFixtureScreen({
        compilerEntry,
        webFixture,
        emittedScreen,
        outputPath: 'packages/target-vue/fixtures/records/RecordsScreen.native.vue',
        sourceName: 'Screen.web.vue',
      }),
    ).rejects.toThrow(/no longer compiles cleanly/)
  })

  it('refuses a compilation that reported no findings and no code', async () => {
    const { webFixture, emittedScreen, compilerEntry } = fixture({})

    await expect(
      compileFixtureScreen({
        compilerEntry,
        webFixture,
        emittedScreen,
        outputPath: 'packages/target-vue/fixtures/records/RecordsScreen.native.vue',
        sourceName: 'Screen.web.vue',
      }),
    ).rejects.toThrow(/emitted no code/)
  })
})
