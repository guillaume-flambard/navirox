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
  declaredMajor,
  declaredRange,
  isApplicationModule,
  isSourceFile,
  productionDependencies,
  readManifest,
  scanCapabilities,
  testedMajors,
} from '@memolabs-apps/source'
import {
  ADAPTER_ID,
  DISPLAY_NAME,
  FRAMEWORK,
  NATIVE_RUNTIME,
  TESTED_VERSIONS,
  nativeDeclarations,
} from './detect.js'
import { readDeclaration } from './components.js'
import { isRoutesFile, readRoutes, type FindingDraft } from './routes.js'

/**
 * Reads a web React project.
 *
 * The reading is textual, over comment-stripped source, and it decides what a
 * module is from what the module exports. The one case this adapter is designed to
 * catch is the proximity the architecture warns about: a web project that declares
 * the native runtime is reaching the target, and that is reported rather than read
 * as an ordinary dependency.
 */

function location(file: string, line?: number): SourceLocation {
  return line === undefined
    ? { file, adapterId: ADAPTER_ID }
    : { file, adapterId: ADAPTER_ID, start: { line, column: 1 } }
}

function finding(
  code: string,
  severity: Finding['severity'],
  title: string,
  message: string,
  source?: SourceLocation,
  evidence?: Finding['evidence'],
): Finding {
  return {
    id: findingId({ adapterId: ADAPTER_ID, code, key: source?.file ?? 'project' }),
    code,
    severity,
    title,
    message,
    evidence: evidence ?? [{ kind: 'source', value: source?.file ?? 'project' }],
    ...(source === undefined ? {} : { source }),
  }
}

/**
 * Reads one module.
 *
 * A component is a function that returns an element. A class component is a
 * finding, because this adapter reads the function era and saying nothing about a
 * class would imply it had been understood. A store is a declaration through a
 * state library, and everything else that is application logic is a utility.
 */
function readModule(file: string, text: string): { unit?: DiscoveredUnit; findings: Finding[] } {
  const name =
    file
      .split('/')
      .at(-1)
      ?.replace(/\.[cm]?[jt]sx?$/, '') ?? file
  const declaration = readDeclaration(text)
  const findings: Finding[] = []

  if (declaration.classComponent) {
    findings.push(
      finding(
        'react-class-component',
        'warning',
        'A class component was not modelled',
        `${file} declares a class component. This adapter reads the function era, so the component is reported and its lifecycle is not read.`,
        location(file, 1),
      ),
    )
  }

  if (declaration.component) {
    return {
      unit: {
        key: 'default',
        kind: 'component',
        name,
        source: location(file, 1),
        metadata: { usesHooks: declaration.usesHooks },
      },
      findings,
    }
  }

  if (declaration.classComponent) {
    return {
      unit: { key: 'default', kind: 'component', name, source: location(file, 1) },
      findings,
    }
  }

  if (declaration.declaresStore) {
    return {
      unit: { key: 'default', kind: 'state-module', name, source: location(file, 1) },
      findings,
    }
  }

  if (!isApplicationModule(file)) {
    return { findings }
  }

  return { unit: { key: 'default', kind: 'utility', name, source: location(file, 1) }, findings }
}

function capabilitiesIn(file: string, text: string): DiscoveredCapability[] {
  const seen = new Set<string>()
  const capabilities: DiscoveredCapability[] = []

  for (const match of scanCapabilities(text)) {
    const key = `${match.capability}:${match.usage}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    capabilities.push({
      key,
      capability: match.capability,
      usage: match.usage,
      source: location(file, match.line),
    })
  }

  return capabilities
}

function draftToFinding(draft: FindingDraft): Finding {
  return finding(draft.code, 'info', draft.title, draft.message, location(draft.file))
}

export function inspect(context: InspectContext): Promise<SourceInspection> {
  const findings: Finding[] = []
  const units: DiscoveredUnit[] = []
  const capabilities: DiscoveredCapability[] = []
  const dependencies: DiscoveredDependency[] = []
  const routes = []
  const manifest = readManifest(context, ADAPTER_ID)

  let frameworkVersion: string | undefined

  if (manifest === undefined) {
    findings.push(
      finding(
        'manifest-unreadable',
        'error',
        'No readable manifest',
        'No package.json could be read, so the declared React version and the dependencies are unknown.',
      ),
    )
  } else {
    for (const dependency of productionDependencies(manifest)) {
      dependencies.push({
        key: dependency.name,
        name: dependency.name,
        version: dependency.range,
        source: manifest.source,
      })
    }

    for (const native of nativeDeclarations(manifest.json)) {
      findings.push(
        finding(
          'react-native-dependency',
          'warning',
          'A native dependency in a web project',
          `${manifest.source.file} declares ${native}, which belongs to the target side. A project that reaches ${NATIVE_RUNTIME} is a migration question rather than a plain web reading.`,
          manifest.source,
          [{ kind: 'manifest', value: `${manifest.source.file} ${native}` }],
        ),
      )
    }

    const react = declaredRange(manifest, FRAMEWORK)

    if (react === undefined) {
      findings.push(
        finding(
          'framework-not-declared',
          'warning',
          'React is not declared',
          `The manifest declares no ${FRAMEWORK} dependency, so no version could be checked.`,
          manifest.source,
        ),
      )
    } else {
      frameworkVersion = react.range
      const major = declaredMajor(react.range)

      if (major !== undefined && !testedMajors(TESTED_VERSIONS).includes(major)) {
        findings.push(
          finding(
            'version-untested',
            'warning',
            'Untested React version',
            `The project declares ${FRAMEWORK} ${react.range}. This adapter was tested against ${TESTED_VERSIONS.join(', ')}, so the major ${major} is not covered and no support is claimed for it.`,
            manifest.source,
            [
              {
                kind: 'manifest',
                value: `${manifest.source.file} ${react.field}.${FRAMEWORK} ${react.range}`,
              },
            ],
          ),
        )
      }
    }
  }

  for (const file of context.files.filter(isSourceFile)) {
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

    // Every module is read, not only the component extensions: a store or a utility
    // can live in a `.ts` file, and the capability scan runs over anything.
    const { unit, findings: moduleFindings } = readModule(file, text)

    findings.push(...moduleFindings)

    if (unit !== undefined) {
      units.push(unit)
    }

    // Capability use is read from the files this reading is about: a build config or
    // an entry point that touches the document is not a capability the application
    // uses, and reporting it would put a fact in the report that names no unit.
    if (!isApplicationModule(file)) {
      continue
    }

    for (const capability of capabilitiesIn(file, text)) {
      capabilities.push(unit === undefined ? capability : { ...capability, unitKey: unit.key })
    }
  }

  const bySource = (
    left: { readonly source: SourceLocation },
    right: { readonly source: SourceLocation },
  ): number =>
    left.source.file.localeCompare(right.source.file) ||
    (left.source.start?.line ?? 0) - (right.source.start?.line ?? 0)

  units.sort(bySource)
  capabilities.sort(bySource)
  dependencies.sort(
    (left, right) =>
      left.name.localeCompare(right.name) ||
      (left.source?.file ?? '').localeCompare(right.source?.file ?? ''),
  )
  findings.sort((left, right) => left.id.localeCompare(right.id))

  return Promise.resolve({
    descriptor: {
      adapterId: ADAPTER_ID,
      displayName: DISPLAY_NAME,
      ...(frameworkVersion === undefined ? {} : { frameworkVersion }),
    },
    units,
    capabilities,
    dependencies,
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings,
  })
}
