import { stripComments } from '@navirox/source'

/**
 * Vue constructs this adapter recognizes and does not model.
 *
 * The list exists so that "unknown" is a reported result rather than a silence.
 * A reader who sees no finding for a `<Teleport>` should be able to conclude the
 * adapter handles it, and this is what makes that true.
 *
 * It is deliberately short. A long list of things an adapter does not do is a
 * roadmap, and this is a statement about what a reading leaves out.
 */
export interface UnmodelledPattern {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly match: RegExp
}

export const UNMODELLED_PATTERNS: readonly UnmodelledPattern[] = [
  {
    code: 'web-component',
    title: 'A web component is defined',
    message:
      'customElements.define declares a browser native component. This adapter models single file components and cannot say anything about it.',
    match: /\bcustomElements\s*\.\s*define\s*\(/,
  },
  {
    code: 'teleport',
    title: 'A Teleport is used',
    message:
      'Teleport moves content to another part of the document. It has no direct native equivalent and this adapter does not model it.',
    match: /<Teleport[\s>]/,
  },
  {
    code: 'suspense',
    title: 'Suspense is used',
    message: 'Suspense depends on the browser rendering timeline. This adapter does not model it.',
    match: /<Suspense[\s>]/,
  },
]

/**
 * The codes of the unmodelled constructs a text uses, in declaration order.
 *
 * Comments are stripped first, for the reason running this scan against a real
 * project made obvious: a file that documents `<Suspense>` in a comment is not a
 * file that uses one, and reporting it would be a false claim about a file the
 * adapter never really read.
 */
export function scanUnmodelled(text: string): readonly UnmodelledPattern[] {
  const code = stripComments(text)

  return UNMODELLED_PATTERNS.filter((pattern) => pattern.match.test(code))
}
