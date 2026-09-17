import { describe, expect, it } from 'vitest'
import type { ICommandResult } from './commands.js'
import {
  exitCodeFor,
  hostPlatform,
  runDoctor,
  type IDoctorDeps,
  type IDoctorReport,
} from './doctor.js'

/**
 * The doctor is tested against a machine described in the test, not against the
 * one running it. Every answer comes from a fake probe, so a test can ask for a
 * Mac without CocoaPods or for an app with expo installed, which is exactly the
 * set of situations this command exists to report on.
 */

interface IFakeMachine {
  files?: Record<string, string>
  onPath?: readonly string[]
  commands?: Record<string, ICommandResult>
  nodeVersion?: string
  env?: NodeJS.ProcessEnv
}

function fakeDeps(options: IFakeMachine = {}): IDoctorDeps {
  const files = options.files ?? {}
  const onPath = new Set(options.onPath ?? [])
  const commands = options.commands ?? {}
  const present = (path: string): boolean =>
    Object.keys(files).some((file) => file === path || file.startsWith(`${path}/`))

  return {
    env: options.env ?? {},
    nodeVersion: options.nodeVersion ?? 'v24.21.0',
    probe: {
      find: (executable) => (onPath.has(executable) ? `/usr/bin/${executable}` : undefined),
      exists: present,
    },
    command: {
      run: (command) =>
        commands[command] ?? { status: 127, stdout: '', stderr: `${command}: not found` },
    },
    exists: present,
    readFile: (path) => {
      const content = files[path]
      if (content === undefined) {
        throw new Error(`ENOENT: ${path}`)
      }
      return content
    },
  }
}

function appFiles(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    '/app/package.json': JSON.stringify({
      name: 'demo',
      engines: { node: '>= 22.13.0' },
    }),
    '/app/node_modules/react-native/package.json': JSON.stringify({ version: '0.86.0' }),
    '/app/node_modules/@symbiote-native/vue/package.json': JSON.stringify({ version: '2.0.0' }),
    '/app/node_modules/@symbiote-native/engine/package.json': JSON.stringify({ version: '0.5.0' }),
    '/app/android/gradle.properties': 'newArchEnabled=true\n',
    ...overrides,
  }
}

/** A Mac with everything the doctor asks about, and pnpm on PATH. */
function workingMachine(files: Record<string, string>): IFakeMachine {
  return {
    files,
    onPath: ['watchman', 'xcodebuild', 'pod', 'pnpm'],
    commands: {
      pnpm: { status: 0, stdout: '11.27.0\n', stderr: '' },
      xcodebuild: { status: 0, stdout: 'Xcode 26.0\n', stderr: '' },
      java: { status: 0, stdout: '', stderr: 'openjdk version "21.0.1" 2026-01-01\n' },
    },
  }
}

function find(report: IDoctorReport, id: string) {
  for (const section of report.sections) {
    const found = section.checks.find((candidate) => candidate.id === id)
    if (found !== undefined) {
      return found
    }
  }

  return undefined
}

function check(report: IDoctorReport, id: string) {
  const found = find(report, id)

  if (found === undefined) {
    throw new Error(`No check with id "${id}" in the report.`)
  }

  return found
}

