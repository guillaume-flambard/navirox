import type { NativePlatform } from './drivers.js'
import type { ScenarioTolerance } from './scenario.js'

/**
 * The declared cross-platform tolerance, evaluated.
 *
 * A scenario that declares no tolerance is compared as a measurement and never
 * reaches this module: there is nothing declared to pass or fail against. A
 * scenario that declares one gets a verdict, and the verdict is exactly the
 * declared checks. Nothing here looks at a pixel count except the grid sizes,
 * because a difference ratio between a browser and a device is a description of
 * two profiles, not a fidelity result.
 */

/** The four checks a declared tolerance is evaluated against. */
export type ToleranceCheckName = 'captures' | 'grid' | 'identifiers' | 'motion'

export interface ToleranceCheck {
  readonly name: ToleranceCheckName
  readonly verdict: 'pass' | 'fail'
  readonly detail: string
}

export interface ToleranceVerdict {
  readonly scenario: string
  readonly verdict: 'pass' | 'fail'
  readonly checks: readonly ToleranceCheck[]
  /** The check that decided a failing verdict, absent when the run passed. */
  readonly decidedBy?: ToleranceCheckName
}

export interface ToleranceGrid {
  readonly width: number
  readonly height: number
}

export interface ToleranceCapture {
  readonly key: string
  /** Where a capture of this key exists: 'web' is the served page. */
  readonly produced: readonly (NativePlatform | 'web')[]
  /**
   * Normalized grids of the two captures this check compares, present only when
   * both exist and were decoded. A missing pair is not a grid failure: it is
   * already a missing capture.
   */
  readonly grid?: { readonly web: ToleranceGrid; readonly device: ToleranceGrid }
}

export interface ToleranceIdentifier {
  readonly name: string
  /** Where a capture asserted this identifier and that capture exists. */
  readonly asserted: readonly (NativePlatform | 'web')[]
}

export interface ToleranceRun {
  readonly scenario: string
  readonly tolerance: ScenarioTolerance
  /** Platforms a passing run requires, in addition to the served page. */
  readonly platforms: readonly NativePlatform[]
  readonly captures: readonly ToleranceCapture[]
  readonly identifiers: readonly ToleranceIdentifier[]
  readonly motion?: {
    readonly declared: boolean
    readonly required: readonly string[]
    readonly labels: readonly string[]
  }
}

function gridDifference(web: ToleranceGrid, device: ToleranceGrid): number {
  const width = Math.max(web.width, device.width)
  const height = Math.max(web.height, device.height)
  const widthDifference = width === 0 ? 0 : Math.abs(web.width - device.width) / width
  const heightDifference = height === 0 ? 0 : Math.abs(web.height - device.height) / height

  return Math.max(widthDifference, heightDifference)
}

function percentage(value: number): string {
  return `${(value * 100).toFixed(2)} percent`
}

function checkCaptures(run: ToleranceRun): ToleranceCheck {
  const missing: string[] = []

  for (const capture of run.captures) {
    if (!capture.produced.includes('web')) {
      missing.push(`${capture.key}.web`)
    }

    for (const platform of run.platforms) {
      if (!capture.produced.includes(platform)) {
        missing.push(`${capture.key}.${platform}`)
      }
    }
  }

  if (missing.length > 0) {
    return {
      name: 'captures',
      verdict: 'fail',
      detail: `these captures were declared and not produced: ${missing.join(', ')}`,
    }
  }

  return {
    name: 'captures',
    verdict: 'pass',
    detail: `all ${run.captures.length} declared captures exist on the web and on ${run.platforms.join(', ')}`,
  }
}

function checkGrid(run: ToleranceRun): ToleranceCheck {
  const compared = run.captures.filter((capture) => capture.grid !== undefined)

  if (compared.length === 0) {
    return {
      name: 'grid',
      verdict: 'fail',
      detail:
        'no capture had both sides decoded, so the declared grid tolerance could not be evaluated',
    }
  }

  const outside: string[] = []
  let largest = 0

  for (const capture of compared) {
    const grid = capture.grid

    if (grid === undefined) {
      continue
    }

    const difference = gridDifference(grid.web, grid.device)

    largest = Math.max(largest, difference)

    if (difference > run.tolerance.gridSize) {
      outside.push(`${capture.key} differs by ${percentage(difference)}`)
    }
  }

  if (outside.length > 0) {
    return {
      name: 'grid',
      verdict: 'fail',
      detail: `outside the declared ${percentage(run.tolerance.gridSize)}: ${outside.join(', ')}`,
    }
  }

  return {
    name: 'grid',
    verdict: 'pass',
    detail: `the largest grid difference is ${percentage(largest)}, inside the declared ${percentage(run.tolerance.gridSize)}`,
  }
}

function checkIdentifiers(run: ToleranceRun): ToleranceCheck {
  const missing: string[] = []

  for (const identifier of run.identifiers) {
    if (!identifier.asserted.includes('web')) {
      missing.push(`${identifier.name}.web`)
    }

    for (const platform of run.platforms) {
      if (!identifier.asserted.includes(platform)) {
        missing.push(`${identifier.name}.${platform}`)
      }
    }
  }

  if (missing.length > 0) {
    return {
      name: 'identifiers',
      verdict: 'fail',
      detail: `these declared identifiers were not asserted: ${missing.join(', ')}`,
    }
  }

  return {
    name: 'identifiers',
    verdict: 'pass',
    detail: `all ${run.identifiers.length} declared identifiers were asserted on the web and on ${run.platforms.join(', ')}`,
  }
}

function checkMotion(run: ToleranceRun): ToleranceCheck | undefined {
  if (run.motion === undefined || !run.motion.declared) {
    return undefined
  }

  const { labels, required } = run.motion
  const inOrder =
    labels.length === required.length && required.every((label, index) => labels[index] === label)

  if (!inOrder) {
    return {
      name: 'motion',
      verdict: 'fail',
      detail: `the motion labels were ${labels.join(', ')} and the scenario requires ${required.join(', ')} in that order`,
    }
  }

  return {
    name: 'motion',
    verdict: 'pass',
    detail: `the motion labels were ${labels.join(', ')} in the required order`,
  }
}

/**
 * Evaluates a declared tolerance and returns a verdict that names every check
 * it evaluated. The pixel difference ratio is deliberately not one of them.
 */
export function evaluateTolerance(run: ToleranceRun): ToleranceVerdict {
  const checks: ToleranceCheck[] = [checkCaptures(run), checkGrid(run), checkIdentifiers(run)]
  const motion = checkMotion(run)

  if (motion !== undefined) {
    checks.push(motion)
  }

  const failed = checks.find((check) => check.verdict === 'fail')

  if (failed === undefined) {
    return { scenario: run.scenario, verdict: 'pass', checks }
  }

  return { scenario: run.scenario, verdict: 'fail', checks, decidedBy: failed.name }
}
