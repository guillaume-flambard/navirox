import { describe, expect, it } from 'vitest'
import { isApplicationModule } from './index'

/**
 * What counts as application logic, pinned.
 *
 * Every exclusion here is a statement rather than a preference, and the predicate
 * lives in one place because two adapters asking two copies of the question would
 * eventually disagree about the same file.
 */
describe('application modules', () => {
  it('accepts a plain module', () => {
    expect(isApplicationModule('src/lib/money.ts')).toBe(true)
    expect(isApplicationModule('stores/canary.ts')).toBe(true)
    expect(isApplicationModule('src/lib/format.js')).toBe(true)
  })

  it('leaves out a test file, by name or by directory', () => {
    expect(isApplicationModule('src/lib/money.test.ts')).toBe(false)
    expect(isApplicationModule('src/lib/money.spec.ts')).toBe(false)
    expect(isApplicationModule('e2e/setup.ts')).toBe(false)
    expect(isApplicationModule('src/__tests__/money.ts')).toBe(false)
    expect(isApplicationModule('test/helpers.ts')).toBe(false)
  })

  it('leaves out configuration, however it is named', () => {
    expect(isApplicationModule('src/vite.config.ts')).toBe(false)
    expect(isApplicationModule('nuxt.config.ts')).toBe(false)
    expect(isApplicationModule('metro.config.js')).toBe(false)
  })

  it('leaves out entry points wherever they are', () => {
    expect(isApplicationModule('index.js')).toBe(false)
    expect(isApplicationModule('src/main.ts')).toBe(false)
    expect(isApplicationModule('src/lib/index.ts')).toBe(false)
  })

  it('leaves out declarations and anything ignored', () => {
    expect(isApplicationModule('src/types.d.ts')).toBe(false)
    expect(isApplicationModule('node_modules/lib/index.ts')).toBe(false)
    expect(isApplicationModule('packages/a/dist/out.ts')).toBe(false)
  })

  it('leaves out anything that is not a module', () => {
    expect(isApplicationModule('src/App.vue')).toBe(false)
    expect(isApplicationModule('src/App.svelte')).toBe(false)
    expect(isApplicationModule('package.json')).toBe(false)
  })
})
