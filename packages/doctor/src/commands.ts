import { spawnSync } from 'node:child_process'

/**
 * Runs a command and hands back what it said, for the checks that read a version
 * rather than a path.
 *
 * A missing binary is a normal answer here, not an exception. The doctor exists
 * to report what a machine does not have, so `xcodebuild` being absent has to
 * come back as a result the caller can print; throwing would turn the report
 * into a crash. The exit status is therefore the caller's to interpret.
 */

export interface ICommandResult {
  readonly status: number
  readonly stdout: string
  readonly stderr: string
}

export interface ICommandProbe {
  run(command: string, args: readonly string[]): ICommandResult
}

/** How long one version read may take before the tool counts as unavailable. */
const COMMAND_TIMEOUT_MS = 15_000

/** The shell's own code for "command not found", so a failed spawn reads as one. */
const COMMAND_NOT_FOUND = 127

export function createNodeCommandProbe(): ICommandProbe {
  return {
    run(command, args) {
      const result = spawnSync(command, [...args], {
        encoding: 'utf8',
        timeout: COMMAND_TIMEOUT_MS,
      })

      if (result.error !== undefined && result.error !== null) {
        return { status: COMMAND_NOT_FOUND, stdout: '', stderr: result.error.message }
      }

      return {
        status: result.status ?? COMMAND_NOT_FOUND,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
      }
    },
  }
}
