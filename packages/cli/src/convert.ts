import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'

/**
 * Converts the screens a target provider fully supports, and refuses the rest.
 *
 * The provider decides: a screen is emitted only when it returns generated
 * source, and a screen it cannot compile, or whose source cannot be read, is
 * reported with its findings rather than written in a form the native renderer
 * could not display. Nothing is written unless the caller asked for it.
 */

/** A finding a target provider reports for a construct it cannot compile. */
export interface ConvertFinding {
  readonly code: string
  readonly message: string
  readonly line: number
  readonly column: number
}

/** What a target provider returns for one screen. */
export interface ConvertCompilation {
  readonly findings: readonly ConvertFinding[]
  readonly code?: string
  /** The provider's provenance manifest, already serialized. */
  readonly manifest: string
}

/** What a conversion hands a target: the template and, for Angular, its class. */
export interface ConvertInput {
  readonly source: string
  readonly script?: string
  /** Injectable module sources keyed by the `Type` in `inject(Type)`. */
  readonly injectables?: Readonly<Record<string, string>>
}

/** The target provider a conversion runs through. */
export interface ConvertTarget {
  readonly id: string
  readonly compile: (
    input: ConvertInput,
    filename: string,
    outputPath?: string,
  ) => ConvertCompilation
}

/** A screen to convert, named by the unit that carries its source. */
export interface ConvertScreen {
  readonly unit: string
  readonly file: string
}

export interface ConvertOptions {
  readonly screens: readonly ConvertScreen[]
  readonly outputRoot: string
  readonly write: boolean
  readonly readText: (path: string) => string | undefined
  /** The component source behind a template, when the target needs it. */
  readonly readScript?: (path: string) => string | undefined
  /** Sources for `inject(Type)` fields declared on that component script. */
  readonly readInjectables?: (
    path: string,
    script: string,
  ) => Readonly<Record<string, string>> | undefined
  readonly target: ConvertTarget
}

export interface ConvertedScreen {
  readonly unit: string
  readonly from: string
  readonly to: string
  readonly code: string
  readonly manifest: string
}

export interface RefusedScreen {
  readonly unit: string
  readonly from: string
  readonly findings: readonly ConvertFinding[]
}

export interface ConvertReport {
  readonly dryRun: boolean
  readonly converted: readonly ConvertedScreen[]
  readonly refused: readonly RefusedScreen[]
}

export class ConversionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConversionError'
  }
}

/** The output path a screen's source file converts to. */
function outputPathFor(file: string): string {
  return `${file.replace(/\.[^./]+$/, '')}.native.vue`
}

function isInside(root: string, candidate: string): boolean {
  const path = relative(root, candidate)

  return path.length > 0 && !path.startsWith(`..${sep}`) && path !== '..' && !path.startsWith(sep)
}

const UNREADABLE: readonly ConvertFinding[] = [
  {
    code: 'source-unreadable',
    message: 'The screen source could not be read.',
    line: 1,
    column: 1,
  },
]

export function runConversion(options: ConvertOptions): ConvertReport {
  const outputRoot = resolve(options.outputRoot)
  const converted: ConvertedScreen[] = []
  const refused: RefusedScreen[] = []

  for (const screen of options.screens) {
    const source = options.readText(screen.file)

    if (source === undefined) {
      refused.push({ unit: screen.unit, from: screen.file, findings: UNREADABLE })
      continue
    }

    const to = outputPathFor(screen.file)
    const script = options.readScript?.(screen.file)
    const injectables =
      script === undefined ? undefined : options.readInjectables?.(screen.file, script)
    const result = options.target.compile(
      {
        source,
        ...(script === undefined ? {} : { script }),
        ...(injectables === undefined ? {} : { injectables }),
      },
      screen.file,
      to,
    )

    if (result.code === undefined) {
      refused.push({ unit: screen.unit, from: screen.file, findings: result.findings })
      continue
    }

    // Checked before any write, so a screen that would escape the output
    // directory stops the run with nothing on disk.
    if (!isInside(outputRoot, resolve(outputRoot, to))) {
      throw new ConversionError(
        `A converted screen wanted to write ${to}, which resolves outside the output directory. Nothing was written.`,
      )
    }

    converted.push({
      unit: screen.unit,
      from: screen.file,
      to,
      code: result.code,
      manifest: result.manifest,
    })
  }

  if (!options.write) {
    return { dryRun: true, converted, refused }
  }

  for (const screen of converted) {
    const target = resolve(outputRoot, screen.to)

    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, screen.code)
    writeFileSync(`${target}.provenance.json`, screen.manifest)
  }

  return { dryRun: false, converted, refused }
}
