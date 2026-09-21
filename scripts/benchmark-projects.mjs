#!/usr/bin/env node
/**
 * Exercises Navirox against immutable public repository snapshots.
 *
 * This deliberately does not install, build, or execute the benchmarked
 * applications. The source adapters only need their checked-out files. The
 * package-install guarantee remains the responsibility of e2e-scaffold.mjs,
 * which packs and installs Navirox as a consumer would.
 *
 * A project that declares a target diagnostic compiles a bounded sample of its
 * analyzed screens with the target compiler and reports a count by blocker
 * code. The diagnostic never emits a native file and makes no claim that the
 * benchmarked application was migrated.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const launcher = join(root, 'packages', 'navirox', 'dist', 'bin.js')
const catalog = JSON.parse(readFileSync(join(root, 'benchmarks', 'catalog.json'), 'utf8'))

function fail(message) {
  throw new Error(message)
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 })
  if (result.error !== undefined) fail(`Could not run ${command}: ${result.error.message}`)
  if (result.status !== 0)
    fail(`${command} ${args.join(' ')} exited ${result.status}.\n${result.stderr}`)
  return result.stdout
}

function parseArguments(argv) {
  let project
  let keep = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--') continue
    if (argument === '--project') project = argv[++index]
    else if (argument === '--keep') keep = true
    else fail(`Unknown argument ${argument}. Use --project <id> or --keep.`)
  }
  return { project, keep }
}

function checkout(reference, directory, label) {
  run('git', ['init', '--quiet', directory], root)
  run('git', ['remote', 'add', 'origin', reference.repository], directory)
  run('git', ['fetch', '--depth', '1', 'origin', reference.commit, '--quiet'], directory)
  run('git', ['checkout', '--detach', '--quiet', 'FETCH_HEAD'], directory)
  const actual = run('git', ['rev-parse', 'HEAD'], directory).trim()
  if (actual !== reference.commit)
    fail(`${label} resolved ${actual}, expected immutable commit ${reference.commit}.`)
}

function analyze(project, checkoutDirectory) {
  const source = join(checkoutDirectory, project.sourceDirectory)
  if (!existsSync(source))
    fail(`${project.id} has no source directory ${project.sourceDirectory} at ${project.commit}.`)
  const analyzeReport = JSON.parse(
    run(process.execPath, [launcher, 'analyze', source, '--json'], root),
  )
  const planReport = JSON.parse(
    run(process.execPath, [launcher, 'plan', '-C', source, '--json'], root),
  )

  if (analyzeReport.source.adapterId !== project.adapterId)
    fail(`${project.id} detected ${analyzeReport.source.adapterId}, expected ${project.adapterId}.`)
  if (planReport.source.adapterId !== project.adapterId)
    fail(
      `${project.id} plan detected ${planReport.source.adapterId}, expected ${project.adapterId}.`,
    )
  if (analyzeReport.summary.routes < project.minimumRoutes)
    fail(
      `${project.id} reported ${analyzeReport.summary.routes} routes, expected at least ${project.minimumRoutes}.`,
    )
  if (analyzeReport.summary.screens < project.minimumScreens)
    fail(
      `${project.id} reported ${analyzeReport.summary.screens} screens, expected at least ${project.minimumScreens}.`,
    )
  if (project.minimumUnits !== undefined && analyzeReport.summary.units < project.minimumUnits)
    fail(
      `${project.id} reported ${analyzeReport.summary.units} units, expected at least ${project.minimumUnits}.`,
    )

  return analyzeReport
}

function verifyMobileReference(project, analyzeReport, workspace) {
  const reference = project.mobileReference
  if (reference === undefined) return 0
  if (!Array.isArray(reference.workflows) || reference.workflows.length === 0)
    fail(`${project.id} has a mobile reference without workflows.`)

  const mobileDirectory = join(workspace, `${project.id}-mobile-reference`)
  checkout(reference, mobileDirectory, `${project.id} mobile reference`)
  const mobileSource = join(mobileDirectory, reference.sourceDirectory)
  if (!existsSync(mobileSource))
    fail(`${project.id} mobile reference has no source directory ${reference.sourceDirectory}.`)

  const seen = new Set()
  for (const workflow of reference.workflows) {
    if (
      typeof workflow.id !== 'string' ||
      typeof workflow.webRoute !== 'string' ||
      typeof workflow.webFile !== 'string' ||
      typeof workflow.mobileFile !== 'string'
    )
      fail(`${project.id} has an invalid mobile-reference workflow.`)
    if (seen.has(workflow.id)) fail(`${project.id} duplicates workflow ${workflow.id}.`)
    seen.add(workflow.id)

    const route = analyzeReport.graph.routes.find(
      (candidate) =>
        candidate.pathPattern === workflow.webRoute && candidate.source.file === workflow.webFile,
    )
    if (route === undefined)
      fail(
        `${project.id} no longer detects ${workflow.webRoute} from ${workflow.webFile} for ${workflow.id}.`,
      )
    if (!existsSync(join(mobileSource, workflow.mobileFile)))
      fail(
        `${project.id} mobile reference has no ${workflow.mobileFile} for ${workflow.id} at ${reference.commit}.`,
      )
  }
  return reference.workflows.length
}

async function diagnoseTarget(project, analyzeReport, directory) {
  const diagnostic = project.targetDiagnostic
  if (diagnostic === undefined) return undefined

  const packageDirectory = diagnostic.package.replace('@memolabs-apps/', '')
  const entry = join(root, 'packages', packageDirectory, 'dist', 'index.js')
  if (!existsSync(entry)) fail(`${entry} is missing. Run pnpm build before the benchmark.`)

  const { compileVueTarget } = await import(pathToFileURL(entry).href)
  const sourceDirectory = join(directory, project.sourceDirectory)

  const screenSources = analyzeReport.graph.screens
  const candidates = screenSources === undefined ? analyzeReport.graph.routes : screenSources
  const available = []
  const seen = new Set()
  for (const entry of candidates) {
    const file = entry.source === undefined ? undefined : entry.source.file
    if (typeof file !== 'string' || seen.has(file)) continue
    seen.add(file)
    available.push(file)
  }
  available.sort()

  const attempted = available.slice(0, diagnostic.maximumDocuments)
  const counts = new Map()
  const documents = []
  const findings = []
  let compilerVersion
  let fullySupported = 0

  for (const file of attempted) {
    const absolute = join(sourceDirectory, file)
    if (!existsSync(absolute)) {
      documents.push({ path: file, present: false, findings: 0 })
      continue
    }
    const output = compileVueTarget(readFileSync(absolute, 'utf8'), file)
    compilerVersion ??= output.manifest.compilerVersion
    if (output.code !== undefined) fullySupported += 1
    for (const entry of output.report.findings) {
      counts.set(entry.code, (counts.get(entry.code) ?? 0) + 1)
      findings.push({
        path: file,
        code: entry.code,
        line: entry.line,
        column: entry.column,
        message: entry.message,
      })
    }
    documents.push({ path: file, present: true, findings: output.report.findings.length })
  }

  const report = {
    project: project.id,
    revision: project.commit,
    adapterId: project.adapterId,
    sourceDirectory: project.sourceDirectory,
    compilerVersion,
    targetPackage: diagnostic.package,
    attempts: {
      available: available.length,
      limit: diagnostic.maximumDocuments,
      compiled: attempted.filter((file) =>
        documents.some((document) => document.path === file && document.present),
      ).length,
    },
    countsByCode: Object.fromEntries([...counts].sort()),
    fullySupported,
    documents,
    findings,
    notes: [
      'This is a diagnostic. A screen counts as fully supported only when the target compiler returned native code for it, and no file was written for any screen, so the repository was not modified.',
      'No conversion, partnership or visual-parity claim is made for this repository.',
      `Only ${attempted.length} of ${available.length} analyzed screens were attempted.`,
    ],
  }

  const evidencePath = join(root, diagnostic.evidencePath)
  mkdirSync(dirname(evidencePath), { recursive: true })
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`)
  process.stdout.write(`Wrote the target diagnostic to ${diagnostic.evidencePath}\n`)

  return {
    documents: attempted.length,
    findings: findings.length,
    codes: [...counts]
      .sort()
      .map(([code, count]) => `${code} ${count}`)
      .join(', '),
  }
}

const options = parseArguments(process.argv.slice(2))
const projects = catalog.projects.filter(
  (project) => options.project === undefined || project.id === options.project,
)
if (projects.length === 0) fail(`No benchmark profile matches ${options.project}.`)
if (!existsSync(launcher)) fail(`${launcher} is missing. Run pnpm build before the benchmark.`)

const workspace = mkdtempSync(join(tmpdir(), 'navirox-benchmark-'))
try {
  for (const project of projects) {
    const directory = join(workspace, project.id)
    checkout(project, directory, project.id)
    const analyzeReport = analyze(project, directory)
    const workflows = verifyMobileReference(project, analyzeReport, workspace)
    process.stdout.write(
      `${project.id}: ${project.adapterId}, ${analyzeReport.summary.routes} routes, ${analyzeReport.summary.screens} screens${workflows === 0 ? '' : `, ${workflows} mobile workflow references`}\n`,
    )
    const diagnostic = await diagnoseTarget(project, analyzeReport, directory)
    if (diagnostic !== undefined)
      process.stdout.write(
        `${project.id}: target diagnostic, ${diagnostic.documents} screens compiled, ${diagnostic.findings} findings (${diagnostic.codes}), no file written\n`,
      )
  }
} finally {
  if (options.keep) process.stdout.write(`Kept benchmark workspace at ${workspace}\n`)
  else rmSync(workspace, { recursive: true, force: true })
}
