import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import { createVueAdapter } from './index'

/**
 * The real adapter against the shared contract check.
 *
 * The check was written before any adapter existed, so this is the first time it
 * has been pointed at something other than a fixture in its own test file. It is
 * also the cheapest proof that the contract is implementable.
 */
describe('the Vue adapter against the adapter contract', () => {
  it('reports no violation', async () => {
    const root = fileURLToPath(new URL('../fixtures/vue-app', import.meta.url))
    const violations = await verifyAdapterContract(createVueAdapter(), createProjectFiles(root))

    expect(violations).toEqual([])
  })
})
