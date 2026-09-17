import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  checkToolchain,
  findOnPath,
  missingRemedies,
  PreflightError,
  requiredTools,
  type IProbe,
} from './preflight'

const temporaryRoots: string[] = []

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'navirox-preflight-'))
  temporaryRoots.push(root)
  return root
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

function probeWith(tools: readonly string[], directories: readonly string[] = []): IProbe {
  return {
    find: (executable) => (tools.includes(executable) ? `/usr/local/bin/${executable}` : undefined),
    exists: (path) => directories.includes(path),
  }
}

describe('findOnPath', () => {
  it('finds an executable on the path', () => {
    const root = temporaryRoot()
    const executable = join(root, 'navirox-probe-tool')
    writeFileSync(executable, '#!/bin/sh\n')
    chmodSync(executable, 0o755)

    expect(findOnPath('navirox-probe-tool', root)).toBe(executable)
  })

  it('skips empty segments and returns nothing when the tool is absent', () => {
    const root = temporaryRoot()

    expect(findOnPath('navirox-probe-tool', root)).toBeUndefined()
    expect(findOnPath('navirox-probe-tool', '')).toBeUndefined()
    expect(findOnPath('navirox-probe-tool', `:${root}:`)).toBeUndefined()
  })
})

describe('requiredTools', () => {
  it('asks for the Apple toolchain on ios', () => {
    expect(requiredTools('ios').map((tool) => tool.id)).toEqual(['watchman', 'xcodebuild', 'pod'])
  })

  it('asks for the Android toolchain on android', () => {
    expect(requiredTools('android').map((tool) => tool.id)).toEqual(['watchman', 'adb'])
  })
})

describe('checkToolchain', () => {
  it('passes when every tool is on the path', () => {
    const results = checkToolchain({
      platform: 'ios',
      env: {},
      probe: probeWith(['watchman', 'xcodebuild', 'pod']),
    })

    expect(results).toHaveLength(3)
    expect(results.every((result) => result.ok)).toBe(true)
    expect(results.every((result) => result.detail === `/usr/local/bin/${result.id}`)).toBe(true)
  })

  it('fails the tool that is missing and keeps its remedy', () => {
    const results = checkToolchain({
      platform: 'ios',
      env: {},
      probe: probeWith(['watchman', 'xcodebuild']),
    })
    const missing = results.filter((result) => !result.ok)

    expect(missing).toHaveLength(1)
    expect(missing[0]?.id).toBe('pod')
    expect(missing[0]?.detail).toBe('')
    expect(missing[0]?.remedy).toContain('cocoapods')
  })

  it('accepts either Android SDK variable', () => {
    const withHome = checkToolchain({
      platform: 'android',
      env: { ANDROID_HOME: '/sdk' },
      probe: probeWith(['watchman', 'adb'], ['/sdk']),
    })
    const withRoot = checkToolchain({
      platform: 'android',
      env: { ANDROID_SDK_ROOT: '/other-sdk' },
      probe: probeWith(['watchman', 'adb'], ['/other-sdk']),
    })

    expect(withHome.every((result) => result.ok)).toBe(true)
    expect(withRoot.every((result) => result.ok)).toBe(true)
  })

  it('fails the Android SDK when it is unset or points nowhere', () => {
    const unset = checkToolchain({
      platform: 'android',
      env: {},
      probe: probeWith(['watchman', 'adb']),
    })
    const bogus = checkToolchain({
      platform: 'android',
      env: { ANDROID_HOME: '/gone' },
      probe: probeWith(['watchman', 'adb']),
    })

    expect(unset.some((result) => !result.ok)).toBe(true)
    expect(bogus.some((result) => !result.ok)).toBe(true)
  })

  it('does not look for the Android SDK on ios', () => {
    const results = checkToolchain({
      platform: 'ios',
      env: {},
      probe: probeWith(['watchman', 'xcodebuild', 'pod']),
    })

    expect(results.some((result) => result.id === 'ANDROID_HOME')).toBe(false)
  })
})

describe('missingRemedies', () => {
  it('lists one line per failing check and nothing for a passing one', () => {
    const results = checkToolchain({
      platform: 'ios',
      env: {},
      probe: probeWith(['watchman']),
    })
    const remedies = missingRemedies(results)

    expect(remedies).toHaveLength(2)
    expect(remedies.every((line) => line.includes('is missing.'))).toBe(true)
    expect(remedies.some((line) => line.includes('Xcode'))).toBe(true)
  })
})

describe('PreflightError', () => {
  it('names the platform and counts the missing tools', () => {
    const one = new PreflightError('ios', 1).message
    const two = new PreflightError('android', 2).message

    expect(one).toContain('1 thing')
    expect(one).toContain('is missing')
    expect(one).toContain('ios')
    expect(two).toContain('2 things')
    expect(two).toContain('are missing')
    expect(two).toContain('android')
    expect(two).toContain('--skip-preflight')
  })
})
