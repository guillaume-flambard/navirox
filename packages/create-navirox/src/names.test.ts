import { describe, expect, it } from 'vitest'
import { deriveNames, InvalidAppNameError, isValidDirName } from './names'

describe('deriveNames', () => {
  it('derives the three shapes of an app identity from a hyphenated name', () => {
    expect(deriveNames('my-app')).toEqual({
      dirName: 'my-app',
      displayName: 'my-app',
      packageId: 'dev.navirox.myapp',
      pascalName: 'MyApp',
    })
  })

  it('reads the same three derived values out of every spelling of one name', () => {
    const spellings = ['my-app', 'MyApp', 'my app', 'MY APP', 'my_app']

    for (const spelling of spellings) {
      const names = deriveNames(spelling)

      expect(names.dirName).toBe('my-app')
      expect(names.pascalName).toBe('MyApp')
      expect(names.packageId).toBe('dev.navirox.myapp')
    }
  })

  it('keeps the display name as the person typed it, trimmed', () => {
    expect(deriveNames('  My App  ').displayName).toBe('My App')
  })

  it('splits a camel case name at its case boundary', () => {
    expect(deriveNames('vueNativeApp').dirName).toBe('vue-native-app')
    expect(deriveNames('vueNativeApp').pascalName).toBe('VueNativeApp')
  })

  it('prefixes a bundle segment that would start with a digit', () => {
    const names = deriveNames('2fast')

    expect(names.packageId).toBe('dev.navirox.app2fast')
    expect(names.dirName).toBe('2fast')
    expect(names.pascalName).toBe('2fast')
  })

  it('refuses a name with nothing usable in it', () => {
    expect(() => deriveNames('   ')).toThrow(InvalidAppNameError)
    expect(() => deriveNames('---')).toThrow(InvalidAppNameError)
  })

  it('names the error after the class so a caller can branch on it', () => {
    try {
      deriveNames('')
      expect.unreachable('deriveNames should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidAppNameError)
      expect((error as Error).name).toBe('InvalidAppNameError')
      expect((error as Error).message).toContain('cannot be used as an app name')
    }
  })
})

describe('isValidDirName', () => {
  it('accepts the names deriveNames produces', () => {
    expect(isValidDirName(deriveNames('My App').dirName)).toBe(true)
    expect(isValidDirName('my-app')).toBe(true)
    expect(isValidDirName('app2')).toBe(true)
  })

  it('rejects what a directory name cannot be', () => {
    expect(isValidDirName('')).toBe(false)
    expect(isValidDirName('MyApp')).toBe(false)
    expect(isValidDirName('my app')).toBe(false)
    expect(isValidDirName('-my-app')).toBe(false)
    expect(isValidDirName('my-app-')).toBe(false)
  })
})
