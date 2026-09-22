#!/usr/bin/env node
// Assembles the Vue proof companion from the contracted field-workflow fixture.
//
// The fixture is read with the real source adapter and the real planner before
// anything is built. Only units the planner classified shared or portable are
// copied, and they are copied unchanged. The screen the target compiler emits
// becomes the application root, and a provenance record names every file with
// its origin and reason, so a hand-written file can never pass as generated.
//
// Usage: node scripts/build-field-workflow-companion.mjs [--keep]
//
// Exits 0 when the companion is assembled, both bundles carry the declared
// identifiers and the provenance record is written. Exits 1 on any failed
// check. --keep leaves the prepared application on disk for inspection.

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  BENCHMARK,
  COMPILER,
  FIELD_WORKFLOW_FIXTURE,
  ROOT,
  analyzeFixture,
  assert,
  assertSingleRuntime,
  assertTestIds,
  bundle,
  consumeFromArtifacts,
  copyFixtureUnit,
  decisionFor,
  fixtureDirectory,
  install,
  installGeneratedScreen,
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

const PROVENANCE_PATH = join(ROOT, 'docs', 'evidence', 'vue-companion-assembly.provenance.json')

// The units the planner approves are read back from the plan, but the files and
// their subjects are named here so a reclassification is a loud failure rather
// than a companion that silently copied something else.
const MOVED_UNITS = [
  { file: 'fieldLogic.ts', subject: 'vue:fieldLogic.ts:utility:default' },
  { file: 'fieldRecords.ts', subject: 'vue:fieldRecords.ts:utility:default' },
]

const SCREEN_SUBJECTS = [
  'vue:FieldWorkflowScreen.web.vue:component:default',
  'vue:FieldWorkflowScreen.native.vue:component:default',
]

const ACTION_WIRING = ['nextIn', 'saveOutcome']

function parseArguments(argv) {
  return { keep: argv.includes('--keep') }
}

function assertAnalyzed(analysis) {
  assert(
    analysis.source?.adapterId === 'vue',
    `The analysis named the ${analysis.source?.adapterId} adapter instead of vue.`,
  )

  const counts = Object.values(analysis.summary?.findings ?? {})
  const total = counts.reduce((sum, value) => sum + value, 0)

  assert(total === 0, `The fixture reported ${total} findings, so it is not a clean read.`)

  process.stdout.write(
    `   ${analysis.summary.files} files, ${analysis.summary.units} units, 0 findings\n`,
  )
  process.stdout.write('   No subset extension is needed for this fixture.\n')
}

function assertPlan(plan) {
  for (const unit of MOVED_UNITS) {
    const decision = decisionFor(plan, unit.subject)

    assert(
      decision.classification === 'shared' || decision.classification === 'portable',
      `The planner classified ${unit.subject} as ${decision.classification}, not shared or portable.`,
    )

    process.stdout.write(`   ${unit.subject} -> ${decision.classification}\n`)
    unit.decision = decision.classification
  }

  for (const subject of SCREEN_SUBJECTS) {
    const decision = decisionFor(plan, subject)

    assert(
      decision.classification === 'native-replacement',
      `The planner classified the screen ${subject} as ${decision.classification}, not native-replacement.`,
    )
  }
}

function copyUnits(appDirectory) {
  const directory = fixtureDirectory(FIELD_WORKFLOW_FIXTURE)
  const copied = []

  for (const unit of MOVED_UNITS) {
    // copyFixtureUnit writes the source bytes unchanged and returns the target.
    copyFixtureUnit(directory, appDirectory, unit.file)

    const sourceText = readFileSync(join(directory, unit.file), 'utf8')
    const targetText = readFileSync(join(appDirectory, unit.file), 'utf8')

    assert(
      sourceText === targetText,
      `${unit.file} did not arrive unchanged, so the move is not the one the planner approved.`,
    )

    copied.push({ ...unit, sha256: sha256(sourceText) })
    process.stdout.write(`   moved ${unit.file} (${unit.decision})\n`)
  }

  return copied
}

function assertActionWiring(bundlePath, platform) {
  const text = readFileSync(bundlePath, 'utf8')
  const missing = ACTION_WIRING.filter((name) => !text.includes(name))

  assert(
    missing.length === 0,
    `The ${platform} bundle carries none of the moved action wiring: ${missing.join(', ')}.`,
  )
}

