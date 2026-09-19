import { describe, expect, it } from 'vitest'
import { APP_GRAPH_SCHEMA_VERSION, PACKAGE_NAME, PACKAGE_ROLE, emptyGraphFragment } from './index'

describe('@memolabs-apps/graph', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@memolabs-apps/graph')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })

  it('states the schema version it speaks', () => {
    expect(APP_GRAPH_SCHEMA_VERSION).toBe(1)
  })

  it('offers an empty fragment a well formed adapter can start from', () => {
    const fragment = emptyGraphFragment()
    expect(Object.values(fragment).every((list) => Array.isArray(list) && list.length === 0)).toBe(
      true,
    )
  })
})
