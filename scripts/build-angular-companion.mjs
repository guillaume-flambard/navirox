#!/usr/bin/env node
/**
 * Assembles the Angular proof companion.
 *
 * The Angular journey has no target compiler, so nothing here is generated from
 * Angular templates. The companion consumes the neutral model the planner
 * approved: the module it classified as shared by `unit-shared-logic` is copied
 * byte for byte beside a hand-written screen, and the provenance record says so.
 * Running this command is what makes the seam claim checkable, because it reads
 * the fixture with the real adapter and planner and asserts the decisions it
 * depends on before it builds anything.
 *
 * Usage: node scripts/build-angular-companion.mjs [--keep]
 *
 * Exits 0 when the companion is assembled, both bundles carry the declared
 * identifiers and the provenance record is written. `--keep` leaves the
 * prepared application for inspection.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  ANGULAR_COMPANION_FIXTURE,
  BENCHMARK,
  ROOT,
  analyzeFixture,
  assert,
  assertSingleRuntime,
  assertTestIds,
  bundle,
  consumeFromArtifacts,
  decisionFor,
  install,
  newWorkspace,
  pack,
  planFixture,
  publishablePackages,
  removeWorkspace,
  requireBuild,
  scaffold,
  sha256,
  step,
} from './lib/fixture-app.mjs'

const PROVENANCE_PATH = join(ROOT, 'docs', 'evidence', 'angular-companion.provenance.json')
const SHARED_MODULE = 'record-workflow.data.ts'
const SHARED_SOURCE = join(ANGULAR_COMPANION_FIXTURE.directory, 'src', 'app', SHARED_MODULE)
const SHARED_SOURCE_PATH = `packages/source-angular/fixtures/record-workflow/src/app/${SHARED_MODULE}`
const FIXTURE_PATH = 'packages/source-angular/fixtures/record-workflow'

/**
 * The decisions the assembly depends on. They are named here rather than
 * derived, so a reclassification is a loud failure instead of a companion that
 * silently copied something else.
 */
const DECISIONS = [
  {
    subject: 'angular:src/app/record-workflow.data.ts:utility:default',
    classification: 'shared',
    rule: 'unit-shared-logic',
  },
  {
    subject: 'angular:src/app/record-workflow.component.ts:component:default',
    classification: 'native-replacement',
    rule: 'unit-view-layer',
  },
  {
    subject: 'angular:src/app/record-workflow.component.ts:capability:file-reading:read',
    classification: 'manual',
    rule: 'capability-no-counterpart',
  },
]

function parseArguments(argv) {
  for (const argument of argv) {
    if (argument !== '--keep') {
      throw new Error(`Unknown argument ${argument}.`)
    }
  }

  return { keep: argv.includes('--keep') }
}

function assertAnalyzed(analysis) {
  const adapterId = analysis.source?.adapterId

  assert(
    adapterId === 'angular',
    `The adapter read this fixture as ${adapterId ?? 'nothing'}, so it is not the Angular proof fixture.`,
  )

  const findings = Object.values(analysis.summary?.findings ?? {}).reduce(
    (total, count) => total + count,
    0,
  )

  assert(findings === 0, `The fixture no longer reads cleanly: ${findings} findings.`)

  process.stdout.write(
    `   ${analysis.summary.files} files, ${analysis.summary.units} units, ${analysis.summary.capabilities} capabilities, 0 findings\n`,
  )
  process.stdout.write(
    '   No target compiler exists for this journey, so the screen is hand-written work.\n',
  )
}

function assertPlan(plan) {
  for (const expected of DECISIONS) {
    const decision = decisionFor(plan, expected.subject)

    assert(
      decision.classification === expected.classification,
      `${expected.subject} is ${decision.classification}, but the assembly depends on ${expected.classification}.`,
    )
    assert(
      decision.reasons?.[0]?.ruleId === expected.rule,
      `${expected.subject} was decided by ${decision.reasons?.[0]?.ruleId ?? 'no rule'}, but the assembly depends on ${expected.rule}.`,
    )

    process.stdout.write(`   ${expected.subject} -> ${decision.classification}\n`)
  }
}

