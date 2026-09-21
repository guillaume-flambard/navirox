/**
 * Scenario runner: executes every capture of a scenario into a fresh
 * directory and reports per-capture results.
 *
 * Absences are results, not silent passes. When any capture is missing or
 * unavailable the runner throws a ScenarioRunError that carries the partial
 * per-capture results, so the caller can persist the report and exit nonzero.
 */
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type { DeviceProfile, NativePlatform } from './drivers.js'
import type { ScenarioCapture, VisualScenario } from './scenario.js'

export type CaptureDriver = (
  scenario: VisualScenario,
  capture: ScenarioCapture,
  outPath: string,
) => void

export interface CaptureOutcome {
  capture: string
  moment: ScenarioCapture['moment']
  web: string
  native: Partial<Record<NativePlatform, string>>
  /** Profile of the device that produced each native capture. */
  devices: Partial<Record<NativePlatform, DeviceProfile>>
  unavailable: { platform: NativePlatform; reason: string }[]
}

export interface ScenarioMotionReport {
  declared: boolean
  interruptible: boolean
  interaction?: string
  labels: ScenarioCapture['moment'][]
}

/**
 * Target compiler revision and the manifest hash of the screen the run
 * captured. A capture without its compiler revision is not evidence of what
 * the compiler produced.
 */
export interface ScenarioScreenRevision {
  compilerVersion: string
  manifestHash: string
}

/** What the caller knows about the run beyond the captures themselves. */
export interface ScenarioRunContext {
  screen?: ScenarioScreenRevision
  /** Declared device profile per platform, recorded whether or not it captured. */
  devices?: Partial<Record<NativePlatform, DeviceProfile>>
}

export interface ScenarioRunReport {
  scenario: string
  artifactDir: string
  outcomes: CaptureOutcome[]
  motion: ScenarioMotionReport
  devices: Partial<Record<NativePlatform, DeviceProfile>>
  screen?: ScenarioScreenRevision
}

export class ScenarioRunError extends Error {
  readonly report: ScenarioRunReport
  readonly missing: string[]

  constructor(report: ScenarioRunReport, missing: string[]) {
    super(`scenario '${report.scenario}' incomplete, missing captures: ${missing.join(', ')}`)
    this.name = 'ScenarioRunError'
    this.report = report
    this.missing = missing
  }
}

export interface ScenarioDrivers {
  web: CaptureDriver
  native: Record<NativePlatform, CaptureDriver>
}

/**
 * Run every capture of the scenario into a fresh artifact directory. The
 * directory is removed and recreated, so stale captures can never pass as
 * current results.
 */
export function runScenario(
  scenario: VisualScenario,
  drivers: ScenarioDrivers,
  artifactDir: string,
  context: ScenarioRunContext = {},
): ScenarioRunReport {
  rmSync(artifactDir, { recursive: true, force: true })
  mkdirSync(artifactDir, { recursive: true })

  const outcomes: CaptureOutcome[] = []
  const missing: string[] = []

  for (const capture of scenario.captures) {
    const webPath = join(artifactDir, `${capture.key}.web.png`)
    drivers.web(scenario, capture, webPath)
    if (!existsSync(webPath)) {
      missing.push(`${capture.key}.web`)
    }

    const outcome: CaptureOutcome = {
      capture: capture.key,
      moment: capture.moment,
      web: webPath,
      native: {},
      devices: {},
      unavailable: [],
    }
    for (const platform of ['ios', 'android'] as const) {
      const nativePath = join(artifactDir, `${capture.key}.${platform}.png`)
      try {
        drivers.native[platform](scenario, capture, nativePath)
        if (existsSync(nativePath)) {
          outcome.native[platform] = nativePath
          const profile = context.devices?.[platform]
          if (profile !== undefined) {
            outcome.devices[platform] = profile
          }
        } else {
          outcome.unavailable.push({ platform, reason: 'driver returned without writing a file' })
          missing.push(`${capture.key}.${platform}`)
        }
      } catch (error) {
        outcome.unavailable.push({
          platform,
          reason: error instanceof Error ? error.message : 'unknown driver failure',
        })
        missing.push(`${capture.key}.${platform}`)
      }
    }
    outcomes.push(outcome)
  }

  const motion: ScenarioMotionReport = {
    declared: scenario.motion !== undefined,
    interruptible: scenario.motion?.interruptible ?? false,
    labels: outcomes.map((outcome) => outcome.moment),
  }
  if (scenario.motion !== undefined) {
    motion.interaction = scenario.motion.interaction
  }

  const report: ScenarioRunReport = {
    scenario: scenario.name,
    artifactDir,
    outcomes,
    motion,
    devices: context.devices ?? {},
    ...(context.screen === undefined ? {} : { screen: context.screen }),
  }
  if (missing.length > 0) {
    throw new ScenarioRunError(report, missing)
  }
  return report
}
