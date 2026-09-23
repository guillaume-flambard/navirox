/**
 * Argument parsing for the `navirox` command.
 *
 * Parsing lives apart from the command implementations so the shape of the
 * command line can be tested without starting anything. The rules are small on
 * purpose: a command, a platform, and a directory to work in.
 */

/** The platforms Navirox can launch. There is no web target by design. */
export type TPlatform = 'ios' | 'android'

/** The Metro default, and the port every React Native tool assumes. */
const DEFAULT_PORT = 8081

/** The commands this tool knows. Adding one is a change here and in the dispatch. */
export type TCommand = 'analyze' | 'dev' | 'doctor' | 'inspect' | 'plan' | 'migrate' | 'convert'

/** Thrown when the command line itself does not make sense. */
export class UsageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UsageError'
  }
}

export interface IParsedArguments {
  /** The command to run, or undefined when the caller only asked for help. */
  readonly command: TCommand | undefined
  readonly platform: TPlatform
  readonly directory: string | undefined
  readonly port: number
  readonly json: boolean
  readonly help: boolean
  readonly skipPreflight: boolean
  /** The source adapter to use, bypassing detection. Only meaningful for source analysis. */
  readonly framework: string | undefined
  /** Where a migration writes. Only meaningful for migrate. */
  readonly out: string | undefined
  /** Whether a migration performs its writes. Absent means a dry run. */
  readonly write: boolean
  /** Whether the plan asks TypeSafe for a second opinion on undecided subjects. */
  readonly semantic: boolean
}

export const HELP = `navirox

The Navirox command line interface.

Usage:
  navirox <command> [options]
  navirox analyze [project] [options]

Commands:
  analyze Analyze a web project and detect its source framework.
  dev     Start an app: Metro first, then the platform build, with hot reload.
  doctor  Report the environment, the installed runtime, and what to fix.
  inspect Read an existing project and report what moving it to native involves.
  plan    Read a project and report what each part of it can become.
  migrate Plan a migration, and with --write perform the part that is provably safe.
  convert Convert the screens a target provider fully supports, and move the shared units.

Options:
  -p, --platform <ios|android>  Platform to target. ios on macOS, android elsewhere.
  -C, --directory <path>        The project to work on. Defaults to the current directory.
      --json                    Machine readable output.
  -h, --help                    Show this message.

dev only:
      --port <number>           Metro port. Defaults to ${DEFAULT_PORT}.
      --skip-preflight          Do not check the native toolchain first.

analyze, inspect, plan, migrate and convert only:
      --framework <id>          Use a named source adapter instead of detecting one.

migrate and convert only:
      --out <path>              Where to write. Required by --write.
      --write                   Perform the run. Without it, nothing is written.

plan only:
      --semantic                Ask TypeSafe for a second opinion on the subjects the
                                rules could not decide. Needs TYPESAFE_API_KEY.
`

/**
 * Reads the arguments. Throws a `UsageError` rather than guessing, because a
 * mistyped flag that silently does nothing is worse than a refusal.
 */
