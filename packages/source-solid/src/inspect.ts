import type { Finding, SourceLocation } from '@memolabs-apps/graph'
import { findingId } from '@memolabs-apps/graph'
import type {
  DiscoveredCapability,
  DiscoveredDependency,
  DiscoveredRoute,
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
import { readDeclaration } from './components.js'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import type { FindingDraft } from './routes.js'
import { isRoutesFile, readRoutes } from './routes.js'

/**
 * What Solid adds, and what it costs to read it.
 *
 * A Solid project is read through the same lenses as a React one, because the
 * two frameworks describe an application the same way: a module that exports a
 * function returning elements, a module that declares the state, and a file
 * that declares the routes. Where they differ is the state library and the
 * router, and both differences are named in the modules next to this one. The
 * reactivity model itself is not modelled at all: a signal is a construction of
 * the framework, so it stays where the graph keeps framework constructions,
 * which is nowhere.
 */

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
  const name = file.split('/').at(-1) ?? file

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

export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const manifest = readManifest(context, ADAPTER_ID)
  const declared = manifest === undefined ? undefined : declaredRange(manifest, FRAMEWORK)
  const major = declaredMajor(declared?.range ?? '')

  const units: DiscoveredUnit[] = []
  const capabilities: DiscoveredCapability[] = []
  const routes: DiscoveredRoute[] = []
  const findings: Finding[] = []

  for (const file of context.files) {
    const text = context.readText(file)

    if (text === undefined) {
      continue
    }

    if (isRoutesFile(file)) {
      const reading = readRoutes(file, text)

      routes.push(...reading.routes)
      findings.push(...reading.findings.map(draftToFinding))

      continue
    }

    const declaration = readDeclaration(text)
    const applicationModule = isApplicationModule(file)

    if (declaration.component) {
      units.push({
        key: 'default',
        kind: 'component',
        name: stemOf(file),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
        metadata: { returnsElement: declaration.returnsElement },
      })
    } else if (declaration.declaresStore) {
      units.push({
        key: 'default',
        kind: 'state-module',
        name: stemOf(file),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
      })
    } else if (applicationModule) {
      units.push({
        key: 'default',
        kind: 'utility',
        name: stemOf(file),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
        metadata: {},
      })
    }

    if (declaration.component || declaration.declaresStore || applicationModule) {
      capabilities.push(...capabilitiesIn(file, text))
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
        'Untested Solid version',
        `This project declares ${FRAMEWORK} ${declared.range}, and this adapter has only been exercised against ${TESTED_VERSIONS.join(', ')}.`,
        manifest?.source,
      ),
    )
  }

  const dependencies: DiscoveredDependency[] =
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
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings: findings.sort((left, right) => left.id.localeCompare(right.id)),
  }
}
