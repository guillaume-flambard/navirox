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
  isSourceFile,
  productionDependencies,
  readManifest,
  scanCapabilities,
  testedMajors,
} from '@navirox/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import { scanUnmodelled } from './unmodelled.js'

/**
 * Reads a Svelte project the same way the Vue adapter reads a Vue one.
 *
 * The vocabulary is identical on purpose: the same unit kinds, the same
 * capability names from the same neutral scan, the same finding shape. That is
 * what the cross-adapter comparison holds to account, and it is the whole reason
 * a second adapter was written before a third.
 *
 * The limits are stated rather than hidden: a component is read, not compiled,
 * so a malformed one is reported as read rather than rejected; Svelte 4 syntax is
 * a finding; and the adapter looks for no routes, which is SvelteKit's job.
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

/** The name of a component, taken from its file. */
function componentName(file: string): string {
  return (
    file
      .split('/')
      .at(-1)
      ?.replace(/\.svelte$/, '') ?? file
  )
}

/**
 * Reads one component.
 *
 * The blocks are found by reading the file. A script tag, a style tag and markup
 * are what a Svelte component is made of, and the adapter only needs to know
 * which of them are present and to have the text for the capability scan.
 */
function readComponent(file: string, text: string): DiscoveredUnit {
  return {
    key: 'default',
    kind: 'component',
    name: componentName(file),
    source: location(file, 1),
    metadata: {
      script: /<script[\s>]/.test(text),
      style: /<style[\s>]/.test(text),
      moduleScript: /<script[^>]*\bcontext\s*=\s*["']module["']/.test(text),
    },
  }
}

/**
 * Reads a module.
 *
 * A store declaration wins the more specific kind, and everything else that is
 * application logic is a utility unit, reported through the same neutral predicate
 * the Vue adapter asks.
 *
 * The constructors are the store API itself, so a declaration is a call to one of
 * them. A module that imports the helpers and declares nothing is not a store
 * module, and it is application logic like any other module.
 */
function readModule(file: string, text: string): DiscoveredUnit | undefined {
  const name = componentName(file.replace(/\.(ts|js|mjs|cjs)$/, ''))
  const line = text
    .split('\n')
    .findIndex((candidate) => /\b(writable|readable|derived)\s*\(/.test(candidate))

  if (line !== -1) {
    return { key: 'default', kind: 'state-module', name, source: location(file, line + 1) }
  }

  // A store declaration wins the more specific kind; everything else that is
  // application logic is a utility unit, asked through the same neutral predicate
  // the Vue adapter asks so the two cannot disagree.
  if (!isApplicationModule(file)) {
    return undefined
  }

  return { key: 'default', kind: 'utility', name, source: location(file, 1) }
}

/** Capability uses in one file, deduplicated per capability and usage. */
function readCapabilities(file: string, text: string): DiscoveredCapability[] {
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

const bySource = (
  left: { readonly source?: SourceLocation; readonly key: string },
  right: { readonly source?: SourceLocation; readonly key: string },
): number => {
  const leftFile = left.source?.file ?? ''
  const rightFile = right.source?.file ?? ''
  const leftLine = left.source?.start?.line ?? 0
  const rightLine = right.source?.start?.line ?? 0

  return (
    leftFile.localeCompare(rightFile) || leftLine - rightLine || left.key.localeCompare(right.key)
  )
}

export function inspect(context: InspectContext): Promise<SourceInspection> {
  const findings: Finding[] = []
  const units: DiscoveredUnit[] = []
  const capabilities: DiscoveredCapability[] = []
  const dependencies: DiscoveredDependency[] = []
  const manifest = readManifest(context, ADAPTER_ID)

  let frameworkVersion: string | undefined

  if (manifest === undefined) {
    findings.push(
      finding(
        'manifest-unreadable',
        'error',
        'No readable manifest',
        'No package.json could be read, so the declared Svelte version and the dependencies are unknown.',
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

    const svelte = declaredRange(manifest, FRAMEWORK)

    if (svelte === undefined) {
      findings.push(
        finding(
          'framework-not-declared',
          'warning',
          'Svelte is not declared',
          `The manifest declares no ${FRAMEWORK} dependency, so no version could be checked.`,
          manifest.source,
        ),
      )
    } else {
      frameworkVersion = svelte.range
      const major = declaredMajor(svelte.range)
      const tested = testedMajors(TESTED_VERSIONS)

      if (major !== undefined && !tested.includes(major)) {
        findings.push(
          finding(
            'version-untested',
            'warning',
            'Untested Svelte version',
            `The project declares ${FRAMEWORK} ${svelte.range}. This adapter was tested against ${TESTED_VERSIONS.join(', ')}, so the major ${major} is not covered and no support is claimed for it.`,
            manifest.source,
            [
              {
                kind: 'manifest',
                value: `${manifest.source.file} ${svelte.field}.${FRAMEWORK} ${svelte.range}`,
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

    let unit: DiscoveredUnit | undefined

    if (file.endsWith('.svelte')) {
      unit = readComponent(file, text)
    } else {
      unit = readModule(file, text)
    }

    if (unit !== undefined) {
      units.push(unit)
    }

    for (const capability of readCapabilities(file, text)) {
      capabilities.push(unit === undefined ? capability : { ...capability, unitKey: unit.key })
    }

    for (const pattern of scanUnmodelled(text)) {
      findings.push(
        finding(pattern.code, 'info', pattern.title, `${file}: ${pattern.message}`, location(file)),
      )
    }
  }

  units.sort(bySource)
  capabilities.sort(bySource)
  dependencies.sort(bySource)
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
    routes: [],
    findings,
  })
}
