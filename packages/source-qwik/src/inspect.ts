import type { Finding, SourceLocation } from '@memolabs-apps/graph'
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
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import type { FindingDraft } from './routes.js'
import { readRoutes } from './routes.js'

/**
 * A Qwik project, read.
 *
 * Two things differ from every adapter before this one. A component is a
 * boundary rather than a function, so it is found by the boundary it declares,
 * and the state it creates belongs to it rather than to a module the application
 * shares, so no unit is ever reported as a `state-module`. Neither difference is
 * modelled: resumability and signals are framework constructs, and the graph
 * keeps framework constructs nowhere but inside a node's adapter metadata.
 */

function stemOf(file: string): string {
  const name = file.slice(file.lastIndexOf('/') + 1)
  const at = name.lastIndexOf('.')

  return at <= 0 ? name : name.slice(0, at)
}

function capabilitiesIn(file: string, text: string): readonly DiscoveredCapability[] {
  return scanCapabilities(stripComments(text)).map((entry) => ({
    key: `${entry.capability}:${entry.usage}`,
    capability: entry.capability,
    usage: entry.usage,
    source: { file, adapterId: ADAPTER_ID, start: { line: entry.line, column: 1 } },
    unitKey: 'default',
  }))
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

export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const manifest = readManifest(context, ADAPTER_ID)
  const declared = manifest === undefined ? undefined : declaredRange(manifest, FRAMEWORK)
  const major = declaredMajor(declared?.range ?? '')

  const readings = readRoutes(context.files, context.readText)
  const findings: Finding[] = readings.findings.map(draftToFinding)

  const units: DiscoveredUnit[] = []
  const capabilities: DiscoveredCapability[] = []

  for (const layout of readings.layouts) {
    units.push({
      key: layout.name,
      kind: 'layout',
      name: stemOf(layout.file),
      source: { file: layout.file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
    })
  }

  // A layout is already a unit above, and a file the reading reported is a
  // runtime this adapter does not model, so neither comes back as a module.
  const alreadyRead = new Set([
    ...readings.layouts.map((layout) => layout.file),
    ...readings.unmodelled,
  ])

  for (const file of context.files) {
    const text = context.readText(file)

    if (text === undefined || alreadyRead.has(file)) {
      continue
    }

    if (!isComponentExtension(file)) {
      if (isApplicationModule(file)) {
        units.push({
          key: 'default',
          kind: 'utility',
          name: stemOf(file),
          source: { file, adapterId: ADAPTER_ID },
        })
        capabilities.push(...capabilitiesIn(file, text))
      }

      continue
    }

    const declaration = readDeclaration(text)

    units.push({
      key: 'default',
      kind: 'component',
      name: stemOf(file),
      source: { file, adapterId: ADAPTER_ID },
      metadata: { declaresStore: declaration.declaresStore, usesSignal: declaration.usesSignal },
    })
    capabilities.push(...capabilitiesIn(file, text))
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
        `Untested ${DISPLAY_NAME} version`,
        `${FRAMEWORK} ${declared.range} is declared, and this adapter has been exercised against ${TESTED_VERSIONS.join(', ')}. Major ${major} is reported rather than assumed to be supported.`,
        manifest === undefined ? undefined : { ...manifest.source, adapterId: ADAPTER_ID },
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
    capabilities: capabilities.sort((left, right) =>
      left.source.file === right.source.file
        ? left.key.localeCompare(right.key)
        : left.source.file.localeCompare(right.source.file),
    ),
    dependencies,
    routes: readings.routes,
    findings: findings.sort((left, right) => left.id.localeCompare(right.id)),
  }
}
