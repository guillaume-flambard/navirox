import { describe, expect, it } from 'vitest'
import { HELP, parseArguments, UsageError } from './args'

function usageMessage(argv: readonly string[], host: NodeJS.Platform = 'darwin'): string {
  try {
    parseArguments([...argv], host)
  } catch (error) {
    expect(error).toBeInstanceOf(UsageError)
    return (error as Error).message
  }

  throw new Error(`expected a UsageError for ${JSON.stringify(argv)}`)
}

describe('parseArguments', () => {
  it('reads the dev command', () => {
    expect(parseArguments(['dev'], 'darwin').command).toBe('dev')
  })

  it('defaults to ios on macOS and android everywhere else', () => {
    expect(parseArguments(['dev'], 'darwin').platform).toBe('ios')
    expect(parseArguments(['dev'], 'linux').platform).toBe('android')
    expect(parseArguments(['dev'], 'win32').platform).toBe('android')
  })

  it('leaves the optional flags off by default', () => {
    const parsed = parseArguments(['dev'], 'darwin')

    expect(parsed.json).toBe(false)
    expect(parsed.help).toBe(false)
    expect(parsed.skipPreflight).toBe(false)
    expect(parsed.directory).toBeUndefined()
    expect(parsed.port).toBe(8081)
  })

  it('reads the platform in both spellings', () => {
    expect(parseArguments(['dev', '-p', 'android'], 'darwin').platform).toBe('android')
    expect(parseArguments(['--platform', 'ios', 'dev'], 'linux').platform).toBe('ios')
  })

  it('rejects a platform it cannot build for', () => {
    expect(usageMessage(['dev', '-p', 'web'])).toContain('expects ios or android')
  })

  it('reads the directory in both spellings', () => {
    expect(parseArguments(['dev', '-C', 'apps/my-app'], 'darwin').directory).toBe('apps/my-app')
    expect(parseArguments(['--directory', 'apps/my-app', 'dev'], 'darwin').directory).toBe(
      'apps/my-app',
    )
    expect(parseArguments(['dev', '-C', 'apps/--weird'], 'darwin').directory).toBe('apps/--weird')
  })

  it('reads a port', () => {
    expect(parseArguments(['dev', '--port', '9000'], 'darwin').port).toBe(9000)
  })

  it('rejects a port that is not a usable port number', () => {
    expect(usageMessage(['dev', '--port', '0'])).toContain(
      '--port expects a number between 1 and 65535',
    )
    expect(usageMessage(['dev', '--port', '70000'])).toContain(
      '--port expects a number between 1 and 65535',
    )
    expect(usageMessage(['dev', '--port', 'soon'])).toContain(
      '--port expects a number between 1 and 65535',
    )
  })

  it('reads the boolean flags', () => {
    const parsed = parseArguments(['dev', '--json', '--skip-preflight'], 'darwin')

    expect(parsed.json).toBe(true)
    expect(parsed.skipPreflight).toBe(true)
  })

  it('reads help without requiring a command', () => {
    expect(parseArguments(['--help'], 'darwin').help).toBe(true)
    expect(parseArguments(['-h'], 'darwin').help).toBe(true)
  })

  it('rejects an option it does not know', () => {
    expect(usageMessage(['dev', '--fast'])).toContain('Unknown option "--fast".')
  })

  it('rejects a second command', () => {
    expect(usageMessage(['dev', 'build'])).toContain('Unexpected argument "build"')
  })

  it('rejects a command it does not know', () => {
    expect(usageMessage(['build'])).toContain('Unknown command "build"')
  })

  it('rejects an option that is missing its value', () => {
    expect(usageMessage(['dev', '-p'])).toContain('-p needs a value')
    expect(usageMessage(['dev', '-C', '-p'])).toContain('-C needs a value')
  })

  it('requires a command when there is no help request', () => {
    expect(usageMessage([])).toContain('A command is required')
  })

  it('describes the command and every option in its help', () => {
    expect(HELP).toContain('Usage:')
    expect(HELP).toContain('navirox <command> [options]')
    expect(HELP).toContain('dev')
    expect(HELP).toContain('--platform')
    expect(HELP).toContain('--directory')
    expect(HELP).toContain('--port')
    expect(HELP).toContain('--skip-preflight')
    expect(HELP).toContain('--json')
    expect(HELP).toContain('--help')
    expect(HELP).toContain('8081')
  })
})
