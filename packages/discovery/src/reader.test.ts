import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createMemoryReader } from './readers.js'
import { discoverRepository } from './index.js'

const SRC_DIR = new URL('.', import.meta.url).pathname

function productionSources(): { readonly file: string; readonly text: string }[] {
  return readdirSync(SRC_DIR)
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
    .map((file) => ({ file, text: readFileSync(join(SRC_DIR, file), 'utf8') }))
    .sort((left, right) => left.file.localeCompare(right.file))
}

/** Import specifiers referenced by executable lines, comments stripped. */
function importSpecifiers(source: string): readonly string[] {
  const withoutComments = source
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('/*'))
    .join('\n')
  const found = new Set<string>()
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g
  for (const match of withoutComments.matchAll(pattern)) {
    const specifier = match[1]
    if (specifier !== undefined) found.add(specifier)
  }
  return [...found].sort((left, right) => left.localeCompare(right))
}

const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /^node:fs/,
  /^node:child_process/,
  /^child_process/,
  /^fs$/,
  /^vue(\/|$)/,
  /^@vue\//,
  /^nuxt(\/|$)/,
  /^@nuxt\//,
  /^svelte(\/|$)/,
  /^@sveltejs\//,
  /^@angular\//,
  /^react(\/|$)/,
  /^react-dom(\/|$)/,
  /^next(\/|$)/,
  /^astro(\/|$)/,
  /^solid-js(\/|$)/,
  /^@builder\.io\/qwik/,
  /^lit(\/|$)/,
  /^@symbiote-native\//,
  /^react-native(\/|$)/,
]

describe('injected reader interface', () => {
  it('reads through the injected reader only: no filesystem, shell, framework, target or renderer import', () => {
    for (const { file, text } of productionSources()) {
      const specifiers = importSpecifiers(text)
      const forbidden = specifiers.filter((specifier) =>
        FORBIDDEN_PATTERNS.some((pattern) => pattern.test(specifier)),
      )
      expect(forbidden, `${file} imports ${forbidden.join(', ')}`).toEqual([])
      expect(text.includes('fetch('), `${file} calls fetch`).toBe(false)
    }
  })

  it('reports exactly the files it read, sorted', () => {
    const reader = createMemoryReader({
      'package.json': JSON.stringify({ name: 'x', version: '0.1.0' }),
      'unlisted.txt': 'never read',
    })
    const manifest = discoverRepository(reader)

    const sorted = [...manifest.filesRead].sort((left, right) => left.localeCompare(right))
    expect(manifest.filesRead).toEqual(sorted)
    expect(manifest.filesRead).not.toContain('unlisted.txt')
    expect(manifest.filesRead).toContain('package.json')
  })

  it('records an explicit diagnostic when a listed file cannot be read', () => {
    const manifest = discoverRepository({
      files: ['package.json'],
      readText: () => undefined,
    })

    expect(manifest.diagnostics.some((diagnostic) => diagnostic.code === 'unreadable-file')).toBe(
      true,
    )
    expect(manifest.coverage.uncovered.some((area) => area.includes('package.json'))).toBe(true)
  })
})
