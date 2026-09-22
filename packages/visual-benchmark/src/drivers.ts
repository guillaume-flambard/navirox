/**
 * Capture drivers for visual scenarios.
 *
 * The web driver screenshots a served page with headless Chrome. The native
 * drivers build and install the prepared fixture application on a simulator or
 * emulator, drive the capture's declared actions and screenshot the result, so
 * a native capture is produced by the application the target compiler emitted
 * rather than by a hand-written replacement screen.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import type { ScenarioCapture, VisualScenario } from './scenario.js'

export type NativePlatform = 'ios' | 'android'

export class CaptureUnavailableError extends Error {
  readonly capture: string

  constructor(capture: string, message: string) {
    super(`capture '${capture}' unavailable: ${message}`)
    this.name = 'CaptureUnavailableError'
    this.capture = capture
  }
}

export class CaptureMissingError extends Error {
  readonly capture: string

  constructor(capture: string, message: string) {
    super(`capture '${capture}' missing: ${message}`)
    this.name = 'CaptureMissingError'
    this.capture = capture
  }
}

export interface WebDriverOptions {
  /** Full path to the Chrome binary. */
  chromePath: string
  /** Base URL of the served fixture app, without a trailing slash. */
  baseUrl: string
  /** Per-capture timeout in milliseconds. Defaults to 60 seconds. */
  timeoutMs?: number
  /**
   * Device scale factor for the screenshot. A value above 1 produces a larger
   * image of the same layout, which is how a real second render of one screen
   * is obtained without changing the fixture state.
   */
  deviceScaleFactor?: number
  /**
   * Test identifiers the scenario declares. When present, the served page is
   * inspected for each of them and a capture that does not render one fails.
   */
  identifiers?: readonly string[]
  /** Runs the browser. Tests inject a fake so no browser is needed. */
  run?: WebProcessRunner
}

/** Runs one web command. Tests inject a fake so no browser is needed. */
export type WebProcessRunner = (
  command: string,
  args: readonly string[],
  options: { timeoutMs: number },
) => DeviceRunResult

function runWebProcess(
  command: string,
  args: readonly string[],
  options: { timeoutMs: number },
): DeviceRunResult {
  const result = spawnSync(command, args, { timeout: options.timeoutMs, encoding: 'utf8' })

  return {
    status: result.status,
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : '',
    ...(result.error === undefined ? {} : { error: result.error as Error }),
  }
}

/**
 * A declared identifier is checked where it exists rather than inferred from an
 * image: the served page is rendered again and its DOM read, so a missing label
 * fails the capture instead of reaching the comparison. The query string is the
 * one the screenshot used, so the actions that produced the capture are the
 * actions that produced this DOM.
 */
function checkWebIdentifiers(
  captureKey: string,
  url: string,
  identifiers: readonly string[],
  options: WebDriverOptions,
  run: WebProcessRunner,
): void {
  const result = run(options.chromePath, ['--headless', '--dump-dom', url], {
    timeoutMs: options.timeoutMs ?? 60_000,
  })

  if (result.error) {
    throw new CaptureMissingError(
      captureKey,
      `chrome failed to render the page for an identifier check: ${result.error.message}`,
    )
  }
  if (result.status !== 0) {
    throw new CaptureMissingError(
      captureKey,
      `chrome exited with status ${result.status} while checking the declared identifiers: ${result.stderr.trim()}`,
    )
  }

  const missing = identifiers.filter(
    (identifier) => !result.stdout.includes(`data-testid="${identifier}"`),
  )

  if (missing.length > 0) {
    throw new CaptureMissingError(
      captureKey,
      `the served page does not render ${missing.join(', ')}`,
    )
  }
}

/**
 * Screenshot one capture with headless Chrome. The harness renders the
 * fixture in its default state and then performs the capture's declared
 * actions, so a capture with actions can drive the fixture out of its default
 * state. A capture with no actions is only drivable in the `ready` status;
 * any other status is reported unavailable, not silently captured.
 */
