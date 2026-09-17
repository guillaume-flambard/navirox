import { parseArguments, UsageError, HELP } from './args.js'
import { createDevContext, runDev, type IDevContext } from './dev.js'
import type { IDevIo } from './runner.js'

/**
 * The command as a function, so the process is only touched in `bin.ts`.
 *
 * Everything here returns an exit code instead of calling `process.exit`, which
 * is what lets the tests assert on output and codes without a subprocess.
 */

/**
 * The writer the command prints through. It is the same shape the dev server
 * orchestration uses, so there is one way to capture output rather than two.
 */
export type ICliIo = IDevIo

export async function runCli(
  argv: readonly string[],
  io: ICliIo,
  cwd: string = process.cwd(),
  context?: IDevContext,
): Promise<number> {
  let parsed
  try {
    parsed = parseArguments(argv)
  } catch (error) {
    return reportFailure(error, io)
  }

  if (parsed.help) {
    io.out(HELP)
    return 0
  }
  if (parsed.command !== 'dev') {
    return reportFailure(
      new UsageError('A command is required. The only command today is dev.'),
      io,
    )
  }

  try {
    return await runDev(
      {
        cwd,
        directory: parsed.directory,
        platform: parsed.platform,
        port: parsed.port,
        json: parsed.json,
        skipPreflight: parsed.skipPreflight,
      },
      io,
      context ?? createDevContext(),
    )
  } catch (error) {
    return reportFailure(error, io)
  }
}

/**
 * One failure path for everything, so a caller using `--json` never has to parse
 * prose and a person never has to read JSON.
 */
function reportFailure(error: unknown, io: ICliIo): number {
  const name = error instanceof Error ? error.name : 'Error'
  const message = error instanceof Error ? error.message : String(error)

  if (name === 'UsageError') {
    io.err(message)
    io.err('Run navirox --help to see how this command is called.')
  } else {
    io.err(message)
  }

  return 1
}
