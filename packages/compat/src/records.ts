import type { CompatibilityRecord } from './types.js'

/**
 * The seed.
 *
 * Every record here names the demonstration it rests on, and a package is absent
 * rather than expected to work. That is the whole rule: a registry that guesses is
 * worse than a registry that is empty, because a plan cannot tell the difference
 * between a fact and a hope.
 *
 * The facts are the ones this repository has, which is the acceptance application
 * building and running on both platforms, the shared journey asserting device
 * behaviour, and the runtime packages this project ships.
 */
export const SEED_RECORDS: readonly CompatibilityRecord[] = [
  {
    subject: { kind: 'package', name: 'vue' },
    status: 'supported',
    evidence: [
      {
        level: 'android-build-tested',
        source: 'examples/vue-basic, built and driven by e2e/canary.test.ts on an emulator',
      },
      {
        level: 'ios-build-tested',
        source: 'examples/vue-basic, built and driven by e2e/canary.test.ts on a simulator',
      },
    ],
    notes:
      'Single file components render on the native surface through the runtime provider, which is what the acceptance application exists to show.',
  },
  {
    subject: { kind: 'package', name: 'pinia' },
    status: 'supported',
    evidence: [
      {
        level: 'android-build-tested',
        source: 'e2e/canary.test.ts, the shared store journey, on an emulator',
      },
      {
        level: 'ios-build-tested',
        source: 'e2e/canary.test.ts, the shared store journey, on a simulator',
      },
    ],
    notes:
      'State lives behind the runtime seam and the acceptance journey drives one store from two sibling components on both platforms.',
  },
  {
    subject: { kind: 'package', name: '@vue/runtime-core' },
    status: 'supported',
    evidence: [
      { level: 'android-build-tested', source: 'examples/vue-basic on an emulator' },
      { level: 'ios-build-tested', source: 'examples/vue-basic on a simulator' },
    ],
    notes:
      'The runtime the Vue provider renders with, exercised by every journey in the acceptance app.',
  },
  {
    subject: { kind: 'package', name: 'react-native' },
    status: 'supported',
    evidence: [
      { level: 'android-build-tested', source: 'examples/vue-basic/android, assembled in CI' },
      { level: 'ios-build-tested', source: 'examples/vue-basic/ios, built in CI' },
    ],
    notes:
      'Infrastructure rather than a dependency to migrate: the native surface Navirox builds on.',
  },
  {
    subject: { kind: 'package', name: 'react' },
    status: 'supported',
    evidence: [
      { level: 'android-build-tested', source: 'examples/vue-basic on an emulator' },
      { level: 'ios-build-tested', source: 'examples/vue-basic on a simulator' },
    ],
    notes: 'Present through the native infrastructure, not imported by application code.',
  },
  {
    subject: { kind: 'package', name: '@symbiote-native/vue' },
    status: 'supported',
    evidence: [
      { level: 'android-build-tested', source: 'examples/vue-basic on an emulator' },
      { level: 'ios-build-tested', source: 'examples/vue-basic on a simulator' },
    ],
    notes:
      'The runtime provider behind the seam, pinned exactly and replaced without touching application code.',
  },
  {
    subject: { kind: 'package', name: '@symbiote-native/engine' },
    status: 'supported',
    evidence: [
      { level: 'android-build-tested', source: 'examples/vue-basic on an emulator' },
      { level: 'ios-build-tested', source: 'examples/vue-basic on a simulator' },
    ],
    notes: 'The host-side engine the provider drives.',
  },
  {
    subject: { kind: 'package', name: '@symbiote-native/css-parser' },
    status: 'supported-with-adapter',
    evidence: [
      {
        level: 'integration-tested',
        source: 'packages/metro-preset and the styled acceptance components',
      },
    ],
    notes:
      'A build time parser reached through the Metro preset, so the adapter is part of the toolchain rather than a runtime shim.',
  },
  {
    subject: { kind: 'package', name: 'react-native-haptic-feedback' },
    status: 'supported',
    evidence: [
      {
        level: 'android-build-tested',
        source: 'e2e/canary.test.ts, the native APIs journey, on an emulator',
      },
      {
        level: 'ios-build-tested',
        source: 'e2e/canary.test.ts, the native APIs journey, on a simulator',
      },
    ],
    notes:
      'Behind the native facade, exercised through the capability surface rather than imported by application code.',
  },
  {
    subject: { kind: 'package', name: 'react-native-keychain' },
    status: 'supported',
    evidence: [
      {
        level: 'android-build-tested',
        source: 'e2e/canary.test.ts, the native APIs journey, on an emulator',
      },
      {
        level: 'ios-build-tested',
        source: 'e2e/canary.test.ts, the native APIs journey, on a simulator',
      },
    ],
    notes: 'The secure store behind the native facade.',
  },
  {
    subject: { kind: 'package', name: '@memolabs-apps/runtime' },
    status: 'not-applicable',
    evidence: [
      { level: 'unit-tested', source: 'packages/runtime, the contract test against the stub' },
    ],
    notes: 'Native side. A project does not migrate it, it depends on it.',
  },
  {
    subject: { kind: 'package', name: '@memolabs-apps/runtime-symbiote' },
    status: 'not-applicable',
    evidence: [
      {
        level: 'unit-tested',
        source: 'packages/runtime-symbiote, including the import boundary test',
      },
    ],
    notes: 'Native side, and the only package allowed to reach the renderer.',
  },
  {
    subject: { kind: 'package', name: '@memolabs-apps/ui' },
    status: 'not-applicable',
    evidence: [{ level: 'unit-tested', source: 'packages/ui' }],
    notes: 'Native side: the component surface a migrated view is written against.',
  },
  {
    subject: { kind: 'package', name: '@memolabs-apps/native' },
    status: 'not-applicable',
    evidence: [{ level: 'unit-tested', source: 'packages/native' }],
    notes: 'Native side: the capability surface.',
  },
  {
    subject: { kind: 'package', name: '@memolabs-apps/metro-preset' },
    status: 'not-applicable',
    evidence: [{ level: 'integration-tested', source: 'examples/vue-basic/metro.config.js' }],
    notes: 'Build tooling on the target side.',
  },
  {
    subject: { kind: 'package', name: '@memolabs-apps/router' },
    status: 'not-applicable',
    evidence: [{ level: 'unit-tested', source: 'packages/router' }],
    notes: 'Native side: the routing surface a migrated screen uses.',
  },
]
