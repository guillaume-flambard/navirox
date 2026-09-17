import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME, PACKAGE_ROLE } from './index'

describe('@navirox/build', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@navirox/build')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })
})
