/**
 * Named visual scenario schema and validator.
 *
 * A scenario pins everything a fidelity comparison needs to be repeatable:
 * route, fixture data, viewport, device, colour scheme, font scale, reduced
 * motion, the interaction under test, the captures to take, and the regions
 * where difference is declared. Anything outside that contract is undeclared
 * and fails the comparison (see compare.ts).
 *
 * Every rejection carries the scenario-relative path of the offending value
 * (for example `captures[1].moment`) so a runner can report exactly what to
 * fix.
 */

export type CaptureMoment = 'rest' | 'first-meaningful' | 'midpoint' | 'settled' | 'interrupted'

export type ColourScheme = 'light' | 'dark'

export interface ScenarioAction {
  /** Stable test identifier of the element to press. */
  press: string
  /**
   * Zero-based index among the elements carrying that test identifier.
   * Defaults to the first match.
   */
  nth?: number
}

export interface ScenarioCapture {
  /** Key under which the capture is stored in the artifact directory. */
  key: string
  /** Moment of the interaction lifecycle this capture represents. */
  moment: CaptureMoment
  /** Ordered actions the runner performs before this capture is taken. */
  actions?: ScenarioAction[]
}

export interface ScenarioMotion {
  /** Human label of the interruptible interaction under test. */
  interaction: string
  /** Whether a second press can interrupt the interaction. */
  interruptible: boolean
}

export interface ScenarioTolerance {
  /**
   * Maximum relative difference between the two normalized grid sizes the
   * scenario accepts, as a fraction of the larger side (0.05 is five percent).
   */
  gridSize: number
  /** Test identifiers the scenario requires on both platforms. */
  identifiers: string[]
}

export interface ScenarioMask {
  /** Capture keys this mask applies to. Every entry must name a capture. */
  captures: string[]
  /** Capture-relative x coordinate of the region origin. */
  x: number
  /** Capture-relative y coordinate of the region origin. */
  y: number
  /** Width of the masked region in capture pixels. */
  width: number
  /** Height of the masked region in capture pixels. */
  height: number
  /** Why difference inside this region is declared rather than a failure. */
  reason: string
}

export interface VisualScenario {
  /** Unique scenario name, used as the artifact directory name. */
  name: string
  /** Route rendered for the scenario. */
  route: string
  /** Fixture data status shown by the Records fixture screen. */
  dataStatus: 'loading' | 'empty' | 'error' | 'ready'
  /** Viewport width in CSS pixels. */
  viewportWidth: number
  /** Viewport height in CSS pixels. */
  viewportHeight: number
  /** Device label the captures were taken on (informational). */
  device: string
  colourScheme: ColourScheme
  /** Font scale multiplier applied during capture. */
  fontScale: number
  reducedMotion: boolean
  actions: ScenarioAction[]
  captures: ScenarioCapture[]
  masks: ScenarioMask[]
  /** Present only when the scenario captures a temporal interaction. */
  motion?: ScenarioMotion
  /** Present only when the scenario declares the differences it accepts across platforms. */
  tolerance?: ScenarioTolerance
}

export interface ScenarioIssue {
  path: string
  message: string
}

/**
 * Validate an unknown value as a VisualScenario. Returns the list of issues;
 * an empty list means the value is a usable scenario.
 */
export function validateScenario(value: unknown): ScenarioIssue[] {
  const issues: ScenarioIssue[] = []
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return [{ path: '', message: 'scenario must be an object' }]
  }
  const scenario = value as Record<string, unknown>

  checkNonEmptyString(scenario, 'name', issues)
  checkNonEmptyString(scenario, 'route', issues)
  checkOneOf(scenario, 'dataStatus', ['loading', 'empty', 'error', 'ready'], issues)
  checkPositiveInteger(scenario, 'viewportWidth', issues)
  checkPositiveInteger(scenario, 'viewportHeight', issues)
  checkNonEmptyString(scenario, 'device', issues)
  checkOneOf(scenario, 'colourScheme', ['light', 'dark'], issues)
  checkPositiveNumber(scenario, 'fontScale', issues)
  checkBoolean(scenario, 'reducedMotion', issues)

  checkActions(scenario.actions, 'actions', issues)
  const captureKeys = checkCaptures(scenario.captures, issues)
  checkMasks(scenario.masks, captureKeys, issues)
  checkMotion(scenario, issues)
  checkTolerance(scenario, issues)

  return issues
}

