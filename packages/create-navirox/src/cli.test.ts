import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { HELP, parseArguments, runCli, UsageError, type ICliIo } from './cli'

const created: string[] = []

function emptyDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'navirox-cli-'))
  created.push(dir)
  return dir
}

interface ICaptured extends ICliIo {
  readonly lines: string[]
  readonly errors: string[]
  text(): string
}

function capture(): ICaptured {
  const lines: string[] = []
  const errors: string[] = []

  return {
    lines,
    errors,
    out: (line) => {
      lines.push(line)
    },
    err: (line) => {
      errors.push(line)
    },
    text: () => [...lines, ...errors].join('\n'),
  }
}

afterEach(() => {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('parseArguments', () => {
  it('reads a bare name', () => {
    expect(parseArguments(['my-app']).name).toBe('my-app')
  })

  it('defaults every option off', () => {
    const parsed = parseArguments([])

    expect(parsed.json).toBe(false)
    expect(parsed.help).toBe(false)
    expect(parsed.name).toBeUndefined()
    expect(parsed.directory).toBeUndefined()
  })

  it('accepts --json in either position', () => {
    expect(parseArguments(['--json', 'my-app']).json).toBe(true)
    expect(parseArguments(['my-app', '--json']).json).toBe(true)
  })

  it('accepts the short and long help flags', () => {
    expect(parseArguments(['-h']).help).toBe(true)
    expect(parseArguments(['--help']).help).toBe(true)
  })

  it('reads a directory from -d and from --directory', () => {
    expect(parseArguments(['-d', 'apps/my-app', 'my-app']).directory).toBe('apps/my-app')
    expect(parseArguments(['--directory', 'apps/my-app']).directory).toBe('apps/my-app')
  })

  it('refuses an option it does not know', () => {
    expect(() => parseArguments(['--verbose'])).toThrow(UsageError)
  })

  it('refuses a second positional argument', () => {
    expect(() => parseArguments(['one', 'two'])).toThrow(UsageError)
  })

  it('refuses -d with nothing after it', () => {
    expect(() => parseArguments(['-d'])).toThrow(UsageError)
  })
})

describe('runCli', () => {
  it('prints the help text and succeeds', async () => {
    const io = capture()
    const code = await runCli(['--help'], io)

    expect(code).toBe(0)
    expect(io.text()).toBe(HELP)
    expect(HELP).toContain('Usage')
    expect(HELP).toContain('npm create navirox <name>')
    expect(HELP).toContain('--json')
    expect(HELP).toContain('-d, --directory')
  })

  it('scaffolds an app and reports where it went', async () => {
    const cwd = emptyDir()
    const io = capture()
    const code = await runCli(['My App'], io, cwd)

    expect(code).toBe(0)
    expect(existsSync(join(cwd, 'my-app', 'App.vue'))).toBe(true)
    expect(io.text()).toContain('Created My App in')
    expect(io.text()).toContain('Android package dev.navirox.myapp')
    expect(io.text()).toContain('npx navirox dev')
    expect(io.errors).toEqual([])
  })

  it('emits one JSON document with --json, and nothing else', async () => {
    const cwd = emptyDir()
    const io = capture()
    const code = await runCli(['--json', 'My App'], io, cwd)

    expect(code).toBe(0)
    expect(io.lines).toHaveLength(1)

    const payload = JSON.parse(io.lines[0] as string) as {
      ok: boolean
      dirName: string
      directory: string
      files: number
      warnings: readonly string[]
    }

    expect(payload.ok).toBe(true)
    expect(payload.dirName).toBe('my-app')
    expect(payload.directory).toBe(join(cwd, 'my-app'))
    expect(payload.files).toBeGreaterThan(50)
    // The Navirox packages are linked from this checkout rather than installed
    // from a registry, and the JSON has to say so: an app that looked installed
    // and then failed at its first build would be a worse surprise.
    expect(payload.warnings).toHaveLength(1)
    expect(payload.warnings[0]).toContain('pnpm build')
  })

  it('scaffolds into a directory given on the command line', async () => {
    const cwd = emptyDir()
    const io = capture()
    const code = await runCli(['-d', 'apps/my-app', 'My App'], io, cwd)

    expect(code).toBe(0)
    expect(existsSync(join(cwd, 'apps/my-app/App.vue'))).toBe(true)
  })

  it('refuses --json without a name rather than hanging on a prompt', async () => {
    const io = capture()
    const code = await runCli(['--json'], io)

    expect(code).toBe(1)

    const payload = JSON.parse(io.lines[0] as string) as {
      ok: boolean
      error: { name: string; message: string }
    }

    expect(payload.ok).toBe(false)
    expect(payload.error.name).toBe('UsageError')
  })

  it('explains a name it cannot use, and points at the help', async () => {
    const io = capture()
    const code = await runCli(['!!!'], io)

    expect(code).toBe(1)
    expect(io.text()).toContain('cannot be used as an app name')
    expect(io.text()).toContain('Run with --help')
    expect(io.lines).toEqual([])
    expect(io.errors.length).toBeGreaterThan(0)
  })

  it('reports an unusable name as data under --json', async () => {
    const io = capture()
    const code = await runCli(['--json', '!!!'], io)

    expect(code).toBe(1)

    const payload = JSON.parse(io.lines[0] as string) as {
      ok: boolean
      error: { name: string; message: string }
    }

    expect(payload.ok).toBe(false)
    expect(payload.error.name).toBe('InvalidAppNameError')
    expect(payload.error.message).toContain('cannot be used as an app name')
  })

  it('leaves an occupied directory alone, and says so', async () => {
    const cwd = emptyDir()
    const occupied = join(cwd, 'my-app')
    mkdirSync(occupied, { recursive: true })
    writeFileSync(join(occupied, 'keep.txt'), 'not mine')

    const io = capture()
    const code = await runCli(['My App'], io, cwd)

    expect(code).toBe(1)
    expect(io.text()).toContain('already exists and is not empty')
    expect(io.text()).toContain('Nothing was changed.')
    expect(existsSync(join(occupied, 'keep.txt'))).toBe(true)
  })
})
