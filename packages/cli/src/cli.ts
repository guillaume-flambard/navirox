import { resolve } from 'node:path'
import type { IDoctorDeps } from '@memolabs-apps/doctor'
import type { SemanticJudge } from '@memolabs-apps/planner'
import type { SourceAdapter, SourceAdapterRegistry } from '@memolabs-apps/source'
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
  /** The semantic judge `plan --semantic` uses. Supplied by a test; otherwise built from the environment. */
  readonly planSemantic?: SemanticJudge
  /** Injected transform stages for tests; production uses the default pipeline. */
  readonly transform?: import('./transform.js').TransformDeps
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
  ['@memolabs-apps/source-vue', 'createVueAdapter'],
  ['@memolabs-apps/source-svelte', 'createSvelteAdapter'],
  ['@memolabs-apps/source-sveltekit', 'createSvelteKitAdapter'],
  ['@memolabs-apps/source-nuxt', 'createNuxtAdapter'],
  ['@memolabs-apps/source-angular', 'createAngularAdapter'],
  ['@memolabs-apps/source-react', 'createReactAdapter'],
  ['@memolabs-apps/source-next', 'createNextAdapter'],
  ['@memolabs-apps/source-astro', 'createAstroAdapter'],
  ['@memolabs-apps/source-solid', 'createSolidAdapter'],
  ['@memolabs-apps/source-qwik', 'createQwikAdapter'],
  ['@memolabs-apps/source-lit', 'createLitAdapter'],
  ['@memolabs-apps/source-vanilla', 'createVanillaAdapter'],
]

