import { describe, expect, it } from 'vitest'
import type { SourceInspection } from './index'

/**
 * An adapter that found nothing still has to say so.
 *
 * The discovered collections are required rather than optional, so an omission
 * is a type error instead of an ambiguity the core has to interpret. This is the
 * smallest inspection that is valid on purpose.
 */
describe('an inspection that discovered nothing', () => {
  it('is valid with every collection present and empty', () => {
    const inspection: SourceInspection = {
      descriptor: { adapterId: 'fake', displayName: 'Fake adapter' },
      units: [],
      capabilities: [],
      dependencies: [],
      routes: [],
      findings: [],
    }

    expect(inspection.units).toEqual([])
    expect(inspection.capabilities).toEqual([])
    expect(inspection.dependencies).toEqual([])
    expect(inspection.routes).toEqual([])
    expect(inspection.findings).toEqual([])
  })
})
