import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DEVICE_HARNESS_DEPENDENCIES,
  DEVICE_HARNESS_FILES,
  deviceHarnessFile,
  writeDeviceHarness,
} from './device-harness.js'

function application(): string {
  const app = mkdtempSync(join(tmpdir(), 'device-harness-'))

  writeFileSync(
    join(app, 'pnpm-workspace.yaml'),
    ['allowBuilds:', "  '@parcel/watcher': false", ''].join('\n'),
    'utf8',
  )

  mkdirSync(join(app, 'android', 'app'), { recursive: true })
  writeFileSync(
    join(app, 'android', 'app', 'build.gradle'),
    [
      'android {',
      '    namespace "dev.navirox.recordsfixtureapp"',
      '    defaultConfig {',
      '        applicationId "dev.navirox.recordsfixtureapp"',
      '        versionCode 1',
      '    }',
      '}',
      '',
      'dependencies {',
      '    implementation("com.facebook.react:react-android")',
      '}',
      '',
    ].join('\n'),
    'utf8',
  )

  return app
}

describe('the device harness', () => {
  it('writes every harness file into the prepared application', () => {
    const app = application()
    const written = writeDeviceHarness(app)

    // The five static files plus the generated Detox test and the build file it
    // patches.
    expect(written).toHaveLength(DEVICE_HARNESS_FILES.length + 2)

    for (const name of DEVICE_HARNESS_FILES) {
      const path = join(app, name)

      expect(existsSync(path), path).toBe(true)
      expect(readFileSync(path, 'utf8').length).toBeGreaterThan(0)
      expect(written).toContain(path)
    }
  })

  it('keeps the detox configuration where Detox looks for it', () => {
    const app = application()

    writeDeviceHarness(app)

    expect(existsSync(join(app, 'detox.config.js'))).toBe(true)
    expect(existsSync(join(app, 'e2e', 'jest.config.js'))).toBe(true)
    expect(deviceHarnessFile('detox.config.js')).toContain("config: 'e2e/jest.config.js'")
  })

  it('drives the declared actions and names the five capture moments', () => {
    const capture = deviceHarnessFile('capture.test.ts')

    expect(capture).toContain('capture.actions')
    expect(capture).toContain('nth')
    expect(capture).toContain('.tap()')
    expect(capture).toContain('takeScreenshot')
    expect(capture).toContain('NAVIROX_SCENARIO')
    expect(capture).toContain('NAVIROX_ARTIFACTS')
    expect(capture).toContain('NAVIROX_PLATFORM')
    expect(capture).toContain('NAVIROX_CAPTURE')
    expect(capture).toContain('NAVIROX_ROOT_ID')

    for (const moment of ['rest', 'first-meaningful', 'midpoint', 'settled', 'interrupted']) {
      expect(capture).toContain(moment)
    }
  })

  it('gives the launch a budget larger than the settle wait it performs', () => {
    const capture = deviceHarnessFile('capture.test.ts')

    expect(capture).toContain('beforeAll(launchAndSettle, HOOK_TIMEOUT)')
    expect(capture).toContain('jest.setTimeout(HOOK_TIMEOUT)')
    expect(capture).toContain('const HOOK_TIMEOUT = 480000')
  })

  it('takes the device name from the environment rather than a tracked file', () => {
    const config = deviceHarnessFile('detox.config.js')

    expect(config).toContain('NAVIROX_DEVICE')
    expect(config).toContain('NAVIROX_PLATFORM')
    expect(config).toContain("require('./app.json')")
    expect(config).toContain('ios.sim.debug')
    expect(config).toContain('android.emu.debug')
    expect(config).toContain('reversePorts')
  })

  it('falls back to the variable each platform already names its device with', () => {
    const config = deviceHarnessFile('detox.config.js')

    expect(config).toContain('NAVIROX_IOS_SIMULATOR')
    expect(config).toContain('NAVIROX_ANDROID_AVD')
  })

  it('names the dependencies the harness needs installed', () => {
    expect(Object.keys(DEVICE_HARNESS_DEPENDENCIES).sort()).toEqual([
      '@types/jest',
      'detox',
      'jest',
      'jest-circus',
      'ts-jest',
    ])
  })

  it('overwrites a stale harness file instead of keeping it', () => {
    const app = application()
    const path = join(app, 'e2e', 'capture.test.ts')

    writeDeviceHarness(app)
    writeFileSync(path, 'a stale capture test\n', 'utf8')
    writeDeviceHarness(app)

    expect(readFileSync(path, 'utf8')).toBe(deviceHarnessFile('capture.test.ts'))
  })

  it('approves the build script the harness needs without dropping the app own refusal', () => {
    const app = application()

    writeDeviceHarness(app)

    const settings = readFileSync(join(app, 'pnpm-workspace.yaml'), 'utf8')

    expect(settings).toContain("'detox': true")
    expect(settings).toContain("'dtrace-provider': false")
    expect(settings).toContain("'unrs-resolver': true")
    expect(settings).toContain("'@parcel/watcher': false")

    writeDeviceHarness(app)

    const repeated = readFileSync(join(app, 'pnpm-workspace.yaml'), 'utf8')

    expect(repeated.match(/'detox': true/g)).toHaveLength(1)
  })

  it('refuses to hand out a file it does not write', () => {
    expect(() => deviceHarnessFile('nope.config.js')).toThrow(/no file named nope\.config\.js/)
  })

  it('writes the Android test wiring the scaffolded application does not carry', () => {
    const app = application()

    writeDeviceHarness(app)

    const test = join(
      app,
      'android',
      'app',
      'src',
      'androidTest',
      'java',
      'dev',
      'navirox',
      'recordsfixtureapp',
      'DetoxTest.java',
    )

    expect(existsSync(test)).toBe(true)
    expect(readFileSync(test, 'utf8').split('\n')[0]).toBe('package dev.navirox.recordsfixtureapp;')

    const build = readFileSync(join(app, 'android', 'app', 'build.gradle'), 'utf8')

    expect(build).toContain("testBuildType System.getProperty('testBuildType', 'debug')")
    expect(build).toContain("testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner'")
    expect(build).toContain("missingDimensionStrategy 'detox', 'full'")
    expect(build).toContain("androidTestImplementation('com.wix:detox:+')")

    writeDeviceHarness(app)

    const repeated = readFileSync(join(app, 'android', 'app', 'build.gradle'), 'utf8')

    expect(repeated.match(/testInstrumentationRunner/g)).toHaveLength(1)
    expect(repeated.match(/androidTestImplementation/g)).toHaveLength(1)
  })
})