function checkNonEmptyString(
  scenario: Record<string, unknown>,
  field: string,
  issues: ScenarioIssue[],
): void {
  const value = scenario[field]
  if (typeof value !== 'string' || value.length === 0) {
    issues.push({ path: field, message: `${field} must be a non-empty string` })
  }
}

function checkOneOf(
  scenario: Record<string, unknown>,
  field: string,
  allowed: string[],
  issues: ScenarioIssue[],
): void {
  const value = scenario[field]
  if (typeof value !== 'string' || !allowed.includes(value)) {
    issues.push({ path: field, message: `${field} must be one of: ${allowed.join(', ')}` })
  }
}

function checkPositiveInteger(
  scenario: Record<string, unknown>,
  field: string,
  issues: ScenarioIssue[],
): void {
  const value = scenario[field]
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    issues.push({ path: field, message: `${field} must be a positive integer` })
  }
}

function checkPositiveNumber(
  scenario: Record<string, unknown>,
  field: string,
  issues: ScenarioIssue[],
): void {
  const value = scenario[field]
  if (typeof value !== 'number' || !(value > 0)) {
    issues.push({ path: field, message: `${field} must be a positive number` })
  }
}

function checkBoolean(
  scenario: Record<string, unknown>,
  field: string,
  issues: ScenarioIssue[],
): void {
  if (typeof scenario[field] !== 'boolean') {
    issues.push({ path: field, message: `${field} must be a boolean` })
  }
}

function checkActions(actions: unknown, path: string, issues: ScenarioIssue[]): void {
  if (!Array.isArray(actions)) {
    issues.push({ path, message: `${path} must be an array` })
    return
  }
  actions.forEach((action, index) => {
    const actionPath = `${path}[${index}]`
    if (typeof action !== 'object' || action === null || Array.isArray(action)) {
      issues.push({ path: actionPath, message: `${actionPath} must be an object` })
      return
    }
    const entry = action as Record<string, unknown>
    const press = entry.press
    if (typeof press !== 'string' || press.length === 0) {
      issues.push({
        path: `${actionPath}.press`,
        message: `${actionPath}.press must be a non-empty string`,
      })
    }
    if (entry.nth !== undefined) {
      if (typeof entry.nth !== 'number' || !Number.isInteger(entry.nth) || entry.nth < 0) {
        issues.push({
          path: `${actionPath}.nth`,
          message: `${actionPath}.nth must be an integer >= 0`,
        })
      }
    }
  })
}

const CAPTURE_MOMENTS: CaptureMoment[] = [
  'rest',
  'first-meaningful',
  'midpoint',
  'settled',
  'interrupted',
]

const MOTION_MOMENTS: CaptureMoment[] = ['rest', 'first-meaningful', 'midpoint', 'settled']

function checkCaptures(captures: unknown, issues: ScenarioIssue[]): Set<string> {
  const keys = new Set<string>()
  if (!Array.isArray(captures)) {
    issues.push({ path: 'captures', message: 'captures must be an array' })
    return keys
  }
  captures.forEach((capture, index) => {
    const path = `captures[${index}]`
    if (typeof capture !== 'object' || capture === null || Array.isArray(capture)) {
      issues.push({ path, message: `${path} must be an object` })
      return
    }
    const entry = capture as Record<string, unknown>
    if (typeof entry.key !== 'string' || entry.key.length === 0) {
      issues.push({ path: `${path}.key`, message: `${path}.key must be a non-empty string` })
    } else if (keys.has(entry.key)) {
      issues.push({
        path: `${path}.key`,
        message: `${path}.key duplicates capture key '${entry.key}'`,
      })
    } else {
      keys.add(entry.key)
    }
    if (
      typeof entry.moment !== 'string' ||
      !CAPTURE_MOMENTS.includes(entry.moment as CaptureMoment)
    ) {
      issues.push({
        path: `${path}.moment`,
        message: `${path}.moment must be one of: ${CAPTURE_MOMENTS.join(', ')}`,
      })
    }
    if (entry.actions !== undefined) {
      checkActions(entry.actions, `${path}.actions`, issues)
    }
  })
  return keys
}

/**
 * A motion scenario is the only place the five temporal labels belong, and the
 * spec requires them in order. Anything else is rejected before a runner
 * starts, so a partial motion report cannot be produced by accident.
 */
