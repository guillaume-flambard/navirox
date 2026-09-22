import { describe, expect, it } from 'vitest'

import {
  canSave,
  nextIn,
  saveOutcome,
} from '../fixtures/record-workflow/src/app/record-workflow.data.js'

describe('the record workflow rules', () => {
  it('advances to the value after the current one', () => {
    expect(nextIn(['new', 'in progress', 'done'], 'new')).toBe('in progress')
  })

  it('wraps at the end of the list', () => {
    expect(nextIn(['new', 'in progress', 'done'], 'done')).toBe('new')
  })

  it('starts at the first value when the current one is unknown', () => {
    expect(nextIn(['new', 'in progress'], 'gone')).toBe('new')
  })

  it('refuses a save without a field value', () => {
    expect(canSave('')).toBe(false)
    expect(canSave('   ')).toBe(false)
    expect(saveOutcome('')).toBe('error')
  })

  it('allows a save with a field value', () => {
    expect(canSave('Filter change due')).toBe(true)
    expect(saveOutcome('Filter change due')).toBe('saved')
  })
})