describe('runDoctor', () => {
  it('reports the versions it can read from the machine and the app', () => {
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(appFiles())))

    expect(report.platform).toBe('ios')
    expect(check(report, 'node').status).toBe('ok')
    expect(check(report, 'node').detail).toBe('24.21.0')
    expect(check(report, 'pnpm').detail).toBe(
      '11.27.0, and this app pins no package manager to compare it against',
    )
    expect(check(report, 'watchman').status).toBe('ok')
    expect(check(report, 'react-native').detail).toBe('0.86.0')
    expect(check(report, '@symbiote-native/vue').detail).toBe('2.0.0')
  })

  it('fails, and exits 2, when a tool this platform needs is missing', () => {
    const deps = fakeDeps({
      ...workingMachine(appFiles()),
      onPath: ['watchman', 'xcodebuild', 'pnpm'],
    })
    const report = runDoctor({ directory: '/app' }, deps)

    expect(check(report, 'pod').status).toBe('fail')
    expect(check(report, 'pod').remedy).toContain('brew install cocoapods')
    expect(exitCodeFor(report)).toBe(2)
  })

  it('says unknown for a package this app does not install', () => {
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(appFiles())))
    const navigation = check(report, '@symbiote-native/navigation')

    expect(navigation.status).toBe('unknown')
    expect(navigation.detail).toContain('not installed in this app')
    expect(navigation.remedy).toBe('')
  })

  it('asks for an install instead of guessing versions when there is no node_modules', () => {
    const files = { '/app/package.json': JSON.stringify({ name: 'demo' }) }
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(files)))

    expect(report.sections.find((section) => section.id === 'runtime')?.checks).toHaveLength(1)
    expect(check(report, 'node_modules').status).toBe('unknown')
    expect(check(report, 'node_modules').remedy).toContain('Install this app first')
  })

  it('fails, and exits 3, when expo is installed', () => {
    const files = appFiles({
      '/app/node_modules/expo/package.json': JSON.stringify({ version: '57.0.0' }),
    })
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(files)))

    expect(check(report, 'expo').status).toBe('fail')
    expect(check(report, 'expo').detail).toBe('present in node_modules')
    expect(check(report, 'expo').remedy).toContain('Remove expo')
    expect(exitCodeFor(report)).toBe(3)
  })

  it('fails on an app that declares expo even before it is installed', () => {
    const files = appFiles({
      '/app/package.json': JSON.stringify({ name: 'demo', dependencies: { expo: '^57.0.0' } }),
    })
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(files)))

    expect(check(report, 'expo').status).toBe('fail')
    expect(check(report, 'expo').detail).toContain('package.json')
  })

  it('reads the New Architecture when the app sets it, and never reads a default', () => {
    const on = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(appFiles())))
    expect(check(on, 'new-architecture').status).toBe('ok')
    expect(check(on, 'new-architecture').detail).toContain('android/gradle.properties')

    const silent = appFiles({ '/app/android/gradle.properties': '# nothing here\n' })
    const unknown = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(silent)))
    expect(check(unknown, 'new-architecture').status).toBe('unknown')
    expect(check(unknown, 'new-architecture').detail).toContain('nothing to read')
  })

  it('fails on a legacy build, because that is the one thing it must never wave through', () => {
    const legacy = appFiles({ '/app/android/gradle.properties': 'newArchEnabled=false\n' })
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(legacy)))

    expect(check(report, 'new-architecture').status).toBe('fail')
    expect(check(report, 'new-architecture').remedy).toContain('New Architecture only')
    expect(exitCodeFor(report)).toBe(3)
  })

  it('fails when Node is older than the floor the app declares', () => {
    const report = runDoctor(
      { directory: '/app' },
      fakeDeps({ ...workingMachine(appFiles()), nodeVersion: 'v20.11.0' }),
    )

    expect(check(report, 'node').status).toBe('fail')
    expect(check(report, 'node').detail).toContain('22.13.0')
  })

  it('warns, without changing the exit code, when pnpm is not the pinned major', () => {
    const files = appFiles({
      '/app/package.json': JSON.stringify({
        name: 'demo',
        engines: { node: '>= 22.13.0' },
        packageManager: 'pnpm@12.4.1',
      }),
    })
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(files)))

    expect(check(report, 'pnpm').status).toBe('warn')
    expect(exitCodeFor(report)).toBe(0)
  })

  it('reports the Android tools and warns about a missing JDK when the platform is android', () => {
    const files = appFiles({ '/sdk': '' })
    const deps = fakeDeps({
      files,
      onPath: ['watchman', 'adb', 'pnpm'],
      env: { ANDROID_HOME: '/sdk' },
      commands: { pnpm: { status: 0, stdout: '11.27.0\n', stderr: '' } },
    })
    const report = runDoctor({ directory: '/app', platform: 'android' }, deps)

    expect(check(report, 'adb').status).toBe('ok')
    expect(check(report, 'ANDROID_HOME').status).toBe('ok')
    expect(check(report, 'java').status).toBe('warn')
    expect(find(report, 'pod')).toBeUndefined()
    expect(exitCodeFor(report)).toBe(0)
  })

  it('counts what it found, so a summary can be printed without walking the report', () => {
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(appFiles())))

    expect(report.counts.ok).toBeGreaterThan(0)
    expect(report.counts.fail).toBe(0)
  })
})

describe('hostPlatform', () => {
  it('builds for the machine it runs on, preferring ios only on a Mac', () => {
    expect(hostPlatform('darwin')).toBe('ios')
    expect(hostPlatform('linux')).toBe('android')
    expect(hostPlatform('win32')).toBe('android')
  })
})

describe('exitCodeFor', () => {
  it('puts a compatibility failure above an environment one', () => {
    const files = appFiles({
      '/app/node_modules/expo/package.json': JSON.stringify({ version: '57.0.0' }),
    })
    const report = runDoctor({ directory: '/app' }, fakeDeps(workingMachine(files)))

    expect(check(report, 'pod').status).toBe('ok')
    expect(exitCodeFor(report)).toBe(3)
  })
})
