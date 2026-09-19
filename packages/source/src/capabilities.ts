import type { CapabilityUsage } from '@memolabs-apps/graph'

/**
 * The browser capabilities any adapter can look for.
 *
 * This lives in the neutral package because it describes the browser, not a
 * framework: it was written inside the first adapter and moved here the moment a
 * second adapter needed it, which is the rule the seam declares for admitting a
 * concept to the core. Two copies would have let two adapters disagree about the
 * same file.
 *
 * The set is declared rather than inferred, because a report that says "nothing
 * found" is only honest when the reader can see what was looked for. A pattern
 * carries the usage it implies: writing to local storage and reading from it are
 * different migration problems, and a bare reference to a capability tells us
 * only that it is used, which is what `unknown` is for.
 *
 * Patterns for one capability are ordered. The first match on a line wins, and
 * the deliberately loose pattern sits last as a fallback, so `localStorage` alone
 * is reported as unknown rather than pretending the direction was read.
 *
 * A pattern whose platform spelling is a property of a global has to name that
 * global, or it reads any identifier that shares the name. `location` is the case
 * that proved it: a line binding a local called `location` from a framework's
 * router hook was reported as browser navigation, twice per file, in projects that
 * navigate nowhere. The fallback stays for the platform object, narrower than the
 * name, because a report that says "nothing found" is only honest where nothing
 * was looked for.
 */
export interface CapabilityPattern {
  readonly capability: string
  readonly usage: CapabilityUsage
  readonly match: RegExp
}

/** Web storage behaves the same way twice, so the two sets are written once. */
function storagePatterns(
  name: 'localStorage' | 'sessionStorage',
  capability: string,
): CapabilityPattern[] {
  return [
    {
      capability,
      usage: 'write',
      match: new RegExp(`${name}\\s*\\.\\s*(setItem|removeItem|clear)\\s*\\(`),
    },
    {
      capability,
      usage: 'read',
      match: new RegExp(`${name}\\s*\\.\\s*(getItem|key|length)`),
    },
    { capability, usage: 'unknown', match: new RegExp(`\\b${name}\\b`) },
  ]
}

/**
 * DOM access is separate because it matches almost anything.
 *
 * `window.localStorage.setItem` is both DOM access and a storage write, and
 * reporting both would double count the same line and make the report noisier
 * than the project. DOM access is therefore only reported for a line that no
 * more specific capability explained.
 */
export const DOM_PATTERNS: readonly CapabilityPattern[] = [
  { capability: 'dom', usage: 'unknown', match: /\bdocument\s*\./ },
  { capability: 'dom', usage: 'unknown', match: /\bwindow\s*\./ },
]

