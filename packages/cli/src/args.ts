/**
 * Argument parsing for the `navirox` command.
 *
 * Parsing lives apart from the command implementations so the shape of the
 * command line can be tested without starting anything. The rules are small on
 * purpose: one command, a platform, and a directory to run in.
 */

/** The platforms Navirox can launch. There is no web target by design. */
export type TPlatform = 'ios' | 'android'

/** The Metro default, and the port every React Native tool assumes. */
const DEFAULT_PORT = 8081

/** Thrown when the command line itself does not make sense. */
export class UsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UsageError'
  }
}

export interface IParsedArguments {
  /** The command to run, or undefined when the caller only asked for help. */
  readonly command: 'dev' | undefined
  readonly platform: TPlatform
  readonly directory: string | undefined
  readonly port: number
  readonly json: boolean
  readonly help: boolean
  readonly skipPreflight: boolean
}

export const HELP = `navirox

The Navirox command line interface.

Usage:
  navirox <command> [options]

Commands:
  dev    Start an app: Metro first, then the platform build, with hot reload.

Options:
  -p, --platform <ios|android>  Platform to launch. ios on macOS, android elsewhere.
  -C, --directory <path>        The app to run. Defaults to the current directory.
      --port <number>           Metro port. Defaults to ${DEFAULT_PORT}.
      --skip-preflight          Do not check the native toolchain first.
      --json                    Machine readable output.
  -h, --help                    Show this message.
`

/**
 * Reads the arguments. Throws a `UsageError` rather than guessing, because a
 * mistyped flag that silently does nothing is worse than a refusal.
 */
export function parseArguments(
  argv: readonly string[],
  hostPlatform: NodeJS.Platform = process.platform,
): IParsedArguments {
  let command: 'dev' | undefined
  let platform: TPlatform = hostPlatform === 'darwin' ? 'ios' : 'android'
  let directory: string | undefined
  let port = DEFAULT_PORT
  let json = false
  let help = false
  let skipPreflight = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === undefined) {
      continue
    }

    if (argument === '-h' || argument === '--help') {
      help = true
    } else if (argument === '--json') {
      json = true
    } else if (argument === '--skip-preflight') {
      skipPreflight = true
    } else if (argument === '-p' || argument === '--platform') {
      const value = valueFor(argv, index, argument)
      index += 1
      if (value !== 'ios' && value !== 'android') {
        throw new UsageError(`${argument} expects ios or android, not "${value}".`)
      }
      platform = value
    } else if (argument === '-C' || argument === '--directory') {
      directory = valueFor(argv, index, argument)
      index += 1
    } else if (argument === '--port') {
      port = parsePort(valueFor(argv, index, argument))
      index += 1
    } else if (argument.startsWith('-')) {
      throw new UsageError(`Unknown option "${argument}".`)
    } else if (command !== undefined) {
      throw new UsageError(`Unexpected argument "${argument}". navirox takes one command.`)
    } else if (argument !== 'dev') {
      throw new UsageError(`Unknown command "${argument}". The only command today is dev.`)
    } else {
      command = 'dev'
    }
  }

  if (command === undefined && !help) {
    throw new UsageError('A command is required. The only command today is dev.')
  }

  return { command, platform, directory, port, json, help, skipPreflight }
}

/** Reads the value that belongs to an option, refusing a missing or option-like one. */
function valueFor(argv: readonly string[], index: number, option: string): string {
  const value = argv[index + 1]
  if (value === undefined || value.startsWith('-')) {
    throw new UsageError(`${option} needs a value.`)
  }
  return value
}

function parsePort(value: string): number {
  const port = Number.parseInt(value, 10)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new UsageError(`--port expects a number between 1 and 65535, not "${value}".`)
  }
  return port
}
