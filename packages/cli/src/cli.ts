import { resolve } from 'node:path'
import type { IDoctorDeps } from '@navirox/doctor'
import type { SourceAdapter, SourceAdapterRegistry } from '@navirox/source'
import { parseArguments, HELP } from './args.js'
import { createDevContext, runDev, type IDevContext } from './dev.js'
import type { IDevIo } from './runner.js'

/**
 * The command as a function, so the process is only touched in `bin.ts`.
 *
 * Everything here returns an exit code instead of calling `process.exit`, which
 * is what lets the tests assert on output and codes without a subprocess.
 */

/**
 * The writer the command prints through. It is the same shape the dev server
 * orchestration uses, so there is one way to capture output rather than two.
 */
export type ICliIo = IDevIo

/**
 * What a command needs from the world, per command.
 *
 * Both members are optional and the real ones are built on demand, so running
 * `navirox doctor` neither starts nor needs anything the dev server owns, and a
 * test supplies only the half it is exercising.
 */
export interface ICliContext {
  readonly dev?: IDevContext
  readonly doctor?: IDoctorDeps
  /** The adapter registry, supplied by a test or composed on demand. */
  readonly inspect?: { readonly registry: SourceAdapterRegistry }
}

/**
 * The source adapters this tool knows about.
 *
 * This is the composition root, and it is the one place that names an adapter
 * package. A new adapter is a line here and nothing else: the inspection
 * pipeline selects from the registry it is handed, so it never learns what a
 * framework is. Registration order does not matter, because selection prefers
 * the adapter that composes another rather than the one registered first. The
 * packages are imported lazily so a command that does not inspect a project pays
 * for nothing.
 */
const SOURCE_ADAPTER_PACKAGES: readonly (readonly [string, string])[] = [
  ['@navirox/source-vue', 'createVueAdapter'],
  ['@navirox/source-svelte', 'createSvelteAdapter'],
  ['@navirox/source-sveltekit', 'createSvelteKitAdapter'],
  ['@navirox/source-nuxt', 'createNuxtAdapter'],
  ['@navirox/source-angular', 'createAngularAdapter'],
  ['@navirox/source-react', 'createReactAdapter'],
  ['@navirox/source-next', 'createNextAdapter'],
  ['@navirox/source-astro', 'createAstroAdapter'],
  ['@navirox/source-solid', 'createSolidAdapter'],
  ['@navirox/source-qwik', 'createQwikAdapter'],
]

/** Builds the registry the inspect command uses, from the list above. */
export async function createAdapterRegistry(): Promise<SourceAdapterRegistry> {
  const { SourceAdapterRegistry } = await import('@navirox/source')
  const registry = new SourceAdapterRegistry()

  for (const [packageName, factoryName] of SOURCE_ADAPTER_PACKAGES) {
    const loaded = (await import(packageName)) as Record<string, unknown>
    const factory = loaded[factoryName]

    if (typeof factory !== 'function') {
      throw new Error(`${packageName} does not export ${factoryName}.`)
    }

    registry.register((factory as () => SourceAdapter)())
  }

  return registry
}

