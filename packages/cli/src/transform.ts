import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import {
  createMemoryReader,
  discoverRepository,
  type DiscoveryReader,
  type EligibilityClassification,
  type RepositoryCapabilityManifest,
} from '@memolabs-apps/discovery'
import type {
  EmissionResult,
  LoweringProfile,
  LoweringResult,
  LoweringSnapshot,
  SourceTransformProvider,
  TargetProvider,
  WorkspaceProvider,
} from '@memolabs-apps/source'
import { hashWorkflow } from '@memolabs-apps/workflow'

/**
 * The deep transform module.
 *
 * One entry point sequences discovery through scaffold, refuses unsafe or
 * ineligible runs before any write, and returns a complete result. Dry-run is
 * the default: planning is pure, and only an explicit write commits the
 * planned files plus the manifest.
 */

export type TransformStage =
  | 'discovery'
  | 'eligibility'
  | 'version-gate'
  | 'inspect-plan'
  | 'lower'
  | 'emit'
  | 'migrate'
  | 'provenance'
  | 'scaffold'

export const TRANSFORM_STAGES: readonly TransformStage[] = [
  'discovery',
  'eligibility',
  'version-gate',
  'inspect-plan',
  'lower',
  'emit',
  'migrate',
  'provenance',
  'scaffold',
]

export interface TransformFinding {
  readonly code: string
  readonly message: string
}

export interface TransformLayout {
  readonly generated: string
  readonly shared: string
  readonly manual: string
  readonly manifest: string
}

export const TRANSFORM_LAYOUT: TransformLayout = {
  generated: 'generated/',
  shared: 'shared/',
  manual: 'manual/',
  manifest: 'navirox.manifest.json',
}

export interface TransformCoverageTotals {
  readonly generated: number
  readonly manualRequired: number
  readonly excluded: number
  readonly refused: number
}

export interface TransformDelta {
  readonly id: string
  readonly description: string
}

export interface PlannedFile {
  readonly path: string
  readonly content: string
}

export interface VersionGateCheck {
  readonly ok: boolean
  readonly code?: string
  readonly message?: string
}

export type ProfileResolution =
  | { readonly kind: 'ok'; readonly id: string }
  | { readonly kind: 'unknown'; readonly id: string }
  | { readonly kind: 'ambiguous'; readonly candidates: readonly string[] }

export interface TransformInspectPlan {
  readonly adapterId: string
  readonly graph: LoweringSnapshot['graph']
  readonly plan: unknown
}

export interface TransformMigrateOutcome {
  readonly files: readonly PlannedFile[]
  readonly findings?: readonly TransformFinding[]
  readonly moved?: readonly string[]
}

export interface TransformDeps {
  readonly discover?: (options: {
    readonly root: string
    readonly app?: string
  }) => RepositoryCapabilityManifest | Promise<RepositoryCapabilityManifest>
  readonly checkVersion?: (
    manifest: RepositoryCapabilityManifest,
    profile: string,
  ) => VersionGateCheck
  readonly inspectPlan?: (options: {
    readonly root: string
    readonly app?: string
    readonly profile: string
    readonly manifest: RepositoryCapabilityManifest
  }) => TransformInspectPlan | Promise<TransformInspectPlan>
  readonly lower?: SourceTransformProvider
  readonly emit?: TargetProvider
  readonly migrate?: (options: {
    readonly root: string
    readonly output: string
    readonly profile: string
    readonly manifest: RepositoryCapabilityManifest
    readonly inspect: TransformInspectPlan
    readonly lowering: LoweringResult
    readonly emission: EmissionResult
    readonly write: boolean
  }) => TransformMigrateOutcome | Promise<TransformMigrateOutcome>
  readonly workspace?: WorkspaceProvider

  /** Registered profile ids. Absent means any non-empty id is accepted. */
  readonly profiles?: readonly string[]
  readonly resolveProfile?: (
    id: string | undefined,
    available: readonly string[] | undefined,
  ) => ProfileResolution
}

export interface TransformInput {
  readonly root: string
  readonly app?: string
  readonly profile: string
  readonly output: string
  readonly write?: boolean
  readonly deps?: TransformDeps
}

export interface TransformManifestDocument {
  readonly schemaVersion: 1
  readonly profile: string
  readonly root: string
  readonly app: string | null
  readonly output: string
  readonly snapshotHash: string
  readonly workflowHash: string
  readonly classification: EligibilityClassification
  readonly coverage: TransformCoverageTotals
  readonly deltas: readonly TransformDelta[]
  readonly files: readonly string[]
  readonly stages: readonly TransformStage[]
  readonly commands: readonly string[]
}

