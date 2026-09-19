import type { Finding, FindingSeverity, SourceLocation } from '@memolabs-apps/graph'
import { findingId } from '@memolabs-apps/graph'
import type {
  DiscoveredCapability,
  DiscoveredUnit,
  InspectContext,
  SourceInspection,
} from '@memolabs-apps/source'
import {
  declaredMajor,
  declaredRange,
  isApplicationModule,
  productionDependencies,
  readManifest,
  scanCapabilities,
  stripComments,
  testedMajors,
} from '@memolabs-apps/source'
import { isComponentExtension, readDeclaration } from './components.js'
import { readRoutes } from './routes.js'
import type { FindingDraft } from './routes.js'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'

/**
 * A Lit project is read for what the platform holds and the framework declares. Components are the
 * custom elements a module defines, state is a field an element owns, and routes are what a project
 * declares with the labs router. Nothing about the framework's reactivity, its shadow roots or its
 * directives enters the graph: those are construction details of the framework and they stay in
 * this adapter's metadata, which is where the graph keeps framework constructions.
 */

function finding(
  code: string,
  severity: FindingSeverity,
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
  const name = file.split('/').pop() ?? file
  return name.replace(/\.[cm]?[jt]s$/, '')
}

function capabilitiesIn(file: string, text: string): DiscoveredCapability[] {
  return scanCapabilities(stripComments(text)).map((match) => ({
    key: `${match.capability}:${match.usage}`,
    capability: match.capability,
    usage: match.usage,
    source: { file, adapterId: ADAPTER_ID, start: { line: match.line, column: 1 } },
    unitKey: 'default',
  }))
}

export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const manifest = readManifest(context, ADAPTER_ID)
  const declared = manifest === undefined ? undefined : declaredRange(manifest, FRAMEWORK)
  const major = declaredMajor(declared?.range ?? '')
  const readings = readRoutes(context.files, context.readText)

  const units: DiscoveredUnit[] = []
  const capabilities: DiscoveredCapability[] = []
  const findings: Finding[] = readings.findings.map(draftToFinding)

  for (const file of context.files) {
    const text = context.readText(file)

    if (text === undefined) {
      continue
    }

    const source = stripComments(text)
    const declaration = readDeclaration(text)
    let produced = false

    if (declaration.element && isComponentExtension(file)) {
      const metadata: Record<string, unknown> = { declaresProperty: declaration.declaresProperty }

      if (declaration.registration !== undefined) {
        metadata.registration = declaration.registration
      }

      if (declaration.tagName !== undefined) {
        metadata.tagName = declaration.tagName
      }

      units.push({
        key: 'default',
        kind: 'component',
        name: stemOf(file),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
        metadata,
      })
      produced = true
    } else if (isApplicationModule(file)) {
      units.push({
        key: 'default',
        kind: 'utility',
        name: stemOf(file),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
        metadata: {},
      })
      produced = true
    }

    if (produced) {
      capabilities.push(...capabilitiesIn(file, source))
    }
  }

  if (
    declared !== undefined &&
    major !== undefined &&
    !testedMajors(TESTED_VERSIONS).includes(major)
  ) {
    findings.push(
      finding(
        'version-untested',
        'warning',
        'Untested Lit version',
        `${FRAMEWORK} ${declared.range} was declared, and this adapter has been exercised against ${TESTED_VERSIONS.join(', ')}. Major ${major} was not tested.`,
        manifest?.source,
      ),
    )
  }

  const dependencies =
    manifest === undefined
      ? []
      : productionDependencies(manifest).map((dependency) => ({
          key: dependency.name,
          name: dependency.name,
          version: dependency.range,
          source: { ...manifest.source, adapterId: ADAPTER_ID },
        }))

  return {
    descriptor: {
      adapterId: ADAPTER_ID,
      displayName: DISPLAY_NAME,
      ...(declared === undefined ? {} : { frameworkVersion: declared.range }),
    },
    units: units.sort((left, right) => left.source.file.localeCompare(right.source.file)),
    capabilities: capabilities.sort(
      (left, right) =>
        left.source.file.localeCompare(right.source.file) || left.key.localeCompare(right.key),
    ),
    dependencies,
    routes: readings.routes,
    findings: findings.sort((left, right) => left.id.localeCompare(right.id)),
  }
}
