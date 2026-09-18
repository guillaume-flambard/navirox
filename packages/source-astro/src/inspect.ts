import type { Finding, SourceLocation } from '@navirox/graph'
import { findingId } from '@navirox/graph'
import type {
  DiscoveredCapability,
  DiscoveredDependency,
  DiscoveredUnit,
  InspectContext,
  SourceInspection,
} from '@navirox/source'
import {
  declaredMajor,
  declaredRange,
  isApplicationModule,
  productionDependencies,
  readManifest,
  scanCapabilities,
  stripComments,
  testedMajors,
} from '@navirox/source'
import { createReactAdapter } from '@navirox/source-react'
import { createSvelteAdapter } from '@navirox/source-svelte'
import { createVueAdapter } from '@navirox/source-vue'

import { ADAPTER_ID, COMPOSES, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import type { IslandReading } from './islands.js'
import { readIntegrations, readIslands } from './islands.js'
import type { FindingDraft } from './routes.js'
import { isServerSurface, pageSegments, readRoutes } from './routes.js'

const FRAMEWORK_EXTENSIONS: Readonly<Record<string, readonly string[]>> = {
  vue: ['.vue'],
  svelte: ['.svelte'],
  react: ['.tsx', '.jsx'],
}

const JSX_FAMILIES = ['react', 'preact', 'solid']

function fileMatchesFramework(file: string, framework: string): boolean {
  const extensions = FRAMEWORK_EXTENSIONS[framework] ?? []
  return extensions.some((extension) => file.endsWith(extension))
}

/**
 * The frameworks this project installs that this adapter can hand over. A JSX
 * family is left out when two of them are installed, because they share their
 * extensions and neither Astro nor this adapter can tell which one a file is.
 */
function delegatedFrameworks(declaredNames: ReadonlySet<string>): readonly string[] {
  const jsxCount = JSX_FAMILIES.filter((name) => declaredNames.has(name)).length
  return COMPOSES.filter((framework) => declaredNames.has(framework)).filter(
    (framework) => !JSX_FAMILIES.includes(framework) || jsxCount <= 1,
  )
}

function finding(
  code: string,
  severity: Finding['severity'],
  title: string,
  message: string,
  source?: SourceLocation,
): Finding {
  return {
    id: findingId({ adapterId: ADAPTER_ID, code, key: source?.file ?? 'project' }),
    code,
    severity,
    title,
    message,
    evidence: [{ kind: 'source', value: source?.file ?? 'project' }],
    ...(source === undefined ? {} : { source }),
  }
}

function draftToFinding(draft: FindingDraft): Finding {
  return finding(draft.code, 'info', draft.title, draft.message, {
    file: draft.file,
    adapterId: ADAPTER_ID,
  })
}

function stemOf(file: string): string {
  const name = file.slice(file.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot === -1 ? name : name.slice(0, dot)
}

function asAstroSource(unit: { source: SourceLocation }): SourceLocation {
  return { ...unit.source, adapterId: ADAPTER_ID }
}

/**
 * Read an Astro project. The adapter reads its own files: every `.astro` file
 * is a component, the modules that are not framework code are utilities, and the
 * routes come from `src/pages`. The framework components are handed to the
 * adapter of their framework, because a Vue component is Vue's code no matter
 * which file imports it, and this adapter would only be guessing at it.
 *
 * Two attribution rules live here and nowhere else. Every node carries this
 * adapter's id, including the nodes another adapter read, because this adapter
 * is what produced the fragment. A finding keeps the id of the adapter that made
 * it, because a finding is a claim and the claimant is part of the claim: two
 * adapters can hold an opinion about the same file, and one id would make them
 * the same opinion.
 */
export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const manifest = readManifest(context, ADAPTER_ID)
  const declared = manifest === undefined ? undefined : declaredRange(manifest, FRAMEWORK)
  const range = declared?.range
  const major = range === undefined ? undefined : declaredMajor(range)

  const dependencies: DiscoveredDependency[] =
    manifest === undefined
      ? []
      : productionDependencies(manifest).map((dependency) => ({
          key: dependency.name,
          name: dependency.name,
          version: dependency.range,
          source: { ...manifest.source, adapterId: ADAPTER_ID },
        }))

  const findings: Finding[] = []
  const { routes, findings: routeFindings } = readRoutes(context.files)
  findings.push(...routeFindings.map(draftToFinding))

  const declaredNames = new Set(dependencies.map((dependency) => dependency.name))
  const delegated = delegatedFrameworks(declaredNames)
  const delegatedExtensions = new Set(
    delegated.flatMap((framework) => FRAMEWORK_EXTENSIONS[framework] ?? []),
  )

  const islandsByFile = new Map<string, readonly IslandReading[]>()
  const units: DiscoveredUnit[] = []
  const capabilities: DiscoveredCapability[] = []

  for (const file of context.files) {
    const extension = file.slice(file.lastIndexOf('.'))
    const underPages = pageSegments(file) !== undefined

    if (extension === '.astro') {
      const text = context.readText(file)
      const reading = readIslands(file, text ?? '', context.files)
      islandsByFile.set(file, reading.islands)
      findings.push(...reading.findings.map(draftToFinding))

      units.push({
        key: 'default',
        kind: 'component',
        name: stemOf(file),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
        metadata: { islands: reading.islands },
      })

      if (text !== undefined) {
        capabilities.push(...capabilitiesIn(file, text))
      }
      continue
    }

    if (underPages || isServerSurface(file)) {
      continue
    }

    if (delegatedExtensions.has(extension)) {
      continue
    }

    if (isApplicationModule(file)) {
      units.push({
        key: 'default',
        kind: 'utility',
        name: stemOf(file),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
        metadata: {},
      })
      const text = context.readText(file)
      if (text !== undefined) {
        capabilities.push(...capabilitiesIn(file, text))
      }
    }
  }

  for (const file of context.files) {
    if (!isServerSurface(file) || pageSegments(file) !== undefined) {
      continue
    }
    const code = /^astro\.config\./.test(file) ? 'astro-config' : 'astro-middleware'
    const title =
      code === 'astro-config' ? 'Build configuration' : 'Code outside the browser runtime'
    findings.push(
      finding(
        code,
        'info',
        title,
        `${file} runs outside the application this migration targets, so this adapter reports it rather than reading it as application code.`,
        { file, adapterId: ADAPTER_ID },
      ),
    )
  }

  findings.push(
    ...readIntegrations(dependencies.map((dependency) => dependency.name)).map(draftToFinding),
  )

  for (const framework of delegated) {
    const narrowed: InspectContext = {
      ...context,
      files: context.files.filter((file) => fileMatchesFramework(file, framework)),
    }
    const delegated = await delegatedInspection(framework, narrowed)

    for (const unit of delegated.units) {
      units.push({ ...unit, source: asAstroSource(unit) })
    }
    for (const capability of delegated.capabilities) {
      capabilities.push({ ...capability, source: asAstroSource(capability) })
    }
    findings.push(...delegated.findings.filter((entry) => entry.code !== 'framework-not-declared'))
  }

  if (
    range !== undefined &&
    major !== undefined &&
    !testedMajors(TESTED_VERSIONS).includes(major)
  ) {
    findings.push(
      finding(
        'version-untested',
        'warning',
        `Untested ${DISPLAY_NAME} version`,
        `${FRAMEWORK} ${range} is outside the versions this adapter has been tested against (${TESTED_VERSIONS.join(', ')}), so major ${major} is reported rather than assumed to be supported.`,
        manifest === undefined ? undefined : { ...manifest.source, adapterId: ADAPTER_ID },
      ),
    )
  }

  return {
    descriptor: {
      adapterId: ADAPTER_ID,
      displayName: DISPLAY_NAME,
      ...(range === undefined ? {} : { frameworkVersion: range }),
    },
    units: units.sort((left, right) => left.source.file.localeCompare(right.source.file)),
    capabilities: capabilities.sort((left, right) =>
      left.source.file.localeCompare(right.source.file),
    ),
    dependencies,
    routes,
    findings: findings.sort((left, right) => left.id.localeCompare(right.id)),
  }
}

function capabilitiesIn(file: string, text: string): readonly DiscoveredCapability[] {
  return scanCapabilities(stripComments(text)).map((match) => ({
    key: `${match.capability}:${match.usage}`,
    capability: match.capability,
    usage: match.usage,
    source: { file, adapterId: ADAPTER_ID, start: { line: match.line, column: 1 } },
    unitKey: 'default',
  }))
}

async function delegatedInspection(
  framework: string,
  context: InspectContext,
): Promise<SourceInspection> {
  if (framework === 'vue') {
    return createVueAdapter().inspect(context)
  }
  if (framework === 'svelte') {
    return createSvelteAdapter().inspect(context)
  }
  return createReactAdapter().inspect(context)
}
