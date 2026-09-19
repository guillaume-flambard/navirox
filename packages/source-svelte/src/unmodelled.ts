import { stripComments } from '@memolabs-apps/source'

/**
 * Svelte constructs this adapter recognizes and does not model.
 *
 * Same purpose as the Vue adapter's list: a reader who sees no finding should be
 * able to conclude the adapter handles a construct, so anything it deliberately
 * skips has to be reported. The Svelte 4 entry is also the version guard: a
 * component written against the previous major is reported rather than read as if
 * it were the current one.
 */
export interface UnmodelledPattern {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly match: RegExp
}

export const UNMODELLED_PATTERNS: readonly UnmodelledPattern[] = [
  {
    code: 'svelte4-syntax',
    title: 'Svelte 4 syntax is present',
    message:
      'The component uses the previous major syntax (a reactive label or an exported prop). This adapter targets the current major and does not model it.',
    match: /<script[\s\S]*?(^\s*export\s+let\s|\$\s*:\s)/m,
  },
  {
    code: 'html-injection',
    title: 'Raw HTML is injected',
    message:
      '{@html} inserts markup at runtime. It has no direct native equivalent and this adapter does not model it.',
    match: /\{@html\b/,
  },
  {
    code: 'svelte-element',
    title: 'A svelte: element is used',
    message: 'The svelte: namespace reaches the host environment. This adapter does not model it.',
    match: /<svelte:(component|element|window|document|body|head|self|options|fragment)[\s/>]/,
  },
]

/**
 * The unmodelled patterns a text uses, in declaration order.
 *
 * Comments are stripped first, for the reason running this against a real
 * project made obvious: a file that documents `<svelte:element>` in a comment is
 * not a file that uses one, and reporting it would be a false claim about a file
 * the adapter never really read.
 */
export function scanUnmodelled(text: string): readonly UnmodelledPattern[] {
  const code = stripComments(text)

  return UNMODELLED_PATTERNS.filter((pattern) => pattern.match.test(code))
}
