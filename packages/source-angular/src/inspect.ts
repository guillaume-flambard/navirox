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
  isSourceFile,
  productionDependencies,
  readManifest,
  scanCapabilities,
  testedMajors,
} from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import { readDeclaration } from './decorators.js'
import { classifyReadiness } from './readiness.js'
import { isRoutingModuleFile, isRoutesFile, readRoutes, type FindingDraft } from './routes.js'

/**
 * Reads an Angular project.
 *
 * Three readings decide what a file is, and none of them is its name. A decorator
 * says whether the file declares a component, a service or a pipe; what the class
 * holds says whether a service carries state; and the routes file says which URLs
 * the application serves.
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
 * The decorator wins over the file name and over the generic application module
 * rule, and the injectable case is the judgement this adapter has to make: a
 * service that holds reactive state is a state module, and one that holds none is a
 * utility. Angular has no store library to look for, so the reading has to be about
 * content, and reporting every service as a utility would have hidden the state a
 * migration has to carry.
 */
function readModule(file: string, text: string): { unit?: DiscoveredUnit; findings: Finding[] } {
  const name =
    file
      .split('/')
      .at(-1)
      ?.replace(/\.[cm]?ts$/, '') ?? file
  const declaration = readDeclaration(text)
  const findings: Finding[] = []

  if (declaration.module) {
    findings.push(
      finding(
        'angular-module',
        'warning',
        'A module declaration was not modelled',
        `${file} declares a module. This adapter reads the standalone era, where a component declares its own imports, and it has no reading for what a module assembles.`,
        location(file, 1),
      ),
    )
  }

  if (declaration.externalTemplate) {
    findings.push(
      finding(
        'angular-external-template',
        'info',
        'A template file was not read',
        `${file} points at a template file rather than declaring its template inline. The component is reported and its template is not read, so anything the template does is not in this reading.`,
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
        metadata: {
          inlineTemplate: declaration.inlineTemplate,
          externalTemplate: declaration.externalTemplate,
        },
      },
      findings,
    }
  }

  if (declaration.pipe) {
    return { unit: { key: 'default', kind: 'utility', name, source: location(file, 1) }, findings }
  }

  if (declaration.injectable) {
    return {
      unit: {
        key: 'default',
        kind: declaration.holdsState ? 'state-module' : 'utility',
        name,
        source: location(file, 1),
        metadata: { holdsState: declaration.holdsState },
      },
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
  const unitTexts = new Map<string, string>()
  const capabilities: DiscoveredCapability[] = []
  const dependencies: DiscoveredDependency[] = []
  const routes: DiscoveredRoute[] = []
  const manifest = readManifest(context, ADAPTER_ID)

  let frameworkVersion: string | undefined

  if (manifest === undefined) {
    findings.push(
      finding(
        'manifest-unreadable',
        'error',
        'No readable manifest',
        'No package.json could be read, so the declared Angular version and the dependencies are unknown.',
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

    const angular = declaredRange(manifest, FRAMEWORK)

    if (angular === undefined) {
      findings.push(
        finding(
          'framework-not-declared',
          'warning',
          'Angular is not declared',
          `The manifest declares no ${FRAMEWORK} dependency, so no version could be checked.`,
          manifest.source,
        ),
      )
    } else {
      frameworkVersion = angular.range
      const major = declaredMajor(angular.range)

      if (major !== undefined && !testedMajors(TESTED_VERSIONS).includes(major)) {
        findings.push(
          finding(
            'version-untested',
            'warning',
            'Untested Angular version',
            `The project declares ${FRAMEWORK} ${angular.range}. This adapter was tested against ${TESTED_VERSIONS.join(', ')}, so the major ${major} is not covered and no support is claimed for it.`,
            manifest.source,
            [
              {
                kind: 'manifest',
                value: `${manifest.source.file} ${angular.field}.${FRAMEWORK} ${angular.range}`,
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

    if (text.includes('loadRemoteModule(')) {
      findings.push(
        finding(
          'angular-remote-configuration',
          'warning',
          'A remote configuration was not read',
          `${file} loads a federated remote module. The routes and components that arrive from that remote are not read, so nothing it contributes is in this report.`,
          location(file, 1),
        ),
      )
    }

    if (isRoutesFile(file) || isRoutingModuleFile(file)) {
      const reading = readRoutes(file, text)

      routes.push(...reading.routes)
      findings.push(...reading.findings.map(draftToFinding))

      if (isRoutingModuleFile(file)) {
        const { unit, findings: moduleFindings } = readModule(file, text)

        findings.push(...moduleFindings)

        if (unit !== undefined) {
          units.push(unit)
          unitTexts.set(unit.source.file, text)
        }
      }

      continue
    }

    const { unit, findings: moduleFindings } = readModule(file, text)

    findings.push(...moduleFindings)

    if (unit !== undefined) {
      units.push(unit)
      unitTexts.set(unit.source.file, text)
    }

    if (!isApplicationModule(file)) {
      continue
    }

    for (const capability of capabilitiesIn(file, text)) {
      capabilities.push(unit === undefined ? capability : { ...capability, unitKey: unit.key })
    }
  }

  const classified = units.map((unit) => {
    const text = unitTexts.get(unit.source.file)

    if (text === undefined) {
      return unit
    }

    const routePatterns = routes
      .filter((route) => route.unitFile === unit.source.file)
      .map((route) => route.pathPattern)

    return {
      ...unit,
      metadata: {
        ...unit.metadata,
        mobileReadiness: classifyReadiness({
          file: unit.source.file,
          text,
          externalTemplate: unit.metadata?.externalTemplate === true,
          routePatterns,
        }),
      },
    }
  })

  const bySource = (
    left: { readonly source: SourceLocation },
    right: { readonly source: SourceLocation },
  ): number =>
    left.source.file.localeCompare(right.source.file) ||
    (left.source.start?.line ?? 0) - (right.source.start?.line ?? 0)

  classified.sort(bySource)
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
    units: classified,
    capabilities,
    dependencies,
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings,
  })
}
