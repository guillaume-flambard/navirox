import type { Finding, SourceLocation } from '@memolabs-apps/graph'
import { findingId } from '@memolabs-apps/graph'
import type {
  DiscoveredCapability,
  DiscoveredDependency,
  DiscoveredUnit,
  InspectContext,
  SourceInspection,
} from '@memolabs-apps/source'
import {
  isApplicationModule,
  productionDependencies,
  readManifest,
  scanCapabilities,
  stripComments,
} from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME } from './detect.js'
import type { FindingDraft } from './documents.js'
import { readDocuments } from './documents.js'

/**
 * A vanilla project is read for what the platform holds and nothing else. There is no component
 * model, no store module and no router, so this adapter reports documents as routes, application
 * modules as units, and the two kinds of code it cannot read as findings. Reactive state,
 * component boundaries and styles are framework concepts this source does not have, and the
 * report says so by containing none of them rather than by repeating a finding on every project.
 */

const RUNTIME_ROUTING =
  /\b(?:history\s*\.\s*(?:pushState|replaceState)|popstate|location\s*\.\s*hash)\b/

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
  return name.replace(/\.[cm]?[jt]sx?$/, '')
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

export function inspect(context: InspectContext): Promise<SourceInspection> {
  const manifest = readManifest(context, ADAPTER_ID)
  const {
    routes,
    scripts,
    findings: documentFindings,
  } = readDocuments(context.files, context.readText)
  const units: DiscoveredUnit[] = []
  const capabilities: DiscoveredCapability[] = []
  const findings: Finding[] = documentFindings.map(draftToFinding)
  const loadedBy = new Map<string, string[]>()

  for (const script of scripts) {
    const documents = loadedBy.get(script.module) ?? []
    documents.push(script.document)
    loadedBy.set(script.module, documents)
  }

  const dependencies: DiscoveredDependency[] =
    manifest === undefined
      ? []
      : productionDependencies(manifest).map((dependency): DiscoveredDependency => ({
          key: dependency.name,
          name: dependency.name,
          version: dependency.range,
          source: { ...manifest.source, adapterId: ADAPTER_ID },
        }))

  for (const file of context.files) {
    const text = context.readText(file)

    if (text === undefined) {
      continue
    }

    const source: SourceLocation = { file, adapterId: ADAPTER_ID }

    if (RUNTIME_ROUTING.test(stripComments(text))) {
      findings.push(
        finding(
          'vanilla-client-routing',
          'warning',
          'Addresses decided at runtime',
          'This module routes the application in code, so the addresses it serves are not in the source. This adapter reports the call rather than guessing at the routes it produces.',
          source,
        ),
      )
    }

    const documents = loadedBy.get(file)

    if (!isApplicationModule(file) && documents === undefined) {
      continue
    }

    units.push({
      key: 'default',
      kind: 'utility',
      name: stemOf(file),
      source,
      metadata: documents === undefined ? {} : { loadedBy: documents },
    })
    capabilities.push(...capabilitiesIn(file, text))
  }

  return Promise.resolve({
    descriptor: { adapterId: ADAPTER_ID, displayName: DISPLAY_NAME },
    units: units.sort((left, right) => left.source.file.localeCompare(right.source.file)),
    capabilities: capabilities.sort(
      (left, right) =>
        left.source.file.localeCompare(right.source.file) || left.key.localeCompare(right.key),
    ),
    dependencies,
    routes,
    findings: findings.sort((left, right) => left.id.localeCompare(right.id)),
  })
}
