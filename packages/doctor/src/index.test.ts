import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME, PACKAGE_ROLE } from './index'

describe('@memolabs-apps/doctor', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@memolabs-apps/doctor')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })
})
