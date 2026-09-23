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
