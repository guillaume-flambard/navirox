import { parse } from '@vue/compiler-sfc'
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
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import { scanUnmodelled } from './unmodelled.js'

/**
 * Reads a Vue project without judging it.
 *
 * Three limits are deliberate and are reported rather than hidden:
 *
 * - Routes are not extracted. A `views` directory is a convention, not a route
 *   table, so no route node is produced and a finding says why.
 * - Capability use is found by scanning text against a declared pattern set. A
 *   capability used in a way the set does not describe is a miss, never a claim.
 * - A repeated capability becomes one entry per file, capability and usage, at
 *   the line of its first occurrence. The report says what the project touches,
 *   not how many times it touches it.
 *
 * Nothing here throws. A file the parser rejects is a finding, and the rest of
 * the project is still reported, because a partial inspection is useful and a
 * crashed one is not.
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

interface ComponentReading {
  readonly unit?: DiscoveredUnit
  readonly finding?: Finding
}

/**
 * Reads one single file component.
 *
 * The Vue compiler is used for what it is uniquely good at here: deciding that a
 * file is a valid component, and reporting the blocks it declares. The blocks
 * become adapter owned metadata, because "has a script setup block" is a Vue
 * fact and the App Graph is not allowed to know any.
 */
function readComponent(file: string, text: string): ComponentReading {
  const { descriptor, errors } = parse(text, { filename: file })

  if (errors.length > 0) {
    const first = errors[0]
    const detail = typeof first === 'string' ? first : (first?.message ?? 'unknown parse error')

    return {
      finding: finding(
        'sfc-parse-failed',
        'error',
        'A component could not be parsed',
        `${file} is not a component the Vue compiler accepts: ${detail}`,
        location(file),
      ),
    }
  }

  const unit: DiscoveredUnit = {
    key: 'default',
    kind: 'component',
    name:
      file
        .split('/')
        .at(-1)
        ?.replace(/\.vue$/, '') ?? file,
    source: location(file, 1),
    metadata: {
      script: descriptor.script !== null,
      scriptSetup: descriptor.scriptSetup !== null,
      template: descriptor.template !== null,
      styles: descriptor.styles.length,
    },
  }

  return { unit }
}

/**
 * Reads a module for a store declaration.
 *
 * The test is a declaration, not an import: importing the state library is not
 * declaring a store, and reporting every module that imports it would make the
 * state module count meaningless.
 */
function readModule(file: string, text: string): DiscoveredUnit | undefined {
  const name =
    file
      .split('/')
      .at(-1)
      ?.replace(/\.(ts|js|tsx|jsx|mjs|cjs)$/, '') ?? file
  const line = text.split('\n').findIndex((candidate) => /\bdefineStore\s*\(/.test(candidate))

  if (line !== -1) {
    return { key: 'default', kind: 'state-module', name, source: location(file, line + 1) }
  }

  // A store declaration wins the more specific kind. Everything else that is
  // application logic is a utility unit: reporting only the stores left the largest
  // body of code a migration can keep unchanged invisible, because the engine copies
  // what the plan calls shared and nothing was ever called shared.
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

/**
 * Inspects a project.
 *
 * The order of every collection is fixed here rather than left to the file walk,
 * because two inspections of an unchanged project have to produce the same
 * report and the surrounding pipeline is not going to re-sort anything.
 */
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
        'No package.json could be read, so the declared Vue version and the dependencies are unknown.',
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

    const vue = declaredRange(manifest, FRAMEWORK)

    if (vue === undefined) {
      findings.push(
        finding(
          'framework-not-declared',
          'warning',
          'Vue is not declared',
          `The manifest declares no ${FRAMEWORK} dependency, so no version could be checked.`,
          manifest.source,
        ),
      )
    } else {
      frameworkVersion = vue.range
      const major = declaredMajor(vue.range)
      const tested = testedMajors(TESTED_VERSIONS)

      if (major !== undefined && !tested.includes(major)) {
        findings.push(
          finding(
            'version-untested',
            'warning',
            'Untested Vue version',
            `The project declares ${FRAMEWORK} ${vue.range}. This adapter was tested against ${TESTED_VERSIONS.join(', ')}, so the major ${major} is not covered and no support is claimed for it.`,
            manifest.source,
            [
              {
                kind: 'manifest',
                value: `${manifest.source.file} ${vue.field}.${FRAMEWORK} ${vue.range}`,
              },
            ],
          ),
        )
      }
    }

    if (declaredRange(manifest, 'vue-router') !== undefined) {
      findings.push(
        finding(
          'router-not-extracted',
          'warning',
          'Routes were not extracted',
          'The project declares vue-router. This adapter does not read a router module, so no route node was produced and route extent is unknown.',
          manifest.source,
          [{ kind: 'manifest', value: `${manifest.source.file} dependencies.vue-router` }],
        ),
      )
    }
  }

  for (const file of context.files.filter(isSourceFile)) {
    const text = context.readText(file)

    if (text === undefined) {
      continue
    }

    let unit: DiscoveredUnit | undefined

    if (file.endsWith('.vue')) {
      const reading = readComponent(file, text)

      if (reading.finding !== undefined) {
        findings.push(reading.finding)
      }

      unit = reading.unit
    } else {
      unit = readModule(file, text)
    }

    if (unit !== undefined) {
      units.push(unit)
    }

    if (!file.endsWith('.vue') && !isApplicationModule(file)) {
      continue
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