/** Builds the registry the inspect command uses, from the list above. */
export async function createAdapterRegistry(): Promise<SourceAdapterRegistry> {
  const { SourceAdapterRegistry } = await import('@memolabs-apps/source')
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

  if (parsed.command === 'analyze' || parsed.command === 'inspect') {
    try {
      const { renderFailure, renderReport, reportToJson, runInspection } =
        await import('@memolabs-apps/inspect')
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
        for (const line of renderReport(outcome.report, parsed.command).split('\n')) {
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
      const { runInspection, renderFailure } = await import('@memolabs-apps/inspect')
      const { loadSeedRegistry } = await import('@memolabs-apps/compat')
      const { plan, planToJson, renderPlan } = await import('@memolabs-apps/planner')
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

      if (parsed.semantic) {
        const {
          SEMANTIC_MODEL,
          createTypeSafeJudge,
          renderSemanticSuggestions,
          suggestForUndecided,
        } = await import('@memolabs-apps/planner')
        // The judge is a seam: a test supplies one, the environment supplies the
        // key for the real one. The key never reaches the plan itself.
        const judge = context.planSemantic ?? createTypeSafeJudge()
        const suggestions = await suggestForUndecided(outcome.report.graph, planned, judge)

        if (parsed.json) {
          io.out(
            JSON.stringify(
              { ...planned, semantic: { model: SEMANTIC_MODEL, suggestions } },
              null,
              2,
            ),
          )
        } else {
          for (const line of renderPlan(planned).split('\n')) {
            io.out(line)
          }
          for (const line of renderSemanticSuggestions(suggestions).split('\n')) {
            io.out(line)
          }
        }

        return 0
      }

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
      const { renderFailure, runInspection } = await import('@memolabs-apps/inspect')
      const { loadSeedRegistry } = await import('@memolabs-apps/compat')
      const { plan } = await import('@memolabs-apps/planner')
      const { migrationToJson, parseState, renderMigration, runMigration } =
        await import('@memolabs-apps/migrate')
      const { createProjectFiles } = await import('@memolabs-apps/source')
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

  if (parsed.command === 'convert') {
    try {
      const { renderFailure, runInspection } = await import('@memolabs-apps/inspect')
      const { loadSeedRegistry } = await import('@memolabs-apps/compat')
      const { plan } = await import('@memolabs-apps/planner')
      const { renderMigration, runMigration } = await import('@memolabs-apps/migrate')
      const { createProjectFiles } = await import('@memolabs-apps/source')
      const { runConversion } = await import('./convert.js')
      const { readAngularTemplate, targetFor } = await import('./targets.js')
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

      const graph = outcome.report.graph
      const planned = plan(graph, { compatibility: loadSeedRegistry() })
      const project = createProjectFiles(directory)
      const outRoot = parsed.out === undefined ? directory : resolve(cwd, parsed.out)
      const units = new Map(graph.units.map((unit) => [unit.id, unit]))
      const screens = graph.screens.flatMap((screen) => {
        const unit = units.get(screen.unitId)

        return unit === undefined ? [] : [{ unit: unit.id, file: unit.source.file }]
      })

      // The target follows the source adapter: an Angular screen compiles
      // through the Angular target, every other source through the Vue target.
      const adapterId = outcome.report.source.adapterId
      const target = await targetFor(adapterId)
      const templates = new Map<string, string>()
      const readSource = (path: string): string | undefined => {
        if (adapterId !== 'angular') {
          return project.readText(path)
        }

        // The Angular adapter records only whether a template is inline or
        // external, so the template is read here and cached for the screen.
        const cached = templates.get(path)

        if (cached !== undefined) {
          return cached
        }

        const template = readAngularTemplate(project.readText, path)

        if (template !== undefined) {
          templates.set(path, template)
        }

        return template
      }

      const conversion = runConversion({
        screens,
        outputRoot: outRoot,
        write: parsed.write,
        readText: readSource,
        ...(adapterId === 'angular' ? { readScript: project.readText } : {}),
        target,
      })

      // The units the plan approved move through the same engine migrate uses,
      // so the safe subset is carried exactly as it is everywhere else.
      const migration = runMigration({
        graph,
        plan: planned,
        adapterId: outcome.report.source.adapterId,
        sourceRoot: directory,
        outputRoot: outRoot,
        write: parsed.write,
        readText: project.readText,
      })

      if (parsed.json) {
        io.out(
          JSON.stringify(
            {
              dryRun: conversion.dryRun,
              target: target.id,
              converted: conversion.converted.map((screen) => ({
                unit: screen.unit,
                from: screen.from,
                to: screen.to,
              })),
              refused: conversion.refused,
              moved: migration.moved,
            },
            null,
            2,
          ),
        )
      } else {
        io.out(
          conversion.dryRun
            ? 'Dry run: nothing was written. Add --write to convert.'
            : 'Converted: the screens below were written.',
        )
        io.out('')
        io.out(`Screens converted (${conversion.converted.length})`)

        for (const screen of conversion.converted) {
          io.out(`  ${screen.from} -> ${screen.to}`)
        }

        io.out('')
        io.out(`Screens refused (${conversion.refused.length})`)

        for (const screen of conversion.refused) {
          io.out(`  ${screen.from}`)

          for (const finding of screen.findings) {
            io.out(`      ${finding.code} at ${finding.line}:${finding.column}: ${finding.message}`)
          }
        }

        io.out('')

        for (const line of renderMigration(migration).split('\n')) {
          io.out(line)
        }
      }

      return 0
    } catch (error) {
      return reportFailure(error, io)
    }
  }

  if (parsed.command === 'transform') {
    try {
      const { renderTransform, transform, transformToJson } = await import('./transform.js')
      const outRoot = parsed.out === undefined ? directory : resolve(cwd, parsed.out)
      const result = await transform({
        root: directory,
        ...(parsed.app === undefined ? {} : { app: parsed.app }),
        profile: parsed.profile ?? '',
        output: outRoot,
        write: parsed.write,
        ...(context.transform === undefined ? {} : { deps: context.transform }),
      })

      if (parsed.json) {
        const text = transformToJson(result).trimEnd()

        if (result.ok) {
          io.out(text)
        } else {
          io.err(text)
        }
      } else {
        for (const line of renderTransform(result)) {
          if (result.ok) {
            io.out(line)
          } else {
            io.err(line)
          }
        }
      }

      return result.ok ? 0 : 1
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
        await import('@memolabs-apps/doctor')
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