export const CAPABILITY_PATTERNS: readonly CapabilityPattern[] = [
  ...storagePatterns('localStorage', 'local-storage'),
  ...storagePatterns('sessionStorage', 'session-storage'),

  {
    capability: 'geolocation',
    usage: 'invoke',
    match: /geolocation\s*\.\s*(getCurrentPosition|watchPosition)\s*\(/,
  },
  { capability: 'geolocation', usage: 'unknown', match: /\bgeolocation\b/ },

  { capability: 'clipboard', usage: 'read', match: /clipboard\s*\.\s*read(Text)?\s*\(/ },
  { capability: 'clipboard', usage: 'write', match: /clipboard\s*\.\s*write(Text)?\s*\(/ },
  { capability: 'clipboard', usage: 'unknown', match: /\bclipboard\b/ },

  { capability: 'share', usage: 'invoke', match: /\bnavigator\s*\.\s*share\s*\(/ },

  {
    capability: 'notifications',
    usage: 'invoke',
    match: /\bNotification\s*\.\s*requestPermission\s*\(|new\s+Notification\s*\(/,
  },
  { capability: 'notifications', usage: 'unknown', match: /\bNotification\b/ },

  { capability: 'media-capture', usage: 'invoke', match: /\bgetUserMedia\s*\(|\bMediaRecorder\b/ },

  {
    capability: 'permissions',
    usage: 'invoke',
    match: /\bnavigator\s*\.\s*permissions\s*\.\s*query\s*\(/,
  },

  {
    capability: 'file-reading',
    usage: 'read',
    match:
      /\bFileReader\b|readAs(Text|DataURL|ArrayBuffer|BinaryString)\s*\(|type\s*=\s*['"]file['"]/,
  },

  { capability: 'canvas', usage: 'render', match: /getContext\s*\(/ },
  { capability: 'canvas', usage: 'unknown', match: /\bHTMLCanvasElement\b/ },

  { capability: 'timers', usage: 'invoke', match: /\b(setTimeout|setInterval|setImmediate)\s*\(/ },
  { capability: 'timers', usage: 'read', match: /\b(clearTimeout|clearInterval)\s*\(/ },

  { capability: 'animation-frame', usage: 'render', match: /\brequestAnimationFrame\s*\(/ },
  { capability: 'animation-frame', usage: 'read', match: /\bcancelAnimationFrame\s*\(/ },

  { capability: 'url-navigation', usage: 'invoke', match: /\bwindow\s*\.\s*open\s*\(/ },
  {
    capability: 'url-navigation',
    usage: 'write',
    match: /\bwindow\s*\.\s*location\s*\.\s*(href|assign|replace)/,
  },
  {
    capability: 'url-navigation',
    usage: 'write',
    match: /\blocation\s*\.\s*(href|assign|replace)/,
  },
  { capability: 'url-navigation', usage: 'unknown', match: /\bwindow\s*\.\s*location\b/ },

  { capability: 'network-state', usage: 'read', match: /\bnavigator\s*\.\s*(onLine|connection)\b/ },

  {
    capability: 'observers',
    usage: 'render',
    match: /new\s+(IntersectionObserver|ResizeObserver|MutationObserver)\s*\(/,
  },

  { capability: 'media-query', usage: 'read', match: /\bmatchMedia\s*\(/ },

  {
    capability: 'network-request',
    usage: 'invoke',
    match: /\bfetch\s*\(|\bXMLHttpRequest\b/,
  },
  {
    // The framework spellings of the same thing. A data helper is a network
    // request, so it is reported through the shared vocabulary rather than as a
    // capability of its own: two projects that both fetch data should be
    // comparable, whatever their framework calls it.
    capability: 'network-request',
    usage: 'invoke',
    match: /\buse(Fetch|LazyFetch|AsyncData|LazyAsyncData)\s*\(|\$fetch\s*\(/,
  },
]

/** Every capability name this adapter can report, in a stable order. */
export const DECLARED_CAPABILITIES: readonly string[] = [
  ...new Set(CAPABILITY_PATTERNS.map((pattern) => pattern.capability)),
].sort()

export interface CapabilityMatch {
  readonly capability: string
  readonly usage: CapabilityUsage
  /** 1-based line in the file the text came from. */
  readonly line: number
}

/**
 * Blanks out comments while keeping every newline.
 *
 * Line numbers are the point, so a removed comment has to leave its newlines
 * behind. The cost is that a `//` inside a string literal starts a fake comment,
 * which can only hide a match rather than invent one.
 */
export function stripComments(text: string): string {
  const blank = (match: string): string => match.replace(/[^\n]/g, '')
  return text
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, '')
}

/**
 * Finds the capabilities a source text uses, one entry per capability per line.
 *
 * A capability is reported once per line at most, using the first pattern that
 * matched for it, so a line that both reads and writes is reported by whichever
 * the pattern order put first rather than twice.
 */
export function scanCapabilities(text: string): CapabilityMatch[] {
  const matches: CapabilityMatch[] = []
  const lines = stripComments(text).split('\n')

  lines.forEach((line, index) => {
    const seen = new Set<string>()
    let specific = false

    for (const pattern of CAPABILITY_PATTERNS) {
      if (seen.has(pattern.capability)) {
        continue
      }

      if (pattern.match.test(line)) {
        seen.add(pattern.capability)
        specific = true
        matches.push({ capability: pattern.capability, usage: pattern.usage, line: index + 1 })
      }
    }

    if (!specific) {
      for (const pattern of DOM_PATTERNS) {
        if (pattern.match.test(line)) {
          matches.push({ capability: pattern.capability, usage: pattern.usage, line: index + 1 })
          break
        }
      }
    }
  })

  return matches
}
