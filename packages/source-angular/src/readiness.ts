/**
 * Mobile companion readiness, as observed in Angular source.
 *
 * This is adapter metadata, not a portability promise. A candidate is a workflow
 * this adapter saw evidence for in the source; it is not a route that Navirox will
 * move, and no state here means a screen is ready for a mobile build.
 *
 * The rules are ordered, and each one names the evidence it used:
 *
 * 1. An external template was not read, so nothing about the view is known. Unknown.
 * 2. A file the user picks, a device capability or a mutating record write is direct
 *    evidence of a workflow a companion can carry. Candidate. This wins over the
 *    administration default below on purpose: an administration page that also
 *    captures a document has shown a mobile workflow, which is the separate evidence
 *    the design asks for.
 * 3. An administration or configuration route is desktop work. Desktop only.
 * 4. Nothing was observed. Unknown, because Navirox has no answer yet.
 */

export const READINESS_STATES = ['candidate', 'desktop-only', 'unknown'] as const

export type ReadinessState = (typeof READINESS_STATES)[number]

export type MobileReadiness = {
  readonly state: ReadinessState
  readonly rule: string
  readonly reason: string
  readonly evidence: readonly string[]
}

export interface ReadinessInput {
  readonly file: string
  readonly text: string
  readonly externalTemplate: boolean
  readonly routePatterns: readonly string[]
}

const ATTACHMENT_PATTERN =
  /type\s*=\s*['"]file['"]|\bFileReader\b|readAs(?:Text|DataURL|ArrayBuffer|BinaryString)\(/
const DEVICE_CAPABILITY_PATTERN =
  /getUserMedia|MediaRecorder|navigator\.geolocation|watchPosition|getCurrentPosition/
const RECORD_UPDATE_PATTERN = /\bmethod\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/i
const ADMINISTRATION_PATTERN = /(^|\/)(?:admin|configuration)(?:\/|$)/i

export function classifyReadiness(input: ReadinessInput): MobileReadiness {
  if (input.externalTemplate) {
    return {
      state: 'unknown',
      rule: 'unread-template',
      reason: `${input.file} declares an external template. Its view was not read, so no workflow could be observed in it.`,
      evidence: [input.file],
    }
  }

  if (ATTACHMENT_PATTERN.test(input.text)) {
    return {
      state: 'candidate',
      rule: 'attachment-signal',
      reason: `${input.file} reads a file the user picks, which is an attachment workflow a companion can carry.`,
      evidence: [input.file],
    }
  }

  if (DEVICE_CAPABILITY_PATTERN.test(input.text)) {
    return {
      state: 'candidate',
      rule: 'device-capability-signal',
      reason: `${input.file} calls a device capability, which is a workflow a companion can carry.`,
      evidence: [input.file],
    }
  }

  if (RECORD_UPDATE_PATTERN.test(input.text)) {
    return {
      state: 'candidate',
      rule: 'record-update-signal',
      reason: `${input.file} writes to a record with a mutating request, which is a record update workflow a companion can carry.`,
      evidence: [input.file],
    }
  }

  const administrationRoute = input.routePatterns.find((pattern) =>
    ADMINISTRATION_PATTERN.test(pattern),
  )

  if (administrationRoute !== undefined) {
    return {
      state: 'desktop-only',
      rule: 'administration-surface',
      reason: `The route ${administrationRoute} is an administration or configuration surface, which is desktop work unless separate evidence shows a mobile workflow.`,
      evidence: [input.file, administrationRoute],
    }
  }

  return {
    state: 'unknown',
    rule: 'no-mobile-signal',
    reason: `${input.file} shows no attachment, device capability or record update signal, so Navirox has no evidence for a mobile workflow here.`,
    evidence: [input.file],
  }
}
