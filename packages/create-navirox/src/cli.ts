import { createInterface } from 'node:readline/promises'
import { isAbsolute, resolve } from 'node:path'
import { InvalidAppNameError, deriveNames } from './names.js'
import {
  scaffoldApp,
  TargetNotEmptyError,
  TemplateMissingError,
  type IScaffoldResult,
} from './scaffold.js'

/**
 * The `create-navirox` command, as a function.
 *
 * The entry point in `bin.ts` is a shebang and three lines. Keeping the body
 * here is what lets a test call the command and read its output, because the
 * process is only touched in `bin.ts`.
 */

export const HELP = `create-navirox

Scaffolds a Navirox app: a Vue 3 single file component rendering native views
on iOS and Android.

Usage
  npm create navirox <name> [options]
  npx create-navirox <name> [options]

Arguments
  <name>                  App name. Any of my-app, MyApp or "my app" work.

Options
  -d, --directory <path>  Where to create the app. Defaults to ./<name>.
      --json              Print one JSON object instead of prose, and never prompt.
  -h, --help              Print this.
`

export interface ICliIo {
  readonly out: (line: string) => void
  readonly err: (line: string) => void
}

interface IParsedArguments {
  readonly name: string | undefined
  readonly directory: string | undefined
  readonly json: boolean
  readonly help: boolean
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UsageError'
  }
}

/** Parses the arguments by hand: the surface is small and the messages are ours. */
export function parseArguments(argv: readonly string[]): IParsedArguments {
  let name: string | undefined
  let directory: string | undefined
  let json = false
  let help = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === undefined) {
      continue
    }

    if (argument === '-h' || argument === '--help') {
      help = true
    } else if (argument === '--json') {
      json = true
    } else if (argument === '-d' || argument === '--directory') {
      const value = argv[index + 1]
      if (value === undefined || value.startsWith('-')) {
        throw new UsageError(`${argument} needs a path after it.`)
      }
      directory = value
      index += 1
    } else if (argument.startsWith('-')) {
      throw new UsageError(`Unknown option "${argument}". Run with --help to see the options.`)
    } else if (name === undefined) {
      name = argument
    } else {
      throw new UsageError(`Unexpected extra argument "${argument}". Pass one app name.`)
    }
  }

  return { name, directory, json, help }
}

/**
 * Runs the scaffolder and reports the result. Returns an exit code rather than
 * exiting the process, so this stays callable from a test.
 */
export async function runCli(
  argv: readonly string[],
  io: ICliIo,
  cwd = process.cwd(),
): Promise<number> {
  let parsed: IParsedArguments
  try {
    parsed = parseArguments(argv)
  } catch (error) {
    return reportFailure(error, false, io)
  }

  if (parsed.help) {
    io.out(HELP)
    return 0
  }

  let name = parsed.name
  if (name === undefined) {
    if (parsed.json) {
      return reportFailure(
        new UsageError('A name is required with --json, because nothing can be prompted for.'),
        true,
        io,
      )
    }
    try {
      name = await promptForName()
    } catch (error) {
      return reportFailure(error, false, io)
    }
  }

  try {
    const names = deriveNames(name)
    const targetDir =
      parsed.directory === undefined
        ? resolve(cwd, names.dirName)
        : resolveTarget(parsed.directory, cwd)
    const result = scaffoldApp({ name, targetDir })

    if (parsed.json) {
      io.out(JSON.stringify(toJson(result), null, 2))
    } else {
      reportSuccess(result, io)
    }
    return 0
  } catch (error) {
    return reportFailure(error, parsed.json, io)
  }
}

function resolveTarget(directory: string, cwd: string): string {
  return isAbsolute(directory) ? directory : resolve(cwd, directory)
}

/**
 * Asks for a name, once. Reached only when nothing was passed on the command
 * line and the output is meant for a person, never under `--json`.
 */
async function promptForName(): Promise<string> {
  const readline = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await readline.question('App name: ')
    const trimmed = answer.trim()
    if (trimmed.length === 0) {
      throw new UsageError('No name given.')
    }
    return trimmed
  } finally {
    readline.close()
  }
}

interface IJsonResult {
  readonly ok: boolean
  readonly name: string
  readonly dirName: string
  readonly directory: string
  readonly files: number
  readonly warnings: readonly string[]
}

function toJson(result: IScaffoldResult): IJsonResult {
  return {
    ok: true,
    name: result.names.displayName,
    dirName: result.names.dirName,
    directory: result.targetDir,
    files: result.files,
    warnings: result.warnings,
  }
}

function reportSuccess(result: IScaffoldResult, io: ICliIo): void {
  const { names } = result
  io.out(`Created ${names.displayName} in ${result.targetDir}`)
  io.out(`${result.files} files. Android package ${names.packageId}.`)
  for (const warning of result.warnings) {
    io.out(`Note: ${warning}`)
  }
  io.out('')
  io.out('Next')
  io.out(`  cd ${names.dirName}`)
  io.out('  pnpm install')
  io.out('  npx navirox dev')
}

function reportFailure(error: unknown, json: boolean, io: ICliIo): number {
  const name = error instanceof Error ? error.name : 'Error'
  const message = error instanceof Error ? error.message : String(error)

  if (json) {
    io.out(JSON.stringify({ ok: false, error: { name, message } }, null, 2))
  } else {
    io.err(message)
    if (error instanceof UsageError || error instanceof InvalidAppNameError) {
      io.err('Run with --help to see how this command is called.')
    }
    if (error instanceof TemplateMissingError || error instanceof TargetNotEmptyError) {
      io.err('Nothing was changed.')
    }
  }
  return 1
}