export function parseArguments(
  argv: readonly string[],
  hostPlatform: NodeJS.Platform = process.platform,
): IParsedArguments {
  let command: TCommand | undefined
  let platform: TPlatform = hostPlatform === 'darwin' ? 'ios' : 'android'
  let directory: string | undefined
  let port = DEFAULT_PORT
  let json = false
  let help = false
  let skipPreflight = false
  let framework: string | undefined
  // Tracked apart from the values, because a command that ignores a flag has to
  // say so, and the defaults are indistinguishable from a flag nobody passed.
  let portGiven = false
  let skipPreflightGiven = false
  let frameworkGiven = false
  let platformGiven = false
  let out: string | undefined
  let outGiven = false
  let write = false
  let writeGiven = false
  let semantic = false
  let semanticGiven = false

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
      skipPreflightGiven = true
    } else if (argument === '-p' || argument === '--platform') {
      const value = valueFor(argv, index, argument)
      index += 1
      if (value !== 'ios' && value !== 'android') {
        throw new UsageError(`${argument} expects ios or android, not "${value}".`)
      }
      platform = value
      platformGiven = true
    } else if (argument === '-C' || argument === '--directory') {
      directory = valueFor(argv, index, argument)
      index += 1
    } else if (argument === '--write') {
      write = true
      writeGiven = true
    } else if (argument === '--semantic') {
      semantic = true
      semanticGiven = true
    } else if (argument === '--out') {
      out = valueFor(argv, index, argument)
      outGiven = true
      index += 1
    } else if (argument === '--framework') {
      framework = valueFor(argv, index, argument)
      frameworkGiven = true
      index += 1
    } else if (argument === '--port') {
      port = parsePort(valueFor(argv, index, argument))
      portGiven = true
      index += 1
    } else if (argument.startsWith('-')) {
      throw new UsageError(`Unknown option "${argument}".`)
    } else if (command === 'analyze' && directory === undefined) {
      directory = argument
    } else if (command !== undefined) {
      throw new UsageError(`Unexpected argument "${argument}". navirox takes one command.`)
    } else if (
      argument !== 'dev' &&
      argument !== 'doctor' &&
      argument !== 'analyze' &&
      argument !== 'inspect' &&
      argument !== 'plan' &&
      argument !== 'migrate' &&
      argument !== 'convert'
    ) {
      throw new UsageError(
        `Unknown command "${argument}". The commands are analyze, dev, doctor, inspect, plan, migrate and convert.`,
      )
    } else {
      command = argument
    }
  }

  // A flag that quietly does nothing is the failure this file exists to refuse,
  // so every command refuses the flags that belong to another one.
  if (command === 'migrate' || command === 'convert') {
    if (writeGiven && !outGiven) {
      throw new UsageError(
        `navirox ${command} --write needs --out: this tool writes into a separate directory and never in place.`,
      )
    }
  }

  if (outGiven && command !== 'migrate' && command !== 'convert') {
    throw new UsageError(
      command === undefined
        ? '--out belongs to navirox migrate and convert, and no command was given.'
        : `navirox ${command} writes nothing, so --out does not apply to it.`,
    )
  }

  if (writeGiven && command !== 'migrate' && command !== 'convert') {
    throw new UsageError(
      command === undefined
        ? '--write belongs to navirox migrate and convert, and no command was given.'
        : `navirox ${command} writes nothing, so --write does not apply to it.`,
    )
  }

  if (semanticGiven && command !== 'plan') {
    throw new UsageError(
      command === undefined
        ? '--semantic belongs to navirox plan, and no command was given.'
        : `navirox ${command} produces no plan, so --semantic does not apply to it.`,
    )
  }

  if (
    command === 'doctor' ||
    command === 'analyze' ||
    command === 'inspect' ||
    command === 'plan' ||
    command === 'migrate' ||
    command === 'convert'
  ) {
    const label = `navirox ${command}`
    if (command !== 'doctor' && platformGiven) {
      throw new UsageError(`${label} reads a project, so --platform does not apply to it.`)
    }
    if (portGiven) {
      throw new UsageError(`${label} runs no dev server, so --port does not apply to it.`)
    }
    if (skipPreflightGiven) {
      throw new UsageError(
        command === 'doctor'
          ? `${label} is the preflight, so --skip-preflight does not apply to it.`
          : `${label} checks nothing before starting, so --skip-preflight does not apply to it.`,
      )
    }
  }

  if (
    command !== 'analyze' &&
    command !== 'inspect' &&
    command !== 'plan' &&
    command !== 'migrate' &&
    command !== 'convert' &&
    frameworkGiven
  ) {
    throw new UsageError(
      command === undefined
        ? '--framework belongs to navirox analyze, inspect, plan and convert, and no command was given.'
        : `navirox ${command} reads no source project, so --framework does not apply to it.`,
    )
  }

  if (command === undefined && !help) {
    throw new UsageError(
      'A command is required. The commands are analyze, dev, doctor, inspect, plan, migrate and convert.',
    )
  }

  return {
    command,
    platform,
    directory,
    port,
    json,
    help,
    skipPreflight,
    framework,
    out,
    write,
    semantic,
  }
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
