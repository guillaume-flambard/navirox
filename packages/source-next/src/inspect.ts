import type { Finding, SourceLocation } from '@navirox/graph'
import { findingId } from '@navirox/graph'
import type { DiscoveredUnit, InspectContext, SourceInspection } from '@navirox/source'
import { declaredMajor, declaredRange, readManifest, testedMajors } from '@navirox/source'
import { createReactAdapter } from '@navirox/source-react'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import { declaredBoundary, isAppRouterFile } from './boundary.js'
import { isServerSurface, readRoutes, type FindingDraft } from './routes.js'

/**
 * Inspects by composing.
 *
 * The React adapter reads the components, the state, the capability use and the
 * dependencies. This adapter adds what Next adds: two routers, layouts, the module
 * boundary as metadata, and the server surface as findings.
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

function nuxtLikeRange(context: InspectContext): string | undefined {
  const manifest = readManifest(context, ADAPTER_ID)

  return manifest === undefined ? undefined : declaredRange(manifest, FRAMEWORK)?.range
}

export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const base = await createReactAdapter().inspect(context)
  const { routes, layouts, findings: routeFindingDrafts } = readRoutes(context.files)
  const findings: Finding[] = [
    ...base.findings.filter((entry) => entry.code !== 'framework-not-declared'),
    ...routeFindingDrafts.map(draftToFinding),
  ]

  // The module boundary, and the layout units.
  const units: DiscoveredUnit[] = []

  for (const unit of base.units) {
    if (isServerSurface(unit.source.file)) {
      continue
    }

    const text = context.readText(unit.source.file)
    const boundary =
      text === undefined || !isAppRouterFile(unit.source.file)
        ? undefined
        : (declaredBoundary(text) ?? 'server')

    units.push(
      boundary === undefined
        ? unit
        : {
            ...unit,
            metadata: {
              ...(unit.metadata ?? {}),
              boundary,
            },
          },
    )
  }

  for (const file of layouts) {
    units.push({
      key: 'default',
      kind: 'layout',
      name:
        file
          .split('/')
          .at(-1)
          ?.replace(/\.(tsx|ts|jsx|js|mts|mjs)$/, '') ?? file,
      source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
    })
  }

  // The server surface is reported and never read as application code.
  for (const file of context.files.filter(isServerSurface)) {
    findings.push(
      finding(
        'next-server-surface',
        'info',
        'Code outside the browser runtime',
        `${file} is part of the server surface. It runs in a different runtime, and this adapter does not model it.`,
        { file, adapterId: ADAPTER_ID },
      ),
    )
  }

  const range = nuxtLikeRange(context)
  const major = range === undefined ? undefined : declaredMajor(range)

  if (
    range !== undefined &&
    major !== undefined &&
    !testedMajors(TESTED_VERSIONS).includes(major)
  ) {
    const manifest = readManifest(context, ADAPTER_ID)

    findings.push(
      finding(
        'version-untested',
        'warning',
        'Untested Next version',
        `The project declares ${FRAMEWORK} ${range}. This adapter was tested against ${TESTED_VERSIONS.join(', ')}, so the major ${major} is not covered and no support is claimed for it.`,
        manifest?.source,
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
    capabilities: base.capabilities,
    dependencies: base.dependencies,
    routes,
    findings: findings.sort((left, right) => left.id.localeCompare(right.id)),
  }
}