async function main() {
  const options = parseArguments(process.argv.slice(2))

  requireBuild()

  const benchmark = await import(pathToFileURL(BENCHMARK).href)
  const { buildCompanionProvenance, refreshCompanionScreen, serializeCompanionProvenance } =
    benchmark

  const analysis = analyzeFixture(FIELD_WORKFLOW_FIXTURE)

  assertAnalyzed(analysis)

  const plan = planFixture(FIELD_WORKFLOW_FIXTURE)

  assertPlan(plan)

  step(`Assembling the companion for "${FIELD_WORKFLOW_FIXTURE.appName}"`)
  const { workspace, artifactsDir } = newWorkspace('navirox-companion-')
  const appDirectory = scaffold(join(workspace, 'app'), FIELD_WORKFLOW_FIXTURE.appName)

  try {
    const compiled = await installGeneratedScreen(appDirectory, FIELD_WORKFLOW_FIXTURE)

    process.stdout.write(
      `   manifest ${compiled.manifestHash} compiler ${compiled.compilerVersion}\n`,
    )

    step('Copying the units the planner approved')
    const copied = copyUnits(appDirectory)

    const provenance = buildCompanionProvenance({
      fixture: 'field-workflow',
      compilerVersion: compiled.compilerVersion,
      manifestHash: compiled.manifestHash,
      screen: FIELD_WORKFLOW_FIXTURE.outputPath,
      files: [
        {
          path: FIELD_WORKFLOW_FIXTURE.outputPath,
          origin: 'generated',
          reason: 'The target compiler emitted this screen from the web fixture.',
        },
        ...copied.map((unit) => ({
          path: unit.file,
          origin: 'moved',
          reason: 'The planner classified it shared, so its behaviour moves unchanged.',
          decision: unit.decision,
          sourcePath: `packages/target-vue/fixtures/field-workflow/${unit.file}`,
          sha256: unit.sha256,
        })),
        {
          path: 'index.js',
          origin: 'manual',
          reason: 'The scaffolder template writes the runtime bootstrap and mounts the app root.',
        },
      ],
    })

    step('Checking the recorded screen still matches a fresh compilation')
    await refreshCompanionScreen({
      compilerEntry: COMPILER,
      webFixture: FIELD_WORKFLOW_FIXTURE.webFixture,
      emittedScreen: FIELD_WORKFLOW_FIXTURE.emittedScreen,
      outputPath: FIELD_WORKFLOW_FIXTURE.outputPath,
      sourceName: FIELD_WORKFLOW_FIXTURE.sourceName,
      provenance,
    })

    step('Writing the provenance record')
    const { writeFileSync } = await import('node:fs')

    writeFileSync(PROVENANCE_PATH, serializeCompanionProvenance(provenance), 'utf8')
    process.stdout.write(`   ${PROVENANCE_PATH}\n`)

    step('Installing the companion from the packed artifacts')
    const artifacts = pack(artifactsDir, publishablePackages())

    consumeFromArtifacts(appDirectory, artifacts)
    install(appDirectory)
    assertSingleRuntime(appDirectory)

    const iosBundle = bundle(appDirectory, workspace, 'ios', FIELD_WORKFLOW_FIXTURE.bundleName)
    const androidBundle = bundle(
      appDirectory,
      workspace,
      'android',
      FIELD_WORKFLOW_FIXTURE.bundleName,
    )

    assertTestIds(iosBundle, 'ios', FIELD_WORKFLOW_FIXTURE.testIds)
    assertTestIds(androidBundle, 'android', FIELD_WORKFLOW_FIXTURE.testIds)
    assertActionWiring(iosBundle, 'ios')
    assertActionWiring(androidBundle, 'android')

    assert(
      existsSync(PROVENANCE_PATH),
      `The provenance record was not written at ${PROVENANCE_PATH}.`,
    )

    process.stdout.write(`\nDone. Provenance: ${PROVENANCE_PATH}\n`)
    process.stdout.write(`Workspace: ${workspace}${options.keep ? ' (kept)' : ''}\n`)
  } finally {
    if (!options.keep) {
      removeWorkspace(workspace, artifactsDir)
    }
  }
}

main().catch((error) => {
  process.stderr.write(`companion assembly failed: ${error.message}\n`)
  process.exit(1)
})
