import type { VersionMatrixRow } from './version-matrix.js'
import { VersionMatrix, parseVersionMatrix } from './version-matrix.js'

/**
 * The seed matrix.
 *
 * Every row mirrors the range its adapter declares, so the claim can be
 * audited in one place instead of once per adapter. Every row is gated at T0:
 * analysis exists on a corpus, and nothing further is claimed. In particular
 * no row names a target profile, because no target emission is proven for any
 * of these lines yet.
 */
export const SEED_VERSION_MATRIX: readonly VersionMatrixRow[] = [
  {
    adapterId: 'vue',
    profile: 'vue-single-file-component',
    framework: 'vue',
    verifiedVersions: ['^3.5.0'],
    topologyProfiles: ['single-package'],
    admittedPlugins: ['vue-router'],
    admittedConfigs: ['tsconfig.json'],
    coveredConstructs: [
      'single-file-component',
      'literal-router-routes',
      'pinia-store-declaration',
      'capability-pattern-scan',
    ],
    escapeHatches: ['version-untested', 'sfc-parse-failed', 'manifest-unreadable'],
    targetProfiles: [],
    evidence: [
      { level: 'fixture-tested', source: 'packages/source-vue/fixtures/vue-app' },
      {
        level: 'fixture-tested',
        source: 'packages/source-vue/fixtures/version-positive, version-boundary, version-refused',
      },
    ],
    gate: 'T0',
  },
  {
    adapterId: 'angular',
    profile: 'angular-standalone-component',
    framework: '@angular/core',
    verifiedVersions: ['^20.0.0', '^21.0.0'],
    topologyProfiles: ['single-package'],
    admittedPlugins: ['@angular/router'],
    admittedConfigs: ['tsconfig.json'],
    coveredConstructs: [
      'standalone-component',
      'decorator-declaration-reading',
      'literal-routes',
      'bounded-state-reading',
    ],
    escapeHatches: ['version-untested', 'manifest-unreadable'],
    targetProfiles: [],
    evidence: [
      { level: 'fixture-tested', source: 'packages/source-angular/fixtures/angular-app' },
      {
        level: 'fixture-tested',
        source:
          'packages/source-angular/fixtures/version-positive, version-boundary, version-refused',
      },
    ],
    gate: 'T0',
  },
  {
    adapterId: 'react',
    profile: 'react-function-component',
    framework: 'react',
    verifiedVersions: ['^19.0.0'],
    topologyProfiles: ['single-package'],
    admittedPlugins: ['react-router'],
    admittedConfigs: ['tsconfig.json'],
    coveredConstructs: [
      'function-component',
      'state-module',
      'literal-router-routes',
      'capability-pattern-scan',
    ],
    escapeHatches: ['version-untested', 'manifest-unreadable'],
    targetProfiles: [],
    evidence: [
      { level: 'fixture-tested', source: 'packages/source-react/fixtures/react-app' },
      {
        level: 'fixture-tested',
        source:
          'packages/source-react/fixtures/version-positive, version-boundary, version-refused',
      },
    ],
    gate: 'T0',
  },
  {
    adapterId: 'svelte',
    profile: 'svelte-component',
    framework: 'svelte',
    verifiedVersions: ['^5.0.0'],
    topologyProfiles: ['single-package'],
    admittedPlugins: [],
    admittedConfigs: ['tsconfig.json'],
    coveredConstructs: ['component-blocks', 'rune-state-reading', 'capability-pattern-scan'],
    escapeHatches: ['version-untested', 'manifest-unreadable'],
    targetProfiles: [],
    evidence: [
      { level: 'fixture-tested', source: 'packages/source-svelte/fixtures/svelte-app' },
      {
        level: 'fixture-tested',
        source:
          'packages/source-svelte/fixtures/version-positive, version-boundary, version-refused',
      },
    ],
    gate: 'T0',
  },
]

/**
 * The seed, loaded through the same validation as any data.
 *
 * It is written as data in this package and re-validated at load, so a bad
 * edit to the seed fails the moment something reads it rather than the moment
 * someone trusts it.
 */
export function loadSeedVersionMatrix(): VersionMatrix {
  return new VersionMatrix(parseVersionMatrix(SEED_VERSION_MATRIX))
}