export interface TransformResult {
  readonly ok: boolean
  readonly dryRun: boolean
  readonly stages: readonly TransformStage[]
  readonly findings: readonly TransformFinding[]
  readonly refusals: readonly TransformFinding[]
  readonly layout: TransformLayout
  readonly coverage: TransformCoverageTotals
  readonly deltas: readonly TransformDelta[]
  readonly plannedPaths: readonly string[]
  readonly commands: readonly string[]
  readonly snapshotHash?: string
  readonly workflowHash?: string
  readonly manifest?: TransformManifestDocument
}

const EMPTY_COVERAGE: TransformCoverageTotals = {
  generated: 0,
  manualRequired: 0,
  excluded: 0,
  refused: 0,
}

function hasTraversal(path: string): boolean {
  return path.split(/[/\\]/).includes('..')
}

function isInside(root: string, candidate: string): boolean {
  const path = relative(root, candidate)

  return path.length > 0 && !path.startsWith(`..${sep}`) && path !== '..' && !path.startsWith(sep)
}

function defaultResolveProfile(
  id: string | undefined,
  available: readonly string[] | undefined,
): ProfileResolution {
  if (available === undefined) {
    if (id === undefined || id.trim() === '') {
      return { kind: 'unknown', id: id ?? '' }
    }

    return { kind: 'ok', id }
  }

  if (id === undefined || id.trim() === '') {
    if (available.length > 1) {
      return { kind: 'ambiguous', candidates: available }
    }

    if (available.length === 1 && available[0] !== undefined) {
      return { kind: 'ok', id: available[0] }
    }

    return { kind: 'unknown', id: id ?? '' }
  }

  if (available.includes(id)) {
    return { kind: 'ok', id }
  }

  return { kind: 'unknown', id }
}