function copySharedModule(appDirectory) {
  const source = readFileSync(SHARED_SOURCE, 'utf8')
  const target = join(appDirectory, SHARED_MODULE)

  writeFileSync(target, source, 'utf8')
  assert(
    readFileSync(target, 'utf8') === source,
    `${SHARED_MODULE} did not arrive unchanged, so the move is not the one the planner approved.`,
  )

  process.stdout.write(`   moved ${SHARED_MODULE} (shared)\n`)

  return sha256(source)
}

function installScreen(appDirectory) {
  const screen = readFileSync(ANGULAR_COMPANION_FIXTURE.screen, 'utf8')

  writeFileSync(join(appDirectory, 'App.vue'), screen, 'utf8')
  process.stdout.write('   wrote the hand-written screen as the app root\n')
}

async function main() {
  const options = parseArguments(process.argv.slice(2))

  requireBuild()

  const { buildCompanionProvenance, serializeCompanionProvenance } = await import(
    pathToFileURL(BENCHMARK).href
  )

  step('Reading the fixture with the source adapter')
  assertAnalyzed(analyzeFixture(ANGULAR_COMPANION_FIXTURE))

  step('Asking the planner which units may move')
  assertPlan(planFixture(ANGULAR_COMPANION_FIXTURE))

  step(`Assembling the companion for "${ANGULAR_COMPANION_FIXTURE.appName}"`)

  const { workspace, artifactsDir } = newWorkspace('navirox-angular-companion-')
  const appDirectory = scaffold(join(workspace, 'app'), ANGULAR_COMPANION_FIXTURE.appName)

  try {
    step('Copying the unit the planner approved')
    const sharedHash = copySharedModule(appDirectory)

    step('Installing the hand-written screen')
    installScreen(appDirectory)

    step('Writing the provenance record')
    const provenance = buildCompanionProvenance({
      fixture: FIXTURE_PATH,
      compilerVersion: 'none',
      manifestHash: 'none',
      screen: 'App.vue',
      files: [
        {
          path: SHARED_MODULE,
          origin: 'moved',
          reason:
            'The planner classified it shared by unit-shared-logic, so its behaviour moves unchanged.',
          decision: 'shared',
          sourcePath: SHARED_SOURCE_PATH,
          sha256: sharedHash,
        },
        {
          path: 'App.vue',
          origin: 'manual',
          reason:
            'The Angular journey has no target compiler, so this screen is hand-written for this project and is not generated from Angular templates.',
        },
        {
          path: 'index.js',
          origin: 'manual',
          reason: 'The scaffolder template writes the runtime bootstrap and mounts the app root.',
        },
      ],
    })

    writeFileSync(PROVENANCE_PATH, serializeCompanionProvenance(provenance), 'utf8')
    process.stdout.write(`   provenance: ${PROVENANCE_PATH}\n`)
    process.stdout.write(
      '   no compiler revision or manifest hash is recorded: this journey has no target compiler\n',
    )

    step('Installing the companion from the packed artifacts')
    const artifacts = pack(artifactsDir, publishablePackages())

    consumeFromArtifacts(appDirectory, artifacts)
    install(appDirectory)
    assertSingleRuntime(appDirectory)

    step('Bundling both platforms')
    const iosBundle = bundle(appDirectory, workspace, 'ios', ANGULAR_COMPANION_FIXTURE.bundleName)
    const androidBundle = bundle(
      appDirectory,
      workspace,
      'android',
      ANGULAR_COMPANION_FIXTURE.bundleName,
    )

    assertTestIds(iosBundle, 'ios', ANGULAR_COMPANION_FIXTURE.testIds)
    assertTestIds(androidBundle, 'android', ANGULAR_COMPANION_FIXTURE.testIds)

    process.stdout.write(`\nDone. Provenance: ${PROVENANCE_PATH}\n`)
    process.stdout.write(`Workspace: ${workspace}${options.keep ? ' (kept)' : ''}\n`)
  } finally {
    if (!options.keep) {
      removeWorkspace(workspace, artifactsDir)
    }
  }
}

main().catch((error) => {
  process.stderr.write(`angular companion assembly failed: ${error.message}\n`)
  process.exit(1)
})
