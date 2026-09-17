import { describe, expect, it } from 'vitest'
import { detectPackageManager, runDev, type IDevContext } from './dev'
import { PreflightError } from './preflight'
import type { ICommand } from './runner'

const MANIFEST_PATH_SUFFIX = 'package.json'
const ALL_TOOLS = ['watchman', 'xcodebuild', 'pod', 'adb']

interface IFakeContext extends IDevContext {
  readonly started: ICommand[]
  readonly ran: ICommand[]
  stopCount(): number
}

interface IFakeOptions {
  readonly manifest?: unknown
  readonly files?: readonly string[]
  readonly tools?: readonly string[]
  readonly env?: NodeJS.ProcessEnv
  readonly launchCode?: number
  readonly portFails?: boolean
}

function fakeContext(options: IFakeOptions = {}): IFakeContext {
  const started: ICommand[] = []
  const ran: ICommand[] = []
  let stops = 0
  const files = options.files ?? ['pnpm-lock.yaml', MANIFEST_PATH_SUFFIX]
  const tools = options.tools ?? ALL_TOOLS
  const manifest = options.manifest ?? {
    name: 'my-app',
    scripts: {
      start: 'metro start',
      dev: 'metro start --reset-cache',
      ios: 'run-ios',
      android: 'run-android',
    },
  }

  return {
    started,
    ran,
    stopCount: () => stops,
    runner: {
      run: (command) => {
        ran.push(command)
        return Promise.resolve(options.launchCode ?? 0)
      },
      start: (command) => {
        started.push(command)
        return {
          stop: () => {
            stops += 1
          },
          done: Promise.resolve(0),
        }
      },
      waitForPort: () =>
        options.portFails === true
          ? Promise.reject(new Error('nothing answered'))
          : Promise.resolve(),
    },
    probe: {
      find: (executable) =>
        tools.includes(executable) ? `/usr/local/bin/${executable}` : undefined,
      exists: (path) => files.some((suffix) => path.endsWith(suffix)),
    },
    env: options.env ?? {},
    readFile: () => JSON.stringify(manifest),
  }
}

function capture(): {
  lines: string[]
  errors: string[]
  io: { out: (line: string) => void; err: (line: string) => void }
} {
  const lines: string[] = []
  const errors: string[] = []

  return {
    lines,
    errors,
    io: {
      out: (line) => {
        lines.push(line)
      },
      err: (line) => {
        errors.push(line)
      },
    },
  }
}

describe('detectPackageManager', () => {
  it('prefers pnpm, then yarn, then npm', () => {
    const pnpm = detectPackageManager('/app', (path) =>
      ['/app/pnpm-lock.yaml', '/app/yarn.lock'].includes(path),
    )
    const yarn = detectPackageManager('/app', (path) => path === '/app/yarn.lock')
    const npm = detectPackageManager('/app', () => false)

    expect(pnpm.name).toBe('pnpm')
    expect(yarn.name).toBe('yarn')
    expect(npm.name).toBe('npm')
  })

  it('runs a script the way that package manager does', () => {
    const pnpm = detectPackageManager('/app', (path) => path === '/app/pnpm-lock.yaml')
    const yarn = detectPackageManager('/app', (path) => path === '/app/yarn.lock')

    expect(pnpm.run('dev')).toEqual(['pnpm', 'run', 'dev'])
    expect(yarn.run('dev')).toEqual(['yarn', 'run', 'dev'])
  })
})

