import { describe, expect, it } from 'vitest'
import { classifyReadiness, READINESS_STATES } from './index'

const base = { file: 'src/app/thing.component.ts', externalTemplate: false, routePatterns: [] }

describe('classifying mobile readiness', () => {
  it('states the three classifications this adapter is allowed to make', () => {
    expect([...READINESS_STATES]).toEqual(['candidate', 'desktop-only', 'unknown'])
  })

  it('classifies an unread template as unknown', () => {
    const readiness = classifyReadiness({
      ...base,
      text: '@Component({ templateUrl: "./thing.component.html" })',
      externalTemplate: true,
    })

    expect(readiness).toMatchObject({ state: 'unknown', rule: 'unread-template' })
    expect(readiness.reason).toContain(base.file)
    expect(readiness.evidence).toEqual([base.file])
  })

  it('classifies an attachment signal as a candidate', () => {
    const readiness = classifyReadiness({ ...base, text: '<input type="file" />' })

    expect(readiness).toMatchObject({ state: 'candidate', rule: 'attachment-signal' })
    expect(readiness.reason).toContain(base.file)
  })

  it('classifies a device capability as a candidate', () => {
    const readiness = classifyReadiness({
      ...base,
      text: 'await navigator.mediaDevices.getUserMedia({ video: true })',
    })

    expect(readiness).toMatchObject({ state: 'candidate', rule: 'device-capability-signal' })
  })

  it('classifies a mutating record write as a candidate', () => {
    const readiness = classifyReadiness({
      ...base,
      text: "await fetch('/api/records/current', { method: 'PATCH' })",
    })

    expect(readiness).toMatchObject({ state: 'candidate', rule: 'record-update-signal' })
  })

  it('does not read a plain request as a record update', () => {
    const readiness = classifyReadiness({
      ...base,
      text: 'const response = await fetch(`/api/records/${id}`)',
      routePatterns: ['/records/:id'],
    })

    expect(readiness).toMatchObject({ state: 'unknown', rule: 'no-mobile-signal' })
  })

  it('classifies an administration route as desktop only', () => {
    const readiness = classifyReadiness({
      ...base,
      text: 'const settings = []',
      routePatterns: ['/admin/configuration'],
    })

    expect(readiness).toMatchObject({ state: 'desktop-only', rule: 'administration-surface' })
    expect(readiness.reason).toContain('/admin/configuration')
    expect(readiness.evidence).toEqual([base.file, '/admin/configuration'])
  })

  it('prefers an observed mobile workflow over the administration default', () => {
    const readiness = classifyReadiness({
      ...base,
      text: '<input type="file" />',
      routePatterns: ['/admin/configuration'],
    })

    expect(readiness).toMatchObject({ state: 'candidate', rule: 'attachment-signal' })
  })

  it('reports no observed workflow as unknown rather than as portable', () => {
    const readiness = classifyReadiness({ ...base, text: 'readonly rows = ["one", "two"]' })

    expect(readiness).toMatchObject({ state: 'unknown', rule: 'no-mobile-signal' })
    expect(readiness.reason).toContain('no evidence')
    expect(readiness.reason).not.toContain('portable')
  })
})
