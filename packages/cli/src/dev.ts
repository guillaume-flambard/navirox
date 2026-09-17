import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { TPlatform } from './args.js'
import {
  checkToolchain,
  createNodeProbe,
  missingRemedies,
  PreflightError,
  type IProbe,
} from '@navirox/doctor'
import {
  createNodeRunner,
  METRO_READY_TIMEOUT_MS,
  type IBackgroundProcess,
  type ICommand,
  type IDevIo,
  type IRunner,
} from './runner.js'

/**
 * `navirox dev`: start the app's dev server, then put the app on a device.
 *
 * The command does not name a renderer anywhere. It reads the scripts the app
 * already declares and runs them through the package manager the app already
 * uses, because the toolchain plane is not allowed to reach the renderer and
 * hardcoding one would be the same thing with extra steps. What Navirox adds is
 * the order, the preflight, and an error message that says what to install.
 */

export interface IPackageManager {
  readonly name: 'pnpm' | 'npm' | 'yarn'
  /**
   * The argv that runs one of the app's own scripts: the binary first, then its
   * arguments. Typed as a non-empty tuple because `ICommand` spawns the binary
   * and the arguments separately, so the two have to be split somewhere, and a
   * tuple is what lets that split happen without an assertion.
   */
  readonly run: (script: string) => readonly [string, ...string[]]
}

export interface IDevContext {
  readonly runner: IRunner
  readonly probe: IProbe
  readonly env: NodeJS.ProcessEnv
  /** Reads a file as text, so tests do not need a real app on disk. */
  readonly readFile: (path: string) => string
}

export interface IRunDevOptions {
  /** Where the command was run from. */
  readonly cwd: string
  /** The app to run, relative to `cwd` or absolute. Defaults to `cwd`. */
  readonly directory: string | undefined
  readonly platform: TPlatform
  readonly port: number
  readonly json: boolean
  readonly skipPreflight: boolean
}

/** The real runner, probe and filesystem, as a normal run uses them. */
export function createDevContext(): IDevContext {
  return {
    runner: createNodeRunner(),
    probe: createNodeProbe(),
    env: process.env,
    readFile: (path) => readFileSync(path, 'utf8'),
  }
}

/**
 * The lockfile decides, because that is the file the app's own install wrote.
 * The search walks up from the app rather than looking only beside it, because a
 * workspace member's install writes its lockfile at the workspace root: an app
 * inside a pnpm workspace has no `pnpm-lock.yaml` of its own, and reading that
 * absence as "npm" runs the wrong package manager over a tree pnpm installed.
 * Falling back to npm is what a directory with no lockfile anywhere above it
 * uses.
 */
export function detectPackageManager(
  appDir: string,
  exists: (path: string) => boolean,
): IPackageManager {
  const managers: readonly (readonly [string, IPackageManager['name']])[] = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['package-lock.json', 'npm'],
  ]

  for (let directory = appDir; ; directory = dirname(directory)) {
    for (const [lockfile, name] of managers) {
      if (exists(join(directory, lockfile))) {
        return { name, run: (script) => [name, 'run', script] }
      }
    }

    if (dirname(directory) === directory) {
      return { name: 'npm', run: (script) => ['npm', 'run', script] }
    }
  }
}

/**
 * The command the runner spawns for one of the app's scripts.
 *
 * `IPackageManager.run` returns a whole argv with the binary first, while
 * `ICommand` takes the binary and its arguments apart. Handing the argv over as
 * `args` spawns the binary twice, which is what `pnpm pnpm run dev` was: the dev
 * server never started, and the failure named a command nobody asked for.
 */
function commandFor(packageManager: IPackageManager, script: string, cwd: string): ICommand {
  const [binary, ...args] = packageManager.run(script)

  return { command: binary, args, cwd }
}

export async function runDev(
  options: IRunDevOptions,
  io: IDevIo,
  context: IDevContext = createDevContext(),
): Promise<number> {
  const appDir =
    options.directory === undefined ? options.cwd : resolve(options.cwd, options.directory)
  const manifestPath = join(appDir, 'package.json')

  if (!context.probe.exists(manifestPath)) {
    throw new Error(
      `${manifestPath} was not found, so there is no app to run here. Run navirox dev from inside a Navirox app, or point at one with --directory.`,
    )
  }

  const manifest = JSON.parse(context.readFile(manifestPath)) as {
    scripts?: Record<string, string>
  }
  const scripts = manifest.scripts ?? {}
  const metroScript = scripts['dev'] === undefined ? 'start' : 'dev'
  const launchScript = options.platform

  if (scripts[metroScript] === undefined) {
    throw new Error(
      'The app has no "dev" or "start" script, so there is nothing for Navirox to start the dev server with. A Navirox app declares one, so this may not be a Navirox app.',
    )
  }
  if (scripts[launchScript] === undefined) {
    throw new Error(
      `The app has no "${launchScript}" script, so Navirox cannot launch ${launchScript}. Add one, or pass --platform for the other platform.`,
    )
  }

  const packageManager = detectPackageManager(appDir, context.probe.exists)

  if (!options.skipPreflight) {
    const results = checkToolchain({
      platform: options.platform,
      env: context.env,
      probe: context.probe,
    })
    const missing = results.filter((result) => !result.ok)
    if (missing.length > 0) {
      for (const line of missingRemedies(results)) {
        io.err(line)
      }
      throw new PreflightError(options.platform, missing.length)
    }
  }

  const devCommand = commandFor(packageManager, metroScript, appDir)
  const launchCommand = commandFor(packageManager, launchScript, appDir)

  if (options.json) {
    io.out(
      JSON.stringify({
        ok: true,
        command: 'dev',
        appDir,
        packageManager: packageManager.name,
        platform: options.platform,
        port: options.port,
        devScript: metroScript,
        launchScript,
      }),
    )
  } else {
    io.out(`Navirox dev: ${options.platform}, dev server on port ${options.port}.`)
    io.out(`Starting the dev server with "${packageManager.name} run ${metroScript}".`)
  }

  const server = context.runner.start(devCommand)
  return await launchWhenReady(server, launchCommand, options, io, context)
}

async function launchWhenReady(
  server: IBackgroundProcess,
  launchCommand: ICommand,
  options: IRunDevOptions,
  io: IDevIo,
  context: IDevContext,
): Promise<number> {
  try {
    await context.runner.waitForPort(options.port, METRO_READY_TIMEOUT_MS)
  } catch (error) {
    server.stop()
    throw error
  }

  if (!options.json) {
    io.out(`The dev server is answering on port ${options.port}. Building ${options.platform} now.`)
  }

  const exitCode = await context.runner.run(launchCommand)
  if (exitCode !== 0) {
    server.stop()
    throw new Error(
      `The ${options.platform} build exited with code ${exitCode}, so the app is not on the device. The dev server has been stopped as well.`,
    )
  }

  // The launch step is what reports whether the app is installed. What is left
  // running is the dev server, and a person stopping it with Ctrl+C is how this
  // command normally ends, so waiting for it is waiting for the user, not a hang.
  if (!options.json) {
    io.out(
      'The app is building or running. The dev server stays up with it, so press Ctrl+C to stop.',
    )
  }
  await server.done
  return 0
}