function checkMotion(scenario: Record<string, unknown>, issues: ScenarioIssue[]): void {
  const motion = scenario.motion
  const captures = Array.isArray(scenario.captures) ? scenario.captures : []
  const moments = captures.map((capture) =>
    typeof capture === 'object' && capture !== null && !Array.isArray(capture)
      ? (capture as Record<string, unknown>).moment
      : undefined,
  )
  if (motion === undefined) {
    if (moments.includes('interrupted')) {
      issues.push({
        path: 'captures',
        message: "captures cannot declare the moment 'interrupted' without a motion declaration",
      })
    }
    return
  }
  if (typeof motion !== 'object' || motion === null || Array.isArray(motion)) {
    issues.push({ path: 'motion', message: 'motion must be an object' })
    return
  }
  const entry = motion as Record<string, unknown>
  if (typeof entry.interaction !== 'string' || entry.interaction.length === 0) {
    issues.push({
      path: 'motion.interaction',
      message: 'motion.interaction must be a non-empty string',
    })
  }
  if (typeof entry.interruptible !== 'boolean') {
    issues.push({ path: 'motion.interruptible', message: 'motion.interruptible must be a boolean' })
    return
  }
  const required = entry.interruptible ? [...MOTION_MOMENTS, 'interrupted'] : [...MOTION_MOMENTS]
  if (moments.join(',') !== required.join(',')) {
    issues.push({
      path: 'captures',
      message: `captures must declare the moments ${required.join(', ')} in that order when motion is declared`,
    })
  }
}

/**
 * A declared tolerance is the only thing that can turn a cross-platform
 * comparison into a pass, so it is validated as strictly as the rest of the
 * scenario: a grid bound outside zero and one, or an identifier list that is
 * empty or not made of names, would let a run pass on a declaration nobody can
 * read.
 */
function checkTolerance(scenario: Record<string, unknown>, issues: ScenarioIssue[]): void {
  const tolerance = scenario.tolerance
  if (tolerance === undefined) {
    return
  }
  if (typeof tolerance !== 'object' || tolerance === null || Array.isArray(tolerance)) {
    issues.push({ path: 'tolerance', message: 'tolerance must be an object' })
    return
  }
  const entry = tolerance as Record<string, unknown>
  const gridSize = entry.gridSize
  if (typeof gridSize !== 'number' || !(gridSize >= 0) || !(gridSize < 1)) {
    issues.push({
      path: 'tolerance.gridSize',
      message: 'tolerance.gridSize must be a number >= 0 and < 1',
    })
  }
  if (!Array.isArray(entry.identifiers) || entry.identifiers.length === 0) {
    issues.push({
      path: 'tolerance.identifiers',
      message: 'tolerance.identifiers must be a non-empty array of test identifiers',
    })
    return
  }
  entry.identifiers.forEach((identifier, index) => {
    if (typeof identifier !== 'string' || identifier.length === 0) {
      issues.push({
        path: `tolerance.identifiers[${index}]`,
        message: `tolerance.identifiers[${index}] must be a non-empty string`,
      })
    }
  })
}

function checkMasks(masks: unknown, captureKeys: Set<string>, issues: ScenarioIssue[]): void {
  if (!Array.isArray(masks)) {
    issues.push({ path: 'masks', message: 'masks must be an array' })
    return
  }
  masks.forEach((mask, index) => {
    const path = `masks[${index}]`
    if (typeof mask !== 'object' || mask === null || Array.isArray(mask)) {
      issues.push({ path, message: `${path} must be an object` })
      return
    }
    const entry = mask as Record<string, unknown>
    if (!Array.isArray(entry.captures) || entry.captures.length === 0) {
      issues.push({
        path: `${path}.captures`,
        message: `${path}.captures must be a non-empty array of capture keys`,
      })
    } else {
      entry.captures.forEach((key, keyIndex) => {
        if (typeof key !== 'string' || !captureKeys.has(key)) {
          issues.push({
            path: `${path}.captures[${keyIndex}]`,
            message: `${path}.captures[${keyIndex}] names an unknown capture key`,
          })
        }
      })
    }
    for (const field of ['x', 'y', 'width', 'height'] as const) {
      const dimension = entry[field]
      if (typeof dimension !== 'number' || !(dimension >= 0)) {
        issues.push({ path: `${path}.${field}`, message: `${path}.${field} must be a number >= 0` })
      }
    }
    if (typeof entry.reason !== 'string' || entry.reason.length === 0) {
      issues.push({ path: `${path}.reason`, message: `${path}.reason must be a non-empty string` })
    }
  })
}
