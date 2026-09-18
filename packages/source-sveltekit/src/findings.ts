import type { Finding } from '@navirox/graph'
import { findingId } from '@navirox/graph'
import type { FindingDraft } from './routes.js'
import { ADAPTER_ID } from './detect.js'

/**
 * Route file findings, given the identity they need.
 *
 * The reading in `routes.ts` produces drafts without ids so it stays a pure
 * function of the file list; identity is this adapter's business, because the
 * identifier has to name the adapter that produced it.
 */
export function routeFindings(drafts: readonly FindingDraft[]): readonly Finding[] {
  return drafts.map((draft) => ({
    id: findingId({ adapterId: ADAPTER_ID, code: draft.code, key: draft.source.file }),
    code: draft.code,
    severity: 'info',
    title: draft.title,
    message: draft.message,
    evidence: [{ kind: 'source', value: draft.source.file }],
    source: draft.source,
  }))
}
