/**
 * Verifies the generated records screen the way a user would meet it.
 *
 * The compiler output is already pinned byte for byte by the target-vue unit
 * tests. This script proves the next step: a scaffolded app that installs the
 * packed candidate, runs the freshly compiled screen as its root component,
 * and still bundles for both platforms with the stable test identifiers in
 * the bundles. Compile happens here from the web fixture, so a hand-written
 * replacement cannot sneak in: the script refuses to continue unless the
 * fresh output hashes exactly to the checked-in emitted file.
 *
 * The preparation helpers are shared with the native capture script, which
 * builds the same app to drive it on a device.
 *
 * Usage: node scripts/verify-records-screen.mjs [--keep]
 */

import { join } from 'node:path'

import {
  assertInstalledFromArtifacts,
  assertSingleRuntime,
  assertTestIds,
  bundle,
  consumeFromArtifacts,
  install,
  installGeneratedScreen,
  lintApp,
  newWorkspace,
  pack,
  publishablePackages,
  removeWorkspace,
  requireBuild,
  scaffold,
} from './lib/fixture-app.mjs'

async function main() {
  const keep = process.argv.includes('--keep')
  requireBuild()

  const { workspace, artifactsDir } = newWorkspace('navirox-records-')

  const packages = publishablePackages()
  const artifacts = pack(artifactsDir, packages)
  const appDir = scaffold(join(workspace, 'app'))
  await installGeneratedScreen(appDir)
  consumeFromArtifacts(appDir, artifacts)
  install(appDir)
  lintApp(appDir)
  assertInstalledFromArtifacts(appDir, packages)
  assertSingleRuntime(appDir)

  const iosBundle = bundle(appDir, workspace, 'ios')
  const androidBundle = bundle(appDir, workspace, 'android')
  assertTestIds(iosBundle, 'ios')
  assertTestIds(androidBundle, 'android')

  process.stdout.write(`\nDone. Workspace: ${workspace}${keep ? ' (kept)' : ''}\n`)

  if (!keep) {
    removeWorkspace(workspace, artifactsDir)
  }
}

await main()
