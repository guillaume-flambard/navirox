import type { AppGraphFragment } from '@navirox/graph'
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
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS } from './detect.js'
import { readRoutes, readUnits, readUnmodelled } from './conventions.js'

/**
 * Inspects by composing.
 *
 * The Vue adapter reads the components, the stores, the capability use and the
 * manifest. This adapter adds what Nuxt adds, and it adds nothing else: a second
 * reading of the Vue half would be a second answer to a question that already has
 * one.
 */

/**
 * The versions this adapter was tested against, checked against the manifest.
 *
 * The base adapter checks Vue's range, which is not this adapter's claim. A Nuxt
 * project can declare a major this adapter has never read, and that has to be a
 * finding rather than a silence.
 */
function nuxtRange(context: InspectContext): string | undefined {
  const manifest = readManifest(context, ADAPTER_ID)

  return manifest === undefined ? undefined : declaredRange(manifest, FRAMEWORK)?.range
}

function versionFinding(context: InspectContext): SourceInspection['findings'] {
  const manifest = readManifest(context, ADAPTER_ID)

  if (manifest === undefined) {
    return []
  }

  const declared = declaredRange(manifest, FRAMEWORK)

  if (declared === undefined) {
    return []
  }

  const major = declaredMajor(declared.range)

  if (major === undefined || testedMajors(TESTED_VERSIONS).includes(major)) {
    return []
  }

  return [
    {
      id: findingId({ adapterId: ADAPTER_ID, code: 'version-untested', key: manifest.source.file }),
      code: 'version-untested',
      severity: 'warning',
      title: 'Untested Nuxt version',
      message: `The project declares ${FRAMEWORK} ${declared.range}. This adapter was tested against ${TESTED_VERSIONS.join(', ')}, so the major ${major} is not covered and no support is claimed for it.`,
      evidence: [
        {
          kind: 'manifest',
          value: `${manifest.source.file} ${declared.field}.${FRAMEWORK} ${declared.range}`,
        },
      ],
      source: manifest.source,
    },
  ]
}

export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const base = await createVueAdapter().inspect(context)

  // Nuxt provides Vue, so a project that declares Nuxt and not Vue is normal and
  // the base adapter's "Vue is not declared" warning would be a false statement
  // about the project. Nuxt's own version check replaces it.
  const inherited = base.findings.filter((finding) => finding.code !== 'framework-not-declared')

  const outsideRuntime = readUnmodelled(context.files)
  // The base adapter reports plain modules as application logic, and these are not:
  // they run in a different runtime, which is exactly what the findings below say.
  // Leaving them in would have the same run call a file both unmodelled and portable.
  const outsideRuntimeFiles = new Set(outsideRuntime.map((entry) => entry.file))

  const unmodelled = outsideRuntime.map((entry) => ({
    id: findingId({ adapterId: ADAPTER_ID, code: entry.code, key: entry.file }),
    code: entry.code,
    severity: 'info' as const,
    title:
      entry.code === 'nuxt-runtime-config'
        ? 'The runtime configuration is not read'
        : 'Code outside the browser runtime',
    message:
      entry.code === 'nuxt-runtime-config'
        ? `${entry.file} configures the runtime this adapter reads nothing from.`
        : `${entry.file} is ${entry.what}. It runs in a different runtime, and this adapter does not model it.`,
    evidence: [{ kind: 'source' as const, value: entry.file }],
    source: { file: entry.file, adapterId: ADAPTER_ID },
  }))

  // The base descriptor names the range of the framework the base adapter read,
  // which is Vue. This adapter's claim is Nuxt's range, so the field is replaced
  // rather than inherited: reporting one framework's version under another's name
  // is exactly the kind of quiet untruth the report exists to avoid.
  const range = nuxtRange(context)

  return {
    descriptor: {
      adapterId: ADAPTER_ID,
      displayName: DISPLAY_NAME,
      ...(range === undefined ? {} : { frameworkVersion: range }),
    },
    units: [
      ...base.units.filter((unit) => !outsideRuntimeFiles.has(unit.source.file)),
      ...readUnits(context.files),
    ].sort((left, right) => left.source.file.localeCompare(right.source.file)),
    capabilities: base.capabilities,
    dependencies: base.dependencies,
    routes: readRoutes(context.files),
    findings: [...inherited, ...versionFinding(context), ...unmodelled].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
  }
}

/**
 * The reading, mapped to graph nodes by the neutral mapper.
 *
 * Every identifier carries this adapter's id, because this adapter is what
 * produced the fragment, including for the components the Vue adapter read.
 */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