export async function runCli(
  argv: readonly string[],
  io: ICliIo,
  cwd: string = process.cwd(),
  context: ICliContext = {},
): Promise<number> {
  let parsed
  try {
    parsed = parseArguments(argv)
  } catch (error) {
    return reportFailure(error, io)
  }

  if (parsed.help) {
    io.out(HELP)
    return 0
  }

  const directory = parsed.directory === undefined ? cwd : resolve(cwd, parsed.directory)

  if (parsed.command === 'inspect') {
    try {
      const { renderFailure, renderReport, reportToJson, runInspection } =
        await import('@navirox/inspect')
      const registry = context.inspect?.registry ?? (await createAdapterRegistry())
      const outcome = await runInspection({
        rootDir: directory,
        registry,
        ...(parsed.framework === undefined ? {} : { framework: parsed.framework }),
      })

      if (!outcome.ok) {
        io.err(renderFailure(outcome, parsed.json))
        return 1
      }

      if (parsed.json) {
        io.out(reportToJson(outcome.report))
      } else {
        for (const line of renderReport(outcome.report).split('\n')) {
          io.out(line)
        }
      }

      return 0
    } catch (error) {
      return reportFailure(error, io)
    }
  }

  if (parsed.command === 'plan') {
    try {
      const { runInspection, renderFailure } = await import('@navirox/inspect')
      const { loadSeedRegistry } = await import('@navirox/compat')
      const { plan, planToJson, renderPlan } = await import('@navirox/planner')
      const registry = context.inspect?.registry ?? (await createAdapterRegistry())
      const outcome = await runInspection({
        rootDir: directory,
        registry,
        ...(parsed.framework === undefined ? {} : { framework: parsed.framework }),
      })

      if (!outcome.ok) {
        io.err(renderFailure(outcome, parsed.json))
        return 1
      }

      // The registry is loaded here rather than inside the planner, which reads
      // only the graph and the inputs it is handed.
      const planned = plan(outcome.report.graph, { compatibility: loadSeedRegistry() })

      if (parsed.json) {
        io.out(planToJson(planned))
      } else {
        for (const line of renderPlan(planned).split('\n')) {
          io.out(line)
        }
      }

      return 0
    } catch (error) {
      return reportFailure(error, io)
    }
  }

  if (parsed.command === 'migrate') {
    try {
      const { renderFailure, runInspection } = await import('@navirox/inspect')
      const { loadSeedRegistry } = await import('@navirox/compat')
      const { plan } = await import('@navirox/planner')
      const { migrationToJson, parseState, renderMigration, runMigration } =
        await import('@navirox/migrate')
      const { createProjectFiles } = await import('@navirox/source')
      const { readFileSync } = await import('node:fs')
      const { join } = await import('node:path')
      const registry = context.inspect?.registry ?? (await createAdapterRegistry())
      const outcome = await runInspection({
        rootDir: directory,
        registry,
        ...(parsed.framework === undefined ? {} : { framework: parsed.framework }),
      })

      if (!outcome.ok) {
        io.err(renderFailure(outcome, parsed.json))
        return 1
      }

      const planned = plan(outcome.report.graph, { compatibility: loadSeedRegistry() })
      const project = createProjectFiles(directory)
      const outRoot = parsed.out === undefined ? directory : resolve(cwd, parsed.out)

      // An existing record is read rather than assumed absent, and a record this
      // tool cannot read stops the run instead of being overwritten.
      const statePath = join(outRoot, '.navirox', 'migration.json')
      const state =
        parsed.out === undefined
          ? undefined
          : (() => {
              try {
                return parseState(readFileSync(statePath, 'utf8'))
              } catch {
                return undefined
              }
            })()

      const report = runMigration({
        graph: outcome.report.graph,
        plan: planned,
        adapterId: outcome.report.source.adapterId,
        sourceRoot: directory,
        outputRoot: outRoot,
        write: parsed.write,
        readText: project.readText,
        ...(state === undefined ? {} : { state }),
      })

      if (parsed.json) {
        io.out(migrationToJson(report))
      } else {
        for (const line of renderMigration(report).split('\n')) {
          io.out(line)
        }
      }

      return 0
    } catch (error) {
      return reportFailure(error, io)
    }
  }

  if (parsed.command === 'doctor') {
    try {
      // Imported here rather than at the top so the report pays for nothing the
      // dev server needs, which is what keeps `navirox doctor` quick on a machine
      // where something is already wrong.
      const { createDoctorDeps, exitCodeFor, renderReport, reportToJson, runDoctor } =
        await import('@navirox/doctor')
      const report = runDoctor(
        { directory, platform: parsed.platform },
        context.doctor ?? createDoctorDeps(),
      )

      if (parsed.json) {
        io.out(reportToJson(report).trimEnd())
      } else {
        for (const line of renderReport(report).split('\n')) {
          io.out(line)
        }
      }

      return exitCodeFor(report)
    } catch (error) {
      return reportFailure(error, io)
    }
  }

  try {
    return await runDev(
      {
        cwd,
        directory: parsed.directory,
        platform: parsed.platform,
        port: parsed.port,
        json: parsed.json,
        skipPreflight: parsed.skipPreflight,
      },
      io,
      context.dev ?? createDevContext(),
    )
  } catch (error) {
    return reportFailure(error, io)
  }
}

/**
 * One failure path for everything, so a caller using `--json` never has to parse
 * prose and a person never has to read JSON.
 */
function reportFailure(error: unknown, io: ICliIo): number {
  const name = error instanceof Error ? error.name : 'Error'
  const message = error instanceof Error ? error.message : String(error)

  if (name === 'UsageError') {
    io.err(message)
    io.err('Run navirox --help to see how this command is called.')
  } else {
    io.err(message)
  }

  return 1
}
