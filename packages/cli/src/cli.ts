import { resolve } from 'node:path'
import type { IDoctorDeps } from '@navirox/doctor'
import { parseArguments, HELP } from './args.js'
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

/**
 * What a command needs from the world, per command.
 *
 * Both members are optional and the real ones are built on demand, so running
 * `navirox doctor` neither starts nor needs anything the dev server owns, and a
 * test supplies only the half it is exercising.
 */
export interface ICliContext {
  readonly dev?: IDevContext
  readonly doctor?: IDoctorDeps
}

export async function runCli(
  argv: readonly string[],
  io: ICliIo,
  cwd: string = process.cwd(),
  context: ICliContext = {},
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

  const directory = parsed.directory === undefined ? cwd : resolve(cwd, parsed.directory)

  if (parsed.command === 'doctor') {
    try {
      // Imported here rather than at the top so the report pays for nothing the
      // dev server needs, which is what keeps `navirox doctor` quick on a machine
      // where something is already wrong.
      const { createDoctorDeps, exitCodeFor, renderReport, reportToJson, runDoctor } =
        await import('@navirox/doctor')
      const report = runDoctor(
        { directory, platform: parsed.platform },
        context.doctor ?? createDoctorDeps(),
      )

      if (parsed.json) {
        io.out(reportToJson(report).trimEnd())
      } else {
        for (const line of renderReport(report).split('\n')) {
          io.out(line)
        }
      }

      return exitCodeFor(report)
    } catch (error) {
      return reportFailure(error, io)
    }
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
      context.dev ?? createDevContext(),
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