function createFsReader(root: string): DiscoveryReader {
  const files: string[] = []
  const symlinks: string[] = []

  const walk = (directory: string, prefix: string): void => {
    let entries
    try {
      entries = readdirSync(directory, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue
      }

      const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`

      if (entry.isSymbolicLink()) {
        symlinks.push(relativePath)
      } else if (entry.isDirectory()) {
        walk(join(directory, entry.name), relativePath)
      } else {
        files.push(relativePath)
      }
    }
  }

  walk(root, '')
  files.sort((left, right) => left.localeCompare(right))
  symlinks.sort((left, right) => left.localeCompare(right))

  return {
    files,
    symlinks,
    readText: (path) => {
      try {
        return readFileSync(join(root, path), 'utf8')
      } catch {
        return undefined
      }
    },
  }
}

function baseResult(
  dryRun: boolean,
  stages: readonly TransformStage[],
  findings: readonly TransformFinding[],
  refusals: readonly TransformFinding[],
  extra: Partial<TransformResult> = {},
): TransformResult {
  return {
    ok: refusals.length === 0 && findings.every((finding) => !finding.code.startsWith('error:')),
    dryRun,
    stages,
    findings,
    refusals,
    layout: TRANSFORM_LAYOUT,
    coverage: EMPTY_COVERAGE,
    deltas: [],
    plannedPaths: [],
    commands: [],
    ...extra,
  }
}

function refusal(
  dryRun: boolean,
  stages: readonly TransformStage[],
  priorFindings: readonly TransformFinding[],
  code: string,
  message: string,
  extra: Partial<TransformResult> = {},
): TransformResult {
  const finding: TransformFinding = { code, message }

  return baseResult(dryRun, stages, [...priorFindings, finding], [finding], extra)
}

function commandFor(input: TransformInput): string {
  const app = input.app === undefined ? '' : ` --app ${input.app}`

  return `navirox transform ${input.root}${app} --profile ${input.profile} --out ${input.output}`
}

function ensureLayoutCoverage(files: readonly PlannedFile[]): PlannedFile[] {
  const planned = [...files]
  const prefixes: readonly [string, string][] = [
    [TRANSFORM_LAYOUT.generated, '# no generated files\n'],
    [TRANSFORM_LAYOUT.shared, '# no shared units\n'],
    [TRANSFORM_LAYOUT.manual, '# no manual work recorded\n'],
  ]

  for (const [prefix, placeholder] of prefixes) {
    if (!planned.some((file) => file.path.startsWith(prefix))) {
      planned.push({ path: `${prefix}.keep`, content: placeholder })
    }
  }

  return planned
}

/**
 * Runs the full transform pipeline.
 *
 * Path and profile safety run first. Discovery and eligibility stop the run
 * before any write-capable stage when the repository cannot advance. Planning
 * is pure; only `write: true` commits the planned files and the manifest.
 */
export async function transform(input: TransformInput): Promise<TransformResult> {
  const write = input.write === true
  const dryRun = !write
  const deps = input.deps ?? {}
  const stages: TransformStage[] = []
  const findings: TransformFinding[] = []
  const refusals: TransformFinding[] = []

  if (
    hasTraversal(input.root) ||
    hasTraversal(input.output) ||
    (input.app !== undefined && hasTraversal(input.app))
  ) {
    return refusal(
      dryRun,
      stages,
      findings,
      'unsafe-path',
      'A path argument contains a traversal segment. Nothing was written.',
    )
  }

  const rootResolved = resolve(input.root)
  const outputResolved = resolve(input.output)

  if (outputResolved === rootResolved) {
    return refusal(
      dryRun,
      stages,
      findings,
      'unsafe-path',
      'The output path is the source root. Nothing was written.',
    )
  }

  if (isInside(rootResolved, outputResolved)) {
    return refusal(
      dryRun,
      stages,
      findings,
      'unsafe-path',
      'The output path resolves inside the source root. Nothing was written.',
    )
  }

  const resolveProfile = deps.resolveProfile ?? defaultResolveProfile
  const profileResolution = resolveProfile(input.profile, deps.profiles)

  if (profileResolution.kind === 'unknown') {
    return refusal(
      dryRun,
      stages,
      findings,
      'unknown-profile',
      `Unknown transformation profile "${profileResolution.id}". Nothing was written.`,
    )
  }

  if (profileResolution.kind === 'ambiguous') {
    return refusal(
      dryRun,
      stages,
      findings,
      'ambiguous-profile',
      `Ambiguous transformation profile; candidates: ${profileResolution.candidates.join(', ')}. Nothing was written.`,
    )
  }

  const profileId = profileResolution.id

  const discover =
    deps.discover ??
    (async (options: { readonly root: string; readonly app?: string }) =>
      discoverRepository(createFsReader(options.root), {
        root: options.root,
        ...(options.app === undefined ? {} : { app: options.app }),
      }))

  let manifest: RepositoryCapabilityManifest

  try {
    manifest = await discover({
      root: input.root,
      ...(input.app === undefined ? {} : { app: input.app }),
    })
  } catch (error) {
    return refusal(
      dryRun,
      stages,
      findings,
      'discovery-failed',
      `Discovery failed: ${error instanceof Error ? error.message : String(error)}. Nothing was written.`,
    )
  }

  stages.push('discovery')

  if (manifest.classification !== 'eligible') {
    return refusal(
      dryRun,
      stages,
      findings,
      'ineligible-repository',
      `Discovery classified the repository as ${manifest.classification}. Nothing was written.`,
      { snapshotHash: manifest.snapshotHash },
    )
  }

  stages.push('eligibility')

  const checkVersion = deps.checkVersion
  const versionCheck = checkVersion === undefined ? { ok: true } : checkVersion(manifest, profileId)
  stages.push('version-gate')

  if (!versionCheck.ok) {
    return refusal(
      dryRun,
      stages,
      findings,
      versionCheck.code ?? 'outside-verified-range',
      versionCheck.message ??
        'The declared framework version is outside the verified range. Nothing was written.',
      { snapshotHash: manifest.snapshotHash },
    )
  }

  if (deps.lower === undefined || deps.emit === undefined) {
    return refusal(
      dryRun,
      stages,
      findings,
      'missing-provider',
      deps.lower === undefined
        ? 'No source transform provider is registered for this run. Nothing was written.'
        : 'No target provider is registered for this run. Nothing was written.',
      { snapshotHash: manifest.snapshotHash },
    )
  }

  const lower = deps.lower
  const emit = deps.emit

  let inspect: TransformInspectPlan

  if (deps.inspectPlan === undefined) {
    inspect = {
      adapterId: 'unknown',
      graph: {
        schemaVersion: 1,
        source: { adapterId: 'unknown', displayName: 'unknown' },
        routes: [],
        screens: [],
        units: [],
        actions: [],
        data: [],
        capabilities: [],
        dependencies: [],
        edges: [],
        findings: [],
      },
      plan: { decisions: [] },
    }
  } else {
    try {
      inspect = await deps.inspectPlan({
        root: input.root,
        ...(input.app === undefined ? {} : { app: input.app }),
        profile: profileId,
        manifest,
      })
    } catch (error) {
      return refusal(
        dryRun,
        stages,
        findings,
        'inspect-failed',
        `Inspect and plan failed: ${error instanceof Error ? error.message : String(error)}. Nothing was written.`,
        { snapshotHash: manifest.snapshotHash },
      )
    }
  }

  stages.push('inspect-plan')

  let lowering: LoweringResult

  try {
    lowering = await lower.lower(
      {
        rootDir: input.root,
        ...(input.app === undefined ? {} : { application: input.app }),
      },
      {
        adapterId: inspect.adapterId,
        graph: inspect.graph,
      } satisfies LoweringSnapshot,
      { id: profileId } satisfies LoweringProfile,
    )
  } catch (error) {
    return refusal(
      dryRun,
      stages,
      findings,
      'lower-failed',
      `Lowering failed: ${error instanceof Error ? error.message : String(error)}. Nothing was written.`,
      { snapshotHash: manifest.snapshotHash },
    )
  }

  stages.push('lower')
  findings.push(...lowering.findings)
  refusals.push(...lowering.findings)

  let emission: EmissionResult

  try {
    emission = await emit.emit(lowering.workflow, { id: profileId })
  } catch (error) {
    return refusal(
      dryRun,
      stages,
      findings,
      'emit-failed',
      `Emission failed: ${error instanceof Error ? error.message : String(error)}. Nothing was written.`,
      { snapshotHash: manifest.snapshotHash, coverage: lowering.coverage },
    )
  }

  stages.push('emit')
  findings.push(...emission.findings)
  refusals.push(...emission.findings)

  const coverage: TransformCoverageTotals = {
    generated: lowering.coverage.generated,
    manualRequired: lowering.coverage.manualRequired,
    excluded: lowering.coverage.excluded,
    refused: lowering.coverage.refused,
  }

  const incompleteWorkflowFindings: TransformFinding[] = lowering.workflow.screens
    .filter((screen) => screen.coverage.kind !== 'generated')
    .map((screen) => ({
      code: 'incomplete-workflow',
      message: `The screen "${screen.id}" has coverage "${screen.coverage.kind}" and blocks the generated workflow.`,
    }))

  findings.push(...incompleteWorkflowFindings)
  refusals.push(...incompleteWorkflowFindings)

  const generatedFiles: PlannedFile[] = emission.files.map((file) => ({
    path: file.path.startsWith(TRANSFORM_LAYOUT.generated)
      ? file.path
      : `${TRANSFORM_LAYOUT.generated}${file.path.replace(/^\/+/, '')}`,
    content: file.content,
  }))

  let sharedFiles: readonly PlannedFile[] = []
  let migratedFindings: readonly TransformFinding[] = []

  if (deps.migrate !== undefined && refusals.length === 0) {
    try {
      const migrated = await deps.migrate({
        root: input.root,
        output: input.output,
        profile: profileId,
        manifest,
        inspect,
        lowering,
        emission,
        write,
      })
      sharedFiles = migrated.files.map((file) => ({
        path: file.path.startsWith(TRANSFORM_LAYOUT.shared)
          ? file.path
          : `${TRANSFORM_LAYOUT.shared}${file.path.replace(/^\/+/, '')}`,
        content: file.content,
      }))
      migratedFindings = migrated.findings ?? []
    } catch (error) {
      return refusal(
        dryRun,
        stages,
        findings,
        'migrate-failed',
        `Migration failed: ${error instanceof Error ? error.message : String(error)}. Nothing was written.`,
        { snapshotHash: manifest.snapshotHash, coverage },
      )
    }
  }

  findings.push(...migratedFindings)
  stages.push('migrate')

  const workflowHash = hashWorkflow(lowering.workflow)
  stages.push('provenance')

  let scaffoldFiles: readonly PlannedFile[] = []
  let scaffoldFindings: readonly TransformFinding[] = []
  let workspaceCommands: readonly string[] = []

  if (deps.workspace !== undefined && refusals.length === 0) {
    try {
      const scaffolded = await deps.workspace.scaffold({ lowering, emission })
      scaffoldFiles = scaffolded.files
      scaffoldFindings = scaffolded.findings
      workspaceCommands = scaffolded.commands
    } catch (error) {
      return refusal(
        dryRun,
        stages,
        findings,
        'scaffold-failed',
        `Scaffold failed: ${error instanceof Error ? error.message : String(error)}. Nothing was written.`,
        { snapshotHash: manifest.snapshotHash, workflowHash, coverage },
      )
    }
  }

  findings.push(...scaffoldFindings)
  refusals.push(...scaffoldFindings.filter((finding) => finding.code.startsWith('scaffold-')))

  const deltas: TransformDelta[] = manifest.deltas.map((delta) => ({
    id: delta.id,
    description: delta.description,
  }))

  const manualFiles: PlannedFile[] = [
    {
      path: `${TRANSFORM_LAYOUT.manual}REPORT.md`,
      content: [
        '# Manual work',
        '',
        `Classification: ${manifest.classification}`,
        `Manual required (coverage): ${coverage.manualRequired}`,
        '',
        ...(deltas.length === 0
          ? ['No deltas.']
          : ['## Deltas', '', ...deltas.map((delta) => `- ${delta.id}: ${delta.description}`)]),
        '',
      ].join('\n'),
    },
  ]

  const commands = [
    commandFor(input),
    ...workspaceCommands.map((command) => `cd ${input.output} && ${command}`),
  ]

  const planned = ensureLayoutCoverage([
    ...generatedFiles,
    ...sharedFiles,
    ...manualFiles,
    ...scaffoldFiles,
  ])
  const plannedPaths = [...planned.map((file) => file.path), TRANSFORM_LAYOUT.manifest].sort(
    (left, right) => left.localeCompare(right),
  )

  stages.push('scaffold')

  const deltasForManifest = deltas
  const manifestDocument: TransformManifestDocument = {
    schemaVersion: 1,
    profile: profileId,
    root: input.root,
    app: input.app ?? null,
    output: input.output,
    snapshotHash: manifest.snapshotHash,
    workflowHash,
    classification: manifest.classification,
    coverage,
    deltas: deltasForManifest,
    files: plannedPaths,
    stages: [...stages],
    commands,
  }

  if (refusals.length > 0) {
    return {
      ok: false,
      dryRun,
      stages,
      findings,
      refusals,
      layout: TRANSFORM_LAYOUT,
      coverage,
      deltas,
      plannedPaths,
      commands,
      snapshotHash: manifest.snapshotHash,
      workflowHash,
      manifest: manifestDocument,
    }
  }

  const ok = true

  if (write) {
    for (const file of planned) {
      const target = resolve(outputResolved, file.path)

      if (!isInside(outputResolved, target)) {
        return refusal(
          dryRun,
          stages,
          findings,
          'unsafe-path',
          `A planned path escapes the output directory: ${file.path}. Nothing was written.`,
          {
            snapshotHash: manifest.snapshotHash,
            workflowHash,
            coverage,
            deltas,
            layout: TRANSFORM_LAYOUT,
            plannedPaths: [],
            commands,
          },
        )
      }

      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, file.content)
    }

    writeFileSync(
      join(outputResolved, TRANSFORM_LAYOUT.manifest),
      `${JSON.stringify(manifestDocument, null, 2)}\n`,
    )
  }

  return {
    ok,
    dryRun,
    stages,
    findings,
    refusals,
    layout: TRANSFORM_LAYOUT,
    coverage,
    deltas,
    plannedPaths,
    commands,
    snapshotHash: manifest.snapshotHash,
    workflowHash,
    manifest: manifestDocument,
  }
}

/** Renders a transform result as human-readable lines. */
export function renderTransform(result: TransformResult): readonly string[] {
  const lines: string[] = []

  lines.push(
    result.ok
      ? result.dryRun
        ? 'Dry run: nothing was written. Add --write to transform.'
        : 'Transformed: the planned files were written.'
      : 'Transform refused: nothing was written.',
  )
  lines.push('')
  lines.push(`Stages (${result.stages.length}): ${result.stages.join(' -> ')}`)

  if (result.refusals.length > 0) {
    lines.push('')
    lines.push(`Refusals (${result.refusals.length})`)

    for (const finding of result.refusals) {
      lines.push(`  ${finding.code}: ${finding.message}`)
    }
  }

  if (result.ok) {
    lines.push('')
    lines.push(
      `Layout: ${result.layout.generated} ${result.layout.shared} ${result.layout.manual} ${result.layout.manifest}`,
    )
    lines.push(
      `Coverage: generated=${result.coverage.generated} manual=${result.coverage.manualRequired} excluded=${result.coverage.excluded} refused=${result.coverage.refused}`,
    )
    lines.push(`Deltas (${result.deltas.length})`)

    for (const delta of result.deltas) {
      lines.push(`  ${delta.id}: ${delta.description}`)
    }

    lines.push('')
    lines.push(`Planned paths (${result.plannedPaths.length})`)

    for (const path of result.plannedPaths) {
      lines.push(`  ${path}`)
    }

    lines.push('')
    lines.push('Commands:')

    for (const command of result.commands) {
      lines.push(`  ${command}`)
    }
  }

  return lines
}

/** Serializes a transform result for `--json`. */
export function transformToJson(result: TransformResult): string {
  return `${JSON.stringify(result, null, 2)}\n`
}

export { createMemoryReader }
