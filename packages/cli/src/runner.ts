import { spawn } from 'node:child_process'
import { connect } from 'node:net'

/**
 * Running the app's own scripts, and waiting for its dev server.
 *
 * The runner is an interface because `navirox dev` orchestrates long running
 * processes, and orchestration that can only be tested by starting Metro is
 * orchestration nobody tests. Tests supply a fake and assert the sequence.
 */

export interface IDevIo {
  readonly out: (line: string) => void
  readonly err: (line: string) => void
}

export interface ICommand {
  readonly command: string
  readonly args: readonly string[]
  readonly cwd: string
}

/** A process left running while the command continues, which is what Metro is. */
export interface IBackgroundProcess {
  readonly stop: () => void
  /** Resolves with the exit code once the process is gone. */
  readonly done: Promise<number>
}

export interface IRunner {
  /** Runs a command in the foreground, sharing this terminal, and awaits its exit code. */
  run(command: ICommand): Promise<number>
  /** Starts a command and returns a handle rather than waiting for it. */
  start(command: ICommand): IBackgroundProcess
  /** Resolves once something answers on the port, or rejects when nothing ever does. */
  waitForPort(port: number, timeoutMs: number): Promise<void>
}

/** How long Metro is given to answer before Navirox gives up on it. */
export const METRO_READY_TIMEOUT_MS = 60_000

/** How often the port is retried while Metro boots. */
const POLL_INTERVAL_MS = 250

/**
 * The real runner. Standard output is inherited rather than piped: Metro and the
 * platform build produce their own interactive output, and rewriting it through a
 * pipe would strip the colours and the progress that make them usable.
 */
export function createNodeRunner(): IRunner {
  return {
    run(command) {
      return new Promise<number>((resolve, reject) => {
        const child = spawn(command.command, [...command.args], {
          cwd: command.cwd,
          stdio: 'inherit',
        })
        child.on('error', reject)
        child.on('close', (code) => {
          resolve(code ?? 1)
        })
      })
    },

    start(command) {
      const child = spawn(command.command, [...command.args], {
        cwd: command.cwd,
        stdio: 'inherit',
      })
      return {
        stop: () => {
          child.kill('SIGTERM')
        },
        done: new Promise<number>((resolve) => {
          child.on('close', (code) => {
            resolve(code ?? 1)
          })
        }),
      }
    },

    waitForPort(port, timeoutMs) {
      return waitForPort(port, timeoutMs)
    },
  }
}

async function waitForPort(port: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) {
      return
    }
    await delay(POLL_INTERVAL_MS)
  }
  throw new Error(
    `Nothing answered on port ${port} within ${Math.round(timeoutMs / 1000)} seconds. Metro did not start, so there is nothing to launch the app against. Start it by hand to see its output.`,
  )
}

/**
 * A connection attempt is the honest readiness test. Metro prints different lines
 * between versions, and matching its prose would break on the next release.
 */
function isPortOpen(port: number): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const socket = connect({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}
