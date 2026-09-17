import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME, PACKAGE_ROLE, BUILT_ON } from './index'

describe('@navirox/router', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@navirox/router')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })

  it('is built on the runtime seam, never on a concrete runtime', () => {
    expect(BUILT_ON).toBe('@navirox/runtime')
  })
})
