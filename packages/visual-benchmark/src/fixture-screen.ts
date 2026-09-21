/**
 * The rule that only target compiler output may be captured, in one place.
 *
 * The fixture screen is compiled from its web source at capture time and the
 * fresh output is compared with the emitted screen file. When they differ the
 * run stops before anything is installed: a hand-edited emitted file would
 * otherwise be captured as if the compiler had produced it.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export interface FixtureScreenOptions {
  readonly compilerEntry: string
  readonly webFixture: string
  readonly emittedScreen: string
  readonly outputPath: string
  readonly sourceName: string
}

export interface FixtureScreenCompilation {
  readonly code: string
  readonly manifestHash: string
  readonly compilerVersion: string
}

export class StaleFixtureScreenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StaleFixtureScreenError'
  }
}

interface CompilerModule {
  compileVueTarget(
    source: string,
    filename: string,
    outputPath?: string,
  ): {
    report: { findings: readonly unknown[] }
    manifest: { compilerVersion: string }
    code?: string
  }
  hashProvenanceManifest(manifest: unknown): string
}

function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export async function compileFixtureScreen(
  options: FixtureScreenOptions,
): Promise<FixtureScreenCompilation> {
  const compiler = (await import(
    pathToFileURL(options.compilerEntry).href
  )) as unknown as CompilerModule
  const source = readFileSync(options.webFixture, 'utf8')
  const emitted = readFileSync(options.emittedScreen, 'utf8')
  const result = compiler.compileVueTarget(source, options.sourceName, options.outputPath)

  if (result.report.findings.length > 0) {
    throw new Error(
      `The fixture no longer compiles cleanly: ${JSON.stringify(result.report.findings, null, 2)}`,
    )
  }

  if (result.code === undefined) {
    throw new Error('The compiler reported no findings but emitted no code.')
  }

  if (sha256(result.code) !== sha256(emitted)) {
    throw new StaleFixtureScreenError(
      'Fresh compiler output differs from the checked-in emitted file. Regenerate the fixture instead of editing it.',
    )
  }

  return {
    code: result.code,
    manifestHash: compiler.hashProvenanceManifest(result.manifest),
    compilerVersion: result.manifest.compilerVersion,
  }
}
