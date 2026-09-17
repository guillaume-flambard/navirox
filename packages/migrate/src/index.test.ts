import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME, PACKAGE_ROLE } from './index'

describe('@navirox/migrate', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@navirox/migrate')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })
})
