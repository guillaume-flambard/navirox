import type { AppGraphFragment, Finding } from '@navirox/graph'
import { findingId } from '@navirox/graph'
import type { InspectContext, SourceInspection } from '@navirox/source'
import {
  buildFragment,
  declaredMajor,
  declaredRange,
  readManifest,
  testedMajors,
} from '@navirox/source'
import { createVueAdapter } from '@navirox/source-vue'
import type { FindingDraft, PageMetadata } from './conventions.js'
import {
  CLIENT_COMPONENT_SUFFIX,
  LAYOUTS_DIRS,
  SERVER_SURFACE,
  readRoutes,
  readUnits,
  readUnmodelled,
} from './conventions.js'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'

/**
 * Nuxt, inspected by composition.
 *
 * The Vue adapter reads the components, the composables and the state modules,
 * because a Nuxt application is a Vue application. What this adapter adds is what
 * Nuxt adds and nothing more: the directories that establish routes, the layout
 * units, the page metadata macro, the two halves of a component, and the files
 * that run somewhere the target does not.
 */

const MIDDLEWARE_DIRS = SERVER_SURFACE.filter((entry) => entry.code === 'nuxt-middleware').map(
  (entry) => entry.dir,
)

function nuxtRange(context: InspectContext): string | undefined {
  const manifest = readManifest(context, ADAPTER_ID)

  return manifest === undefined ? undefined : declaredRange(manifest, FRAMEWORK)?.range
}

function finding(
  code: string,
  severity: Finding['severity'],
  title: string,
  message: string,
  source?: { readonly file: string; readonly adapterId: string },
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
  const source = { file: draft.file, adapterId: ADAPTER_ID }

  return finding(draft.code, 'info', draft.title, draft.message, source)
}

/** A file the adapter read nothing from, with the reason for that code. */
function unmodelledFinding(entry: {
  readonly code: string
  readonly what: string
  readonly file: string
}): Finding {
  const source = { file: entry.file, adapterId: ADAPTER_ID }

  if (entry.code === 'nuxt-app-config') {
    return finding(
      entry.code,
      'info',
      'The application configuration is not read',
      'This file is configuration rather than application code, and Nuxt publishes it to the client bundle on purpose. This adapter names it instead of reading values out of it.',
      source,
    )
  }

  if (entry.code === 'nuxt-server-component') {
    return finding(
      entry.code,
      'info',
      'A component that renders on the server',
      'A component with the `.server` suffix renders on the server, as what Nuxt calls an island. This adapter does not model a runtime the target application does not have.',
      source,
    )
  }

  return finding(
    entry.code,
    'info',
    'Code outside the browser runtime',
    `This file is ${entry.what}, which runs in a different runtime, and this adapter does not model it.`,
    source,
  )
}

function versionFinding(context: InspectContext): readonly Finding[] {
  const range = nuxtRange(context)

  if (range === undefined) {
    return []
  }

  const major = declaredMajor(range)

  if (major === undefined || testedMajors(TESTED_VERSIONS).includes(major)) {
    return []
  }

  const manifest = readManifest(context, ADAPTER_ID)

  return [
    finding(
      'version-untested',
      'warning',
      `Untested ${FRAMEWORK} version`,
      `This project declares ${FRAMEWORK} ${range}, and this adapter has been exercised against ${TESTED_VERSIONS.join(
        ', ',
      )}. Its major is ${major}, so the reading is a best effort rather than a supported one.`,
      manifest?.source,
    ),
  ]
}

/** The names a set of files gives to the directories they live in. */
function namesIn(files: readonly string[], directories: readonly string[]): ReadonlySet<string> {
  const names = new Set<string>()

  for (const file of files) {
    const directory = directories.find((entry) => file.startsWith(`${entry}/`))

    if (directory !== undefined) {
      names.add(file.slice(directory.length + 1).replace(/\.[^./]+$/, ''))
    }
  }

  return names
}

/**
 * What a page asked for that no file provides.
 *
 * `definePageMeta` names a layout and names middleware, and both are files in
 * documented directories. A name with no file behind it is the kind of thing a
 * migration has to know about, so it is reported rather than dropped.
 */
function missingReferences(
  file: string,
  metadata: PageMetadata,
  layouts: ReadonlySet<string>,
  middleware: ReadonlySet<string>,
): readonly Finding[] {
  const source = { file, adapterId: ADAPTER_ID }
  const findings: Finding[] = []

  if (typeof metadata.layout === 'string' && !layouts.has(metadata.layout)) {
    findings.push(
      finding(
        'nuxt-page-layout-missing',
        'warning',
        'A page names a layout that is not there',
        `This page declares the layout ${metadata.layout}, and no file under ${LAYOUTS_DIRS.join(
          ', ',
        )} provides it.`,
        source,
      ),
    )
  }

  for (const name of metadata.middleware) {
    if (!middleware.has(name)) {
      findings.push(
        finding(
          'nuxt-page-middleware-missing',
          'warning',
          'A page names middleware that is not there',
          `This page declares the middleware ${name}, and no file under ${MIDDLEWARE_DIRS.join(
            ', ',
          )} provides it.`,
          source,
        ),
      )
    }
  }

  return findings
}

export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const base = await createVueAdapter().inspect(context)

  // Nuxt provides Vue, so a project that declares Nuxt and not Vue is normal, and
  // the base adapter's warning about it would be a false statement. The Nuxt
  // version check below takes its place.
  const inherited = base.findings.filter((entry) => entry.code !== 'framework-not-declared')

  const outsideRuntime = readUnmodelled(context.files)
  const outsideRuntimeFiles = new Set(outsideRuntime.map((entry) => entry.file))
  const unmodelled = outsideRuntime.map((entry) => unmodelledFinding(entry))

  const { routes, pages, findings: pageFindings } = readRoutes(context.files, context.readText)
  const pageMetadata = new Map(pages.map((page) => [page.file, page.metadata]))

  const layouts = namesIn(context.files, LAYOUTS_DIRS)
  const middleware = namesIn(context.files, MIDDLEWARE_DIRS)

  const referenceFindings = pages.flatMap((page) =>
    missingReferences(page.file, page.metadata, layouts, middleware),
  )

  const units = [
    ...base.units.filter((unit) => !outsideRuntimeFiles.has(unit.source.file)),
    ...readUnits(context.files),
  ]
    .map((unit) => {
      const page = pageMetadata.get(unit.source.file)

      if (unit.source.file.endsWith(CLIENT_COMPONENT_SUFFIX)) {
        return { ...unit, metadata: { ...(unit.metadata ?? {}), rendersOnlyOnClient: true } }
      }

      if (page === undefined) {
        return unit
      }

      return { ...unit, metadata: { ...(unit.metadata ?? {}), page } }
    })
    .sort((left, right) => left.source.file.localeCompare(right.source.file))

  const range = nuxtRange(context)

  return {
    descriptor: {
      adapterId: ADAPTER_ID,
      displayName: DISPLAY_NAME,
      ...(range === undefined ? {} : { frameworkVersion: range }),
    },
    units,
    capabilities: base.capabilities,
    dependencies: base.dependencies,
    routes,
    findings: [
      ...inherited,
      ...versionFinding(context),
      ...unmodelled,
      ...pageFindings.map(draftToFinding),
      ...referenceFindings,
    ].sort((left, right) => left.id.localeCompare(right.id)),
  }
}

export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  // Every identifier carries this adapter's id, including for the components the
  // Vue adapter read, because this adapter is what produced the fragment.
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
