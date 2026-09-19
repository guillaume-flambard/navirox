import { describe, expect, it } from 'vitest'
import {
  importSpecifiers,
  isRelativeSpecifier,
  packageNameOf,
  resolveRelativeSpecifier,
} from './imports'

describe('reading the imports a file names', () => {
  it('finds the module forms a project writes, once each', () => {
    const content = [
      "import { a } from './a'",
      "import type { B } from './b'",
      "export { c } from './c'",
      "import './side-effect'",
      "const d = await import('./d')",
      "const e = require('./e')",
      "import { a } from './a'",
    ].join('\n')

    expect(importSpecifiers(content)).toEqual(['./a', './b', './c', './d', './e', './side-effect'])
  })

  it('finds nothing in a file without imports', () => {
    expect(importSpecifiers('export const a = 1\n')).toEqual([])
  })
})

describe('resolving a relative specifier', () => {
  const files = new Set(['src/lib/money.ts', 'src/lib/index.ts', 'src/App.vue'])

  it('resolves an extension the file left out', () => {
    expect(resolveRelativeSpecifier('src/a.ts', './lib/money', (path) => files.has(path))).toBe(
      'src/lib/money.ts',
    )
  })

  it('resolves a directory to its index', () => {
    expect(resolveRelativeSpecifier('src/a.ts', './lib', (path) => files.has(path))).toBe(
      'src/lib/index.ts',
    )
  })

  it('resolves a kept extension and normalizes separators', () => {
    expect(
      resolveRelativeSpecifier('src/views/Home.vue', '../App.vue', (path) => files.has(path)),
    ).toBe('src/App.vue')
  })

  it('returns undefined when nothing matches', () => {
    expect(resolveRelativeSpecifier('src/a.ts', './missing', () => false)).toBeUndefined()
  })
})

describe('naming the package of a specifier', () => {
  it('handles scoped and unscoped specifiers, with and without a path', () => {
    expect(packageNameOf('vue')).toBe('vue')
    expect(packageNameOf('pinia/dist')).toBe('pinia')
    expect(packageNameOf('@memolabs-apps/ui')).toBe('@memolabs-apps/ui')
    expect(packageNameOf('@memolabs-apps/ui/dist/x')).toBe('@memolabs-apps/ui')
  })

  it('recognizes what is relative', () => {
    expect(isRelativeSpecifier('./a')).toBe(true)
    expect(isRelativeSpecifier('../a')).toBe(true)
    expect(isRelativeSpecifier('@/a')).toBe(false)
    expect(isRelativeSpecifier('vue')).toBe(false)
  })
})
