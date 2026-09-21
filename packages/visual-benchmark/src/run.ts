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
import type { NativePlatform } from './drivers.js'
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
  unavailable: { platform: NativePlatform; reason: string }[]
}

export interface ScenarioMotionReport {
  declared: boolean
  interruptible: boolean
  interaction?: string
  labels: ScenarioCapture['moment'][]
}

export interface ScenarioRunReport {
  scenario: string
  artifactDir: string
  outcomes: CaptureOutcome[]
  motion: ScenarioMotionReport
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
      unavailable: [],
    }
    for (const platform of ['ios', 'android'] as const) {
      const nativePath = join(artifactDir, `${capture.key}.${platform}.png`)
      try {
        drivers.native[platform](scenario, capture, nativePath)
        if (existsSync(nativePath)) {
          outcome.native[platform] = nativePath
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

  const report: ScenarioRunReport = { scenario: scenario.name, artifactDir, outcomes, motion }
  if (missing.length > 0) {
    throw new ScenarioRunError(report, missing)
  }
  return report
}
