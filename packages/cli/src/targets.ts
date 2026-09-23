import { posix } from 'node:path'
import type { ConvertTarget } from './convert.js'

/**
 * The target a conversion runs through, chosen from the source adapter.
 *
 * A target provider is reached only through this module, so the conversion
 * itself never imports one. Angular compiles an Angular template; every other
 * source compiles a Vue single-file component.
 */

export async function targetFor(adapterId: string): Promise<ConvertTarget> {
  if (adapterId === 'angular') {
    const { compileAngularComponent, compileAngularTarget, serializeProvenanceManifest } =
      await import('@memolabs-apps/target-angular')

    return {
      id: 'angular',
      compile: (input, filename, outputPath) => {
        const result =
          input.script === undefined
            ? compileAngularTarget(input.source, filename, outputPath)
            : compileAngularComponent({
                template: input.source,
                script: input.script,
                filename,
                ...(outputPath === undefined ? {} : { outputPath }),
                ...(input.injectables === undefined ? {} : { injectables: input.injectables }),
              })

        return {
          findings: result.report.findings,
          ...(result.code === undefined ? {} : { code: result.code }),
          manifest: serializeProvenanceManifest(result.manifest),
        }
      },
    }
  }

  const { compileVueTarget, serializeProvenanceManifest } =
    await import('@memolabs-apps/target-vue')

  return {
    id: 'vue',
    compile: (input, filename, outputPath) => {
      const result = compileVueTarget(input.source, filename, outputPath)

      return {
        findings: result.report.findings,
        ...(result.code === undefined ? {} : { code: result.code }),
        manifest: serializeProvenanceManifest(result.manifest),
      }
    },
  }
}

const INLINE_TEMPLATE = /template\s*:\s*(`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/
const EXTERNAL_TEMPLATE = /templateUrl\s*:\s*['"]([^'"]+)['"]/

/**
 * The template an Angular component declares, inline or in the file it names.
 *
 * The Angular source adapter records only whether a template is inline or
 * external, so the convert command reads it here. A template that cannot be read
 * returns undefined, and the screen is refused rather than compiled from the
 * component source.
 */
export function readAngularTemplate(
  readText: (path: string) => string | undefined,
  file: string,
): string | undefined {
  const source = readText(file)

  if (source === undefined) {
    return undefined
  }

  const inline = INLINE_TEMPLATE.exec(source)

  if (inline?.[1] !== undefined) {
    return inline[1].slice(1, -1)
  }

  const external = EXTERNAL_TEMPLATE.exec(source)

  if (external?.[1] === undefined) {
    return undefined
  }

  const directory = posix.dirname(file)
  const templatePath = posix.normalize(
    directory === '.' ? external[1] : posix.join(directory, external[1]),
  )

  return readText(templatePath)
}

const BOUNDED_INJECT_FIELD =
  /^[ \t]*(?:readonly[ \t]+)?([A-Za-z_$][\w$]*)[ \t]*(?::[^=\n]+)?=[ \t]*inject[ \t]*\([ \t]*([A-Za-z_$][\w$]*)[ \t]*\)[ \t]*;?/gm

/**
 * Sources for each `name = inject(Type)` the component declares, keyed by `Type`.
 *
 * Only relative import specifiers already on disk are resolved (base, `.ts`,
 * `.js`). A missing or non-relative module stays out of the map so the target
 * refuses with an injectable-source finding instead of inventing a service.
 */
export function readAngularInjectables(
  readText: (path: string) => string | undefined,
  file: string,
  script: string,
): Readonly<Record<string, string>> {
  const types = new Set<string>()

  for (const match of script.matchAll(BOUNDED_INJECT_FIELD)) {
    const type = match[2]

    if (type !== undefined) types.add(type)
  }

  if (types.size === 0) return {}

  const directory = posix.dirname(file)
  const injectables: Record<string, string> = {}

  for (const type of types) {
    const imported = new RegExp(
      `import\\s*(?:type\\s+)?\\{[^}]*\\b${type}\\b[^}]*\\}\\s*from\\s*['"]([^'"]+)['"]`,
    ).exec(script)
    const specifier = imported?.[1]

    if (specifier === undefined || !specifier.startsWith('.')) continue

    const base = posix.normalize(directory === '.' ? specifier : posix.join(directory, specifier))

    for (const candidate of [base, `${base}.ts`, `${base}.js`]) {
      const source = readText(candidate)

      if (source !== undefined) {
        injectables[type] = source
        break
      }
    }
  }

  return injectables
}
