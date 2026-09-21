import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME, PACKAGE_ROLE } from './index'

describe('navirox', () => {
  it('has the public package identity used by npx', () => {
    expect(PACKAGE_NAME).toBe('navirox')
    expect(PACKAGE_ROLE).toContain('npx navirox')
  })
})
