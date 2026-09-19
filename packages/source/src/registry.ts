import type { Evidence } from '@memolabs-apps/graph'

import type {
  DetectionCandidate,
  DetectionConfidence,
  DetectionContext,
  SourceAdapter,
} from './types.js'

/** Registering two adapters under one id is a bug in the composition root. */
export class DuplicateAdapterError extends Error {
  constructor(public readonly adapterId: string) {
    super(`A source adapter with id "${adapterId}" is already registered.`)
    this.name = 'DuplicateAdapterError'
  }
}

/** Asking for an adapter that was never registered is a typed failure, not undefined. */
export class UnknownAdapterError extends Error {
  constructor(public readonly adapterId: string) {
    super(
      `No source adapter is registered with id "${adapterId}". ` +
        'Register it at the composition root before selecting it by name.',
    )
    this.name = 'UnknownAdapterError'
  }
}

/** A candidate, attributed to the adapter that reported it. */
export interface DetectedSource {
  readonly adapterId: string
  readonly confidence: DetectionConfidence
  readonly evidence: readonly Evidence[]
}

const CONFIDENCE_RANK: Record<DetectionConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

function candidateOrder(left: DetectedSource, right: DetectedSource): number {
  const byConfidence = CONFIDENCE_RANK[right.confidence] - CONFIDENCE_RANK[left.confidence]
  if (byConfidence !== 0) return byConfidence
  return left.adapterId.localeCompare(right.adapterId)
}

/**
 * The registry is the only place that knows which adapters exist.
 *
 * It is deliberately dumb about frameworks. It never mentions one, it never
 * defaults to one, and registering a new adapter is a change to the composition
 * root and to nothing else. Listing is sorted by id so the order adapters are
 * registered in cannot leak into tool output.
 */
export class SourceAdapterRegistry {
  readonly #adapters = new Map<string, SourceAdapter>()

  register(adapter: SourceAdapter): void {
    if (this.#adapters.has(adapter.id)) {
      throw new DuplicateAdapterError(adapter.id)
    }
    this.#adapters.set(adapter.id, adapter)
  }

  has(id: string): boolean {
    return this.#adapters.has(id)
  }

  /** Throws `UnknownAdapterError` rather than returning undefined. */
  get(id: string): SourceAdapter {
    const adapter = this.#adapters.get(id)
    if (adapter === undefined) throw new UnknownAdapterError(id)
    return adapter
  }

  list(): readonly SourceAdapter[] {
    return [...this.#adapters.values()].sort((left, right) => left.id.localeCompare(right.id))
  }

  /**
   * Runs every adapter's detection and returns every candidate it reported.
   *
   * One project can produce several candidates (a meta-framework and the
   * framework it composes). An empty result means no adapter recognized the
   * project, which is a normal answer and not an error.
   */
  async detect(context: DetectionContext): Promise<readonly DetectedSource[]> {
    const detected: DetectedSource[] = []

    for (const adapter of this.list()) {
      const result = await adapter.detect(context)
      for (const candidate of result.candidates) {
        detected.push(this.#attribute(adapter, candidate))
      }
    }

    return detected.sort(candidateOrder)
  }

  /**
   * Picks the adapter to work with, preferring the most specific one.
   *
   * Specificity is expressed by the adapters themselves: one that declares it
   * composes another, present candidate is the more specific of the two. The
   * registry still names no framework, which is the point.
   */
  async select(context: DetectionContext): Promise<DetectedSource | undefined> {
    const detected = await this.detect(context)
    return selectAdapter(detected, (id) => this.#adapters.get(id))
  }

  #attribute(adapter: SourceAdapter, candidate: DetectionCandidate): DetectedSource {
    return {
      adapterId: adapter.id,
      confidence: candidate.confidence,
      evidence: candidate.evidence,
    }
  }
}

/**
 * Chooses one candidate from a detection result.
 *
 * Kept as a free function so it can be tested, and reused, without a registry.
 * Ties are broken by adapter id so the answer never depends on iteration order.
 */
export function selectAdapter(
  detected: readonly DetectedSource[],
  lookup: (id: string) => SourceAdapter | undefined,
): DetectedSource | undefined {
  if (detected.length === 0) return undefined

  const composed = new Set<string>()
  for (const source of detected) {
    for (const base of lookup(source.adapterId)?.composes ?? []) {
      composed.add(base)
    }
  }

  const specific = detected.filter((source) => !composed.has(source.adapterId))
  const pool = specific.length > 0 ? specific : detected
  return [...pool].sort(candidateOrder)[0]
}