describe('runDev', () => {
  it('starts the dev server first, then launches the platform', async () => {
    const context = fakeContext()
    const io = capture()

    const exitCode = await runDev(
      {
        cwd: '/app',
        directory: undefined,
        platform: 'ios',
        port: 8081,
        json: false,
        skipPreflight: false,
      },
      io.io,
      context,
    )

    expect(exitCode).toBe(0)
    expect(context.started).toHaveLength(1)
    expect(context.started[0]).toEqual({
      command: 'pnpm',
      args: ['pnpm', 'run', 'dev'],
      cwd: '/app',
    })
    expect(context.ran).toEqual([{ command: 'pnpm', args: ['pnpm', 'run', 'ios'], cwd: '/app' }])
    expect(io.errors).toEqual([])
    expect(io.lines).toContain('Navirox dev: ios, dev server on port 8081.')
  })

  it('resolves the directory against the working directory', async () => {
    const context = fakeContext()
    const io = capture()

    await runDev(
      {
        cwd: '/repo',
        directory: 'apps/my-app',
        platform: 'ios',
        port: 8081,
        json: false,
        skipPreflight: false,
      },
      io.io,
      context,
    )

    expect(context.started[0]?.cwd).toBe('/repo/apps/my-app')
  })

  it('falls back to the start script when there is no dev script', async () => {
    const context = fakeContext({
      manifest: { name: 'my-app', scripts: { start: 'metro start', ios: 'run-ios' } },
    })
    const io = capture()

    await runDev(
      {
        cwd: '/app',
        directory: undefined,
        platform: 'ios',
        port: 8081,
        json: false,
        skipPreflight: false,
      },
      io.io,
      context,
    )

    expect(context.started[0]?.args).toEqual(['pnpm', 'run', 'start'])
  })

  it('launches android with the Android toolchain checked', async () => {
    const context = fakeContext({ env: { ANDROID_HOME: '/sdk' }, files: ['package.json', '/sdk'] })
    const io = capture()

    const exitCode = await runDev(
      {
        cwd: '/app',
        directory: undefined,
        platform: 'android',
        port: 8081,
        json: false,
        skipPreflight: false,
      },
      io.io,
      context,
    )

    expect(exitCode).toBe(0)
    expect(context.ran[0]?.args).toEqual(['npm', 'run', 'android'])
  })

  it('reports the plan as one json line', async () => {
    const context = fakeContext()
    const io = capture()

    await runDev(
      {
        cwd: '/app',
        directory: undefined,
        platform: 'ios',
        port: 9000,
        json: true,
        skipPreflight: false,
      },
      io.io,
      context,
    )

    const plan = JSON.parse(io.lines[0] ?? '{}') as Record<string, unknown>

    expect(plan).toEqual({
      ok: true,
      command: 'dev',
      appDir: '/app',
      packageManager: 'pnpm',
      platform: 'ios',
      port: 9000,
      devScript: 'dev',
      launchScript: 'ios',
    })
  })

  it('refuses to run a directory that has no app in it', async () => {
    const context = fakeContext({ files: [] })

    await expect(
      runDev(
        {
          cwd: '/nowhere',
          directory: undefined,
          platform: 'ios',
          port: 8081,
          json: false,
          skipPreflight: false,
        },
        capture().io,
        context,
      ),
    ).rejects.toThrow(/was not found, so there is no app to run here/)
  })

  it('refuses an app that declares no way to start the dev server', async () => {
    const context = fakeContext({ manifest: { name: 'my-app', scripts: { ios: 'run-ios' } } })

    await expect(
      runDev(
        {
          cwd: '/app',
          directory: undefined,
          platform: 'ios',
          port: 8081,
          json: false,
          skipPreflight: false,
        },
        capture().io,
        context,
      ),
    ).rejects.toThrow(/has no "dev" or "start" script/)
  })

  it('refuses an app that declares no script for the platform', async () => {
    const context = fakeContext({
      manifest: { name: 'my-app', scripts: { dev: 'metro start', ios: 'run-ios' } },
    })

    await expect(
      runDev(
        {
          cwd: '/app',
          directory: undefined,
          platform: 'android',
          port: 8081,
          json: false,
          skipPreflight: false,
        },
        capture().io,
        context,
      ),
    ).rejects.toThrow(/The app has no "android" script/)
  })

  it('stops before starting anything when the toolchain is incomplete', async () => {
    const context = fakeContext({ tools: [] })
    const io = capture()

    await expect(
      runDev(
        {
          cwd: '/app',
          directory: undefined,
          platform: 'ios',
          port: 8081,
          json: false,
          skipPreflight: false,
        },
        io.io,
        context,
      ),
    ).rejects.toBeInstanceOf(PreflightError)

    expect(context.started).toEqual([])
    expect(context.ran).toEqual([])
    expect(io.errors.some((line) => line.includes('is missing.'))).toBe(true)
  })

  it('goes ahead when preflight is skipped', async () => {
    const context = fakeContext({ tools: [] })
    const io = capture()

    const exitCode = await runDev(
      {
        cwd: '/app',
        directory: undefined,
        platform: 'ios',
        port: 8081,
        json: false,
        skipPreflight: true,
      },
      io.io,
      context,
    )

    expect(exitCode).toBe(0)
    expect(context.started).toHaveLength(1)
  })

  it('stops the dev server when the platform build fails', async () => {
    const context = fakeContext({ launchCode: 2 })
    const io = capture()

    await expect(
      runDev(
        {
          cwd: '/app',
          directory: undefined,
          platform: 'ios',
          port: 8081,
          json: false,
          skipPreflight: false,
        },
        io.io,
        context,
      ),
    ).rejects.toThrow(/exited with code 2/)

    expect(context.stopCount()).toBe(1)
  })

  it('stops the dev server when it never answers on its port', async () => {
    const context = fakeContext({ portFails: true })
    const io = capture()

    await expect(
      runDev(
        {
          cwd: '/app',
          directory: undefined,
          platform: 'ios',
          port: 8081,
          json: false,
          skipPreflight: false,
        },
        io.io,
        context,
      ),
    ).rejects.toThrow('nothing answered')

    expect(context.stopCount()).toBe(1)
    expect(context.ran).toEqual([])
  })
})
