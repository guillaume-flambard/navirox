import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  CaptureMissingError,
  CaptureUnavailableError,
  captureNativeDevice,
  type DeviceProcessRunner,
} from './drivers.js'
import type { ScenarioCapture, VisualScenario } from './scenario.js'

const capture: ScenarioCapture = { key: 'rest', moment: 'rest' }

function scenario(): VisualScenario {
  return {
    name: 'records-list',
    route: '/records',
    dataStatus: 'ready',
    viewportWidth: 390,
    viewportHeight: 844,
    device: 'web-chrome-390x844',
    colourScheme: 'light',
    fontScale: 1,
    reducedMotion: false,
    actions: [],
    captures: [capture],
    masks: [],
  }
}

interface FakeDevice {
  readonly appDirectory: string
  readonly binaryPath: string
  readonly outPath: string
  readonly commands: string[]
}

function fakeDevice(name: string): FakeDevice {
  const root = mkdtempSync(join(tmpdir(), `device-driver-${name}-`))
  const appDirectory = join(root, 'app')
  mkdirSync(join(appDirectory, 'node_modules', '.bin'), { recursive: true })
  mkdirSync(join(appDirectory, 'android'), { recursive: true })
  writeFileSync(join(appDirectory, 'node_modules', '.bin', 'detox'), '#!/bin/sh\n')

  return {
    appDirectory,
    binaryPath: join(appDirectory, 'android', 'app-debug.apk'),
    outPath: join(root, 'rest.android.png'),
    commands: [],
  }
}

function optionsFor(
  device: FakeDevice,
  run: DeviceProcessRunner,
): Parameters<typeof captureNativeDevice>[3] {
  return {
    platform: 'android',
    appDirectory: device.appDirectory,
    binaryPath: device.binaryPath,
    deviceName: 'navirox-e2e',
    scenarioPath: join(device.appDirectory, 'e2e', 'records-list.json'),
    rootTestId: 'records-screen',
    artifactDirectory: join(device.appDirectory, 'scenario-artifacts'),
    run,
  }
}

describe('the native capture driver', () => {
  it('builds, runs and keeps a capture the device produced', () => {
    const device = fakeDevice('produced')
    const runner: DeviceProcessRunner = (command, args) => {
      device.commands.push(args[0] ?? '')

      if (args[0] === 'build') {
        mkdirSync(join(device.appDirectory, 'android'), { recursive: true })
        writeFileSync(device.binaryPath, 'apk')
      }

      if (args[0] === 'test') {
        writeFileSync(device.outPath, 'png')
      }

      return { status: 0, stdout: '', stderr: '' }
    }

    captureNativeDevice(scenario(), capture, device.outPath, optionsFor(device, runner))

    expect(device.commands).toEqual(['build', 'test'])
  })

  it('skips the build when the application binary already exists', () => {
    const device = fakeDevice('already-built')
    writeFileSync(device.binaryPath, 'apk')
    const runner: DeviceProcessRunner = (command, args) => {
      device.commands.push(args[0] ?? '')

      if (args[0] === 'test') {
        writeFileSync(device.outPath, 'png')
      }

      return { status: 0, stdout: '', stderr: '' }
    }

    captureNativeDevice(scenario(), capture, device.outPath, optionsFor(device, runner))

    expect(device.commands).toEqual(['test'])
  })

  it('leaves the packager alone when the caller started it', () => {
    const device = fakeDevice('warm-packager')
    const argumentsSeen: string[][] = []
    const runner: DeviceProcessRunner = (command, args) => {
      argumentsSeen.push([...args])

      if (args[0] === 'build') {
        writeFileSync(device.binaryPath, 'apk')
      }

      if (args[0] === 'test') {
        writeFileSync(device.outPath, 'png')
      }

      return { status: 0, stdout: '', stderr: '' }
    }

    captureNativeDevice(scenario(), capture, device.outPath, {
      ...optionsFor(device, runner),
      skipStart: true,
    })

    const build = argumentsSeen.find((args) => args[0] === 'build') ?? []
    const test = argumentsSeen.find((args) => args[0] === 'test') ?? []

    expect(build).not.toContain('--start')
    expect(test).toContain('--start')
    expect(test[test.indexOf('--start') + 1]).toBe('false')
  })

  it('refuses a run whose build produced no application binary', () => {
    const device = fakeDevice('no-binary')
    const runner: DeviceProcessRunner = () => ({ status: 0, stdout: '', stderr: '' })

    expect(() =>
      captureNativeDevice(scenario(), capture, device.outPath, optionsFor(device, runner)),
    ).toThrow(/no application binary exists at/)

    expect(() =>
      captureNativeDevice(scenario(), capture, device.outPath, optionsFor(device, runner)),
    ).toThrow(CaptureUnavailableError)
  })

  it('refuses a device it could not reach', () => {
    const device = fakeDevice('unreachable')
    writeFileSync(device.binaryPath, 'apk')
    const runner: DeviceProcessRunner = (command, args) => {
      if (args[0] === 'test') {
        return { status: 1, stdout: '', stderr: 'unable to connect to 127.0.0.1:5555' }
      }

      return { status: 0, stdout: '', stderr: '' }
    }

    expect(() =>
      captureNativeDevice(scenario(), capture, device.outPath, optionsFor(device, runner)),
    ).toThrow(/navirox-e2e exited with status 1: unable to connect to 127\.0\.0\.1:5555/)

    expect(() =>
      captureNativeDevice(scenario(), capture, device.outPath, optionsFor(device, runner)),
    ).toThrow(CaptureMissingError)
  })

  it('refuses a run with no prepared application', () => {
    const device = fakeDevice('unprepared')
    const options = optionsFor(device, () => ({ status: 0, stdout: '', stderr: '' }))

    expect(() =>
      captureNativeDevice(scenario(), capture, device.outPath, {
        ...options,
        appDirectory: '',
      }),
    ).toThrow(/given no appDirectory/)

    expect(() =>
      captureNativeDevice(scenario(), capture, device.outPath, {
        ...options,
        appDirectory: '',
      }),
    ).toThrow(CaptureUnavailableError)
  })

  it('reports the missing Detox install when no runner is injected', () => {
    const device = fakeDevice('no-detox')
    const options = optionsFor(device, () => ({ status: 0, stdout: '', stderr: '' }))
    const missingApp = join(device.appDirectory, 'missing')

    expect(() =>
      captureNativeDevice(scenario(), capture, device.outPath, {
        platform: options.platform,
        appDirectory: missingApp,
        binaryPath: join(missingApp, 'app-debug.apk'),
        deviceName: options.deviceName,
        scenarioPath: options.scenarioPath,
        rootTestId: options.rootTestId,
        artifactDirectory: options.artifactDirectory,
      }),
    ).toThrow(/Detox is not installed in/)
  })
})
