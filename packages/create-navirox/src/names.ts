/**
 * One app name in, three identities out.
 *
 * A native app carries the same name in three shapes that do not accept each
 * other: a directory and npm name (lowercase, hyphenated), a display label a
 * person reads, and a reverse-DNS bundle identity that Android and iOS both
 * key on. Deriving all three here, from one string, is what lets the rest of
 * the scaffolder do plain text substitution instead of guessing per file.
 */

/** The identifiers a scaffolded app needs, all derived from the name given. */
export interface IAppNames {
  /** Directory and npm name, lowercase and hyphenated. For example `my-app`. */
  readonly dirName: string
  /** Label under the icon. For example `My App`. */
  readonly displayName: string
  /** Reverse-DNS identity shared by both platforms. For example `dev.navirox.myapp`. */
  readonly packageId: string
  /** PascalCase identity: the React Native app key and the iOS target. For example `MyApp`. */
  readonly pascalName: string
}

/** Thrown when a name cannot become a valid npm name or bundle identity. */
export class InvalidAppNameError extends Error {
  public constructor(rawName: string) {
    super(
      `"${rawName}" cannot be used as an app name. ` +
        'Use letters and digits, for example "my-app" or "My App".',
    )
    this.name = 'InvalidAppNameError'
  }
}

/**
 * Splits a name into lowercase words, so that `my-app`, `MyApp` and `my app`
 * all describe the same app rather than three different ones.
 */
function splitWords(rawName: string): readonly string[] {
  return rawName
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase())
}

/** `app` becomes `App`, `my` becomes `My`. */
function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/**
 * Derives every identity a scaffold needs from one name.
 *
 * Two normalisations are deliberate rather than incidental. A bundle segment
 * cannot start with a digit, so a name that does gets an `app` prefix instead
 * of failing. And the display name keeps the words separated while the npm name
 * joins them with hyphens, because a person reads one and a resolver reads the
 * other.
 */
export function deriveNames(rawName: string): IAppNames {
  const words = splitWords(rawName)
  if (words.length === 0) {
    throw new InvalidAppNameError(rawName)
  }

  const dirName = words.join('-')
  const pascalName = words.map(capitalize).join('')
  const slug = words.join('')
  const safeSlug = /^[0-9]/.test(slug) ? `app${slug}` : slug

  return {
    dirName,
    displayName: rawName.trim(),
    packageId: `dev.navirox.${safeSlug}`,
    pascalName,
  }
}

/** True when `derived.dirName` is usable as an npm package name. */
export function isValidDirName(dirName: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(dirName) && !dirName.endsWith('-')
}
