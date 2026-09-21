/**
 * Capture drivers for visual scenarios.
 *
 * The web driver screenshots a served page with headless Chrome. The native
 * drivers expose the same interface but report unavailability on machines
 * without a working device pipeline, so a run records the absence instead of
 * pretending the capture exists.
 */
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
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
  const result = spawnSync(
    options.chromePath,
    [
      '--headless',
      `--screenshot=${outPath}`,
      `--window-size=${scenario.viewportWidth},${scenario.viewportHeight}`,
      `--force-device-scale-factor=${scaleFactor}`,
      '--hide-scrollbars',
      url,
    ],
    { timeout: options.timeoutMs ?? 60_000, encoding: 'utf8' },
  )
  if (result.error) {
    throw new CaptureMissingError(
      capture.key,
      `chrome failed to start: ${(result.error as Error).message}`,
    )
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
}

export interface NativeDriverOptions {
  platform: NativePlatform
}

/**
 * Native capture placeholder. This runner has no device driver: it never
 * builds, installs or launches the generated application, so a native capture
 * cannot be produced from here. The device toolchain that does exist on this
 * machine, Detox, fails before any app code runs on the pre-existing
 * stream-json install issue. Every native capture is therefore reported
 * unavailable with the reason attached rather than skipped.
 */
export function captureNativeDevice(
  scenario: VisualScenario,
  capture: ScenarioCapture,
  _outPath: string,
  options: NativeDriverOptions,
): void {
  void scenario
  if (options.platform === 'ios') {
    throw new CaptureUnavailableError(
      capture.key,
      'no ios device driver in this runner: the simulator is never built, installed or launched, and Detox fails during install with MODULE_NOT_FOUND stream-json',
    )
  }
  throw new CaptureUnavailableError(
    capture.key,
    'no android device driver in this runner: the emulator is never built, installed or launched, and Detox fails during install with MODULE_NOT_FOUND stream-json',
  )
}