export function captureWebChrome(
  scenario: VisualScenario,
  capture: ScenarioCapture,
  outPath: string,
  options: WebDriverOptions,
): void {
  const actions = capture.actions ?? []
  if (scenario.dataStatus !== 'ready' && actions.length === 0) {
    throw new CaptureUnavailableError(
      capture.key,
      `web harness renders the fixture default state, dataStatus '${scenario.dataStatus}' is not drivable`,
    )
  }
  const query = new URLSearchParams({ capture: capture.key })
  if (actions.length > 0) {
    query.set('actions', JSON.stringify(actions))
  }
  const url = `${options.baseUrl}${scenario.route}?${query.toString()}`
  const scaleFactor = options.deviceScaleFactor ?? 1
  const run = options.run ?? runWebProcess
  const result = run(
    options.chromePath,
    [
      '--headless',
      `--screenshot=${outPath}`,
      `--window-size=${scenario.viewportWidth},${scenario.viewportHeight}`,
      `--force-device-scale-factor=${scaleFactor}`,
      '--hide-scrollbars',
      url,
    ],
    { timeoutMs: options.timeoutMs ?? 60_000 },
  )
  if (result.error) {
    throw new CaptureMissingError(capture.key, `chrome failed to start: ${result.error.message}`)
  }
  if (result.status !== 0) {
    throw new CaptureMissingError(
      capture.key,
      `chrome exited with status ${result.status}: ${result.stderr.trim()}`,
    )
  }
  if (!existsSync(outPath)) {
    throw new CaptureMissingError(capture.key, 'chrome exited 0 but wrote no screenshot')
  }

  const identifiers = options.identifiers ?? []
  if (identifiers.length > 0) {
    checkWebIdentifiers(capture.key, url, identifiers, options, run)
  }
}

export interface DeviceRunOptions {
  /** Working directory of the command. */
  cwd?: string
  /** Environment entries added to the current process environment. */
  env?: Readonly<Record<string, string>>
  /** Hard timeout for the command, in milliseconds. */
  timeoutMs: number
}

export interface DeviceRunResult {
  status: number | null
  stdout: string
  stderr: string
  error?: Error
}

/** Runs one device command. Tests inject a fake so no device is needed. */
export type DeviceProcessRunner = (
  command: string,
  args: readonly string[],
  options: DeviceRunOptions,
) => DeviceRunResult

function runDeviceProcess(
  command: string,
  args: readonly string[],
  options: DeviceRunOptions,
): DeviceRunResult {
  const result = spawnSync(command, [...args], {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    timeout: options.timeoutMs,
    encoding: 'utf8',
    maxBuffer: DEVICE_OUTPUT_LIMIT_BYTES,
  })

  return {
    status: result.status,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    ...(result.error === undefined ? {} : { error: result.error as Error }),
  }
}

export interface DeviceProfile {
  readonly platform: NativePlatform
  readonly deviceName: string
  readonly osVersion?: string
}

export interface NativeDriverOptions {
  platform: NativePlatform
  /** Absolute path of the prepared fixture application. */
  appDirectory: string
  /**
   * Absolute path of the application binary Detox installs. When it is absent
   * the driver runs the Detox build for the platform first, so the run is
   * reproducible on a fresh checkout instead of depending on a previous build.
   */
  binaryPath: string
  /** Simulator or emulator name the capture test must use. */
  deviceName: string
  /** Scenario file the capture test reads. */
  scenarioPath: string
  /**
   * Test identifier the capture test waits for before it captures. Without it
   * a run cannot tell a rendered screen from a blank one, so the capture test
   * refuses to run.
   */
  rootTestId: string
  /**
   * Test identifiers the scenario declares. The capture test asserts each of
   * them after the declared actions, so a screen that did not render fails the
   * capture instead of reaching the comparison.
   */
  identifiers?: readonly string[]
  /** Directory the capture test writes the screenshot files into. */
  artifactDirectory: string
  /** Capture test path relative to the application. Defaults to `e2e/capture.test.ts`. */
  captureTest?: string
  /** Overrides the process runner. Tests inject a fake so no device is needed. */
  run?: DeviceProcessRunner
  /**
   * Do not let Detox start the application server. A caller that starts the
   * packager itself and warms the bundle passes this, because Detox starting a
   * cold packager per capture is what made every capture wait longer than the
   * app was willing to wait for its script.
   */
  skipStart?: boolean
  /** Hard timeout for the test run, in milliseconds. */
  timeoutMs?: number
  /**
   * Hard timeout for the build, in milliseconds. A cold device build is far
   * slower than a test run and downloads its own toolchain, so it gets a
   * budget of its own instead of sharing the test one.
   */
  buildTimeoutMs?: number
}

const DEFAULT_CAPTURE_TEST = 'e2e/capture.test.ts'
const DEFAULT_DEVICE_TIMEOUT_MS = 20 * 60_000
const DEFAULT_BUILD_TIMEOUT_MS = 40 * 60_000
// An Xcode build prints tens of megabytes. The default buffer of a synchronous
// spawn is one megabyte, and it kills the child with ENOBUFS instead of
// reporting a build error, so the limit is raised deliberately.
const DEVICE_OUTPUT_LIMIT_BYTES = 256 * 1024 * 1024

function nativeConfiguration(platform: NativePlatform): string {
  return platform === 'ios' ? 'ios.sim.debug' : 'android.emu.debug'
}

