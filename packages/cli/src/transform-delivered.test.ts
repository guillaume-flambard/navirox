import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { runCli } from './cli.js'

const temporaryDirectories: string[] = []

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}/vue`, import.meta.url))
}

function capture() {
  const lines: string[] = []
  const errors: string[] = []
  return {
    lines,
    errors,
    io: { out: (line: string) => lines.push(line), err: (line: string) => errors.push(line) },
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('the delivered transform command', () => {
  it('uses the real Vue providers without a test context', async () => {
    const output = temporaryDirectory('navirox-vue-transform-delivered-')
    const io = capture()

    const code = await runCli(
      [
        'transform',
        fixture('vue-transform-workspace'),
        '--profile',
        'vue-mobile',
        '--out',
        output,
        '--write',
        '--json',
      ],
      io.io,
      process.cwd(),
    )

    expect(code).toBe(0)

    const result = JSON.parse(io.lines.join('\n')) as {
      readonly ok: boolean
      readonly workflowHash: string
      readonly plannedPaths: string[]
      readonly commands: string[]
      readonly stages: string[]
    }

    expect(result.ok).toBe(true)
    expect(result.workflowHash).toEqual(expect.any(String))
    expect(result.stages).toEqual(
      expect.arrayContaining(['discovery', 'inspect-plan', 'lower', 'emit', 'scaffold']),
    )
    expect(result.plannedPaths).toEqual(
      expect.arrayContaining([
        'generated/Home.vue',
        'generated/About.vue',
        'src/main.ts',
        'package.json',
        'navirox.manifest.json',
      ]),
    )
    expect(result.commands.some((command) => command.includes('navirox build ios'))).toBe(false)
    expect(result.commands.some((command) => command.includes('navirox build android'))).toBe(false)
    expect(result.commands.some((command) => command.includes('pnpm test'))).toBe(true)

    for (const path of [
      'generated/Home.vue',
      'generated/About.vue',
      'src/main.ts',
      'package.json',
    ]) {
      expect(existsSync(join(output, path)), `missing ${path}`).toBe(true)
    }

    const manifest = JSON.parse(readFileSync(join(output, 'navirox.manifest.json'), 'utf8')) as {
      readonly workflowHash: string
    }
    expect(manifest.workflowHash).toBe(result.workflowHash)

    execFileSync('corepack', ['pnpm', '--dir', output, 'install', '--ignore-scripts'], {
      stdio: 'pipe',
    })
    expect(() =>
      execFileSync('corepack', ['pnpm', '--dir', output, 'test'], { stdio: 'pipe' }),
    ).not.toThrow()
  }, 30_000)

  it('records a refused screen without planning a replacement', async () => {
    const output = temporaryDirectory('navirox-vue-transform-refused-')
    const io = capture()

    const code = await runCli(
      [
        'transform',
        fixture('vue-transform-workspace-refused'),
        '--profile',
        'vue-mobile',
        '--out',
        output,
        '--write',
        '--json',
      ],
      io.io,
      process.cwd(),
    )

    expect(code).toBe(1)
    const result = JSON.parse(io.lines.join('\n') || io.errors.join('\n')) as {
      readonly ok: boolean
      readonly findings: readonly { readonly code: string }[]
      readonly refusals: readonly { readonly code: string }[]
      readonly plannedPaths: readonly string[]
    }

    expect(result.ok).toBe(false)
    expect(result.findings.map((finding) => finding.code)).toContain('unsupported-watcher')
    expect(result.refusals.map((finding) => finding.code)).toEqual(
      expect.arrayContaining(['unsupported-watcher', 'uncovered-screen']),
    )
    expect(result.plannedPaths.some((path) => path.includes('Refused'))).toBe(false)
    expect(existsSync(join(output, 'navirox.manifest.json'))).toBe(false)
  })
})
