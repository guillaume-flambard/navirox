import { accessSync, constants, existsSync } from 'node:fs'
import { delimiter, join } from 'node:path'
import type { TPlatform } from './args.js'

/**
 * The native toolchain checks behind `navirox dev`.
 *
 * Every failure here is something a person can fix in a minute if they are told
 * which thing is missing. That is the whole point: a missing simulator or a
 * missing SDK otherwise surfaces as a stack trace from a build tool that Navirox
 * called, which tells the user nothing about what to install.
 */

export interface IProbe {
  /** Resolves an executable the way a shell would, or undefined when it is not there. */
  readonly find: (executable: string) => string | undefined
  /** Whether a path exists, for checks that name a directory rather than a program. */
  readonly exists: (path: string) => boolean
}

export interface IToolRequirement {
  readonly id: string
  readonly label: string
  /** What to install, or what to type, phrased as an instruction rather than advice. */
  readonly remedy: string
}

export interface ICheckResult {
  readonly id: string
  readonly label: string
  readonly ok: boolean
  /** The path or value that satisfied the check, or an empty string when it failed. */
  readonly detail: string
  readonly remedy: string
}

const WATCHMAN: IToolRequirement = {
  id: 'watchman',
  label: 'watchman',
  remedy:
    'Install watchman, which Metro uses to watch the app for changes. `brew install watchman` on macOS, or see the watchman install instructions for your platform.',
}

const XCODEBUILD: IToolRequirement = {
  id: 'xcodebuild',
  label: 'The Xcode command line tools',
  remedy:
    'Install Xcode from the App Store, open it once so the licence is accepted, then run `sudo xcode-select --switch /Applications/Xcode.app`.',
}

const COCOAPODS: IToolRequirement = {
  id: 'pod',
  label: 'CocoaPods',
  remedy:
    'Install CocoaPods with `brew install cocoapods`, or `sudo gem install cocoapods`. Navirox runs pod install for you once it is there.',
}

const ADB: IToolRequirement = {
  id: 'adb',
  label: 'The Android platform tools',
  remedy:
    'Install the Android SDK, then put its platform-tools directory on PATH. For example `export PATH=$PATH:$ANDROID_HOME/platform-tools`.',
}

/** The environment variable Android tooling reads to find the SDK. */
const ANDROID_SDK_VARIABLE = 'ANDROID_HOME'
const ANDROID_SDK_FALLBACK_VARIABLE = 'ANDROID_SDK_ROOT'

/**
 * The programs a platform build needs. macOS gets the Apple toolchain, every
 * other host gets the Android one, and both need a file watcher.
 */
export function requiredTools(platform: TPlatform): readonly IToolRequirement[] {
  return platform === 'ios' ? [WATCHMAN, XCODEBUILD, COCOAPODS] : [WATCHMAN, ADB]
}

export interface ICheckOptions {
  readonly platform: TPlatform
  readonly env: NodeJS.ProcessEnv
  readonly probe: IProbe
}

/** Checks every requirement for a platform and reports each one, passing or not. */
export function checkToolchain(options: ICheckOptions): readonly ICheckResult[] {
  const results: ICheckResult[] = requiredTools(options.platform).map((tool) => {
    const path = options.probe.find(tool.id)
    return {
      id: tool.id,
      label: tool.label,
      ok: path !== undefined,
      detail: path ?? '',
      remedy: tool.remedy,
    }
  })

  if (options.platform === 'android') {
    results.push(checkAndroidSdk(options))
  }

  return results
}

/**
 * The SDK is a directory, not a program, so it cannot be found on PATH. Both
 * variables are accepted because the SDK ships documentation naming one and the
 * Gradle plugin reads the other.
 */
function checkAndroidSdk(options: ICheckOptions): ICheckResult {
  const directory = options.env[ANDROID_SDK_VARIABLE] ?? options.env[ANDROID_SDK_FALLBACK_VARIABLE]
  const ok = directory !== undefined && directory !== '' && options.probe.exists(directory)
  return {
    id: ANDROID_SDK_VARIABLE,
    label: `The ${ANDROID_SDK_VARIABLE} environment variable`,
    ok,
    detail: ok ? (directory ?? '') : '',
    remedy: `Set ${ANDROID_SDK_VARIABLE} to your Android SDK. For example \`export ${ANDROID_SDK_VARIABLE}=$HOME/Library/Android/sdk\`.`,
  }
}

/** The failures, as one actionable line each, ready to print. */
export function missingRemedies(results: readonly ICheckResult[]): readonly string[] {
  return results
    .filter((result) => !result.ok)
    .map((result) => `${result.label} is missing. ${result.remedy}`)
}

/** Thrown when the toolchain is incomplete and the caller did not skip the check. */
export class PreflightError extends Error {
  constructor(platform: TPlatform, missing: number) {
    super(
      `${missing} ${missing === 1 ? 'thing' : 'things'} Navirox needs to build for ${platform} ${missing === 1 ? 'is' : 'are'} missing, listed above. Fix them, or run again with --skip-preflight to try anyway.`,
    )
    this.name = 'PreflightError'
  }
}

/** The real filesystem and PATH, as the checks expect them. */
export function createNodeProbe(): IProbe {
  return {
    find: (executable) => findOnPath(executable, process.env.PATH ?? ''),
    exists: (path) => existsSync(path),
  }
}

/**
 * Walks PATH rather than shelling out to `which`, so the check costs nothing and
 * behaves the same on a machine whose PATH is unusual.
 */
export function findOnPath(executable: string, pathValue: string): string | undefined {
  const suffixes = process.platform === 'win32' ? ['.cmd', '.exe', ''] : ['']
  for (const directory of pathValue.split(delimiter)) {
    if (directory === '') {
      continue
    }
    for (const suffix of suffixes) {
      const candidate = join(directory, `${executable}${suffix}`)
      try {
        accessSync(candidate, constants.X_OK)
        return candidate
      } catch {
        continue
      }
    }
  }
  return undefined
}