function deviceEnvironment(
  options: NativeDriverOptions,
  capture: ScenarioCapture,
): Record<string, string> {
  return {
    NAVIROX_PLATFORM: options.platform,
    NAVIROX_DEVICE: options.deviceName,
    NAVIROX_SCENARIO: options.scenarioPath,
    NAVIROX_ROOT_ID: options.rootTestId,
    NAVIROX_IDENTIFIERS: (options.identifiers ?? []).join(','),
    NAVIROX_ARTIFACTS: options.artifactDirectory,
    NAVIROX_CAPTURE: capture.key,
    NAVIROX_CAPTURE_TEST: options.captureTest ?? DEFAULT_CAPTURE_TEST,
    // Detox runs the application's start command through a shell, and that
    // command is the package manager script (`react-native start`). The
    // application's own binaries are only on PATH when the caller happens to be
    // a package manager script itself, so the driver puts them there.
    PATH: `${join(options.appDirectory, 'node_modules', '.bin')}:${process.env.PATH ?? ''}`,
  }
}

/**
 * Capture one declared moment from the prepared fixture application on a real
 * device. The driver builds the application when its binary is absent, runs
 * the capture test for the requested capture, and refuses to report a capture
 * the device never produced: a device that cannot be reached, a build that
 * produced no binary and a test run that wrote no screenshot each fail with
 * the reason attached.
 */
export function captureNativeDevice(
  scenario: VisualScenario,
  capture: ScenarioCapture,
  outPath: string,
  options: NativeDriverOptions,
): void {
  void scenario
  const appDirectory = options.appDirectory
  const binaryPath = options.binaryPath
  const deviceName = options.deviceName
  const rootTestId = options.rootTestId
  const missing = [
    ['appDirectory', appDirectory],
    ['binaryPath', binaryPath],
    ['deviceName', deviceName],
    ['rootTestId', rootTestId],
  ].filter(([, value]) => typeof value !== 'string' || value.length === 0)

  if (missing.length > 0) {
    throw new CaptureUnavailableError(
      capture.key,
      `the native driver was given no ${missing.map(([name]) => name).join(', ')}; a capture needs the prepared application, its built binary, the device name and the test identifier the screen renders`,
    )
  }

  const run = options.run ?? runDeviceProcess
  const configuration = nativeConfiguration(options.platform)
  const detox = join(appDirectory, 'node_modules', '.bin', 'detox')
  const timeoutMs = options.timeoutMs ?? DEFAULT_DEVICE_TIMEOUT_MS
  const buildTimeoutMs = options.buildTimeoutMs ?? DEFAULT_BUILD_TIMEOUT_MS

  if (options.run === undefined && !existsSync(detox)) {
    throw new CaptureUnavailableError(
      capture.key,
      `Detox is not installed in ${appDirectory}, so the ${options.platform} application cannot be built or launched`,
    )
  }

  if (!existsSync(binaryPath)) {
    const build = run(detox, ['build', '--configuration', configuration], {
      cwd: appDirectory,
      env: deviceEnvironment(options, capture),
      timeoutMs: buildTimeoutMs,
    })

    if (build.error) {
      throw new CaptureUnavailableError(
        capture.key,
        `the ${options.platform} build could not start: ${build.error.message}`,
      )
    }

    if (build.status !== 0) {
      throw new CaptureUnavailableError(
        capture.key,
        `the ${options.platform} build exited with status ${build.status}: ${build.stderr.trim()}`,
      )
    }

    if (!existsSync(binaryPath)) {
      throw new CaptureUnavailableError(
        capture.key,
        `the ${options.platform} build exited 0 but no application binary exists at ${binaryPath}`,
      )
    }
  }

  const testArguments = ['test', '--configuration', configuration, '--testNamePattern', capture.key]

  if (options.skipStart === true) {
    testArguments.push('--start', 'false')
  }

  const result = run(detox, testArguments, {
    cwd: appDirectory,
    env: deviceEnvironment(options, capture),
    timeoutMs,
  })

  if (result.error) {
    throw new CaptureUnavailableError(
      capture.key,
      `the ${options.platform} device run on ${deviceName} could not start: ${result.error.message}`,
    )
  }

  if (result.status !== 0) {
    throw new CaptureMissingError(
      capture.key,
      `the ${options.platform} device run on ${deviceName} exited with status ${result.status}: ${result.stderr.trim()}`,
    )
  }

  if (!existsSync(outPath)) {
    throw new CaptureMissingError(
      capture.key,
      `the ${options.platform} device run exited 0 but wrote no screenshot at ${outPath}`,
    )
  }
}
