/**
 * The verified consumer installation path and its stated limitation.
 *
 * docs/GETTING-STARTED.md and docs/DEVELOPER-PREVIEW.md name one verified
 * consumer installation path, the packed tarballs of `pnpm test:e2e`, and state
 * a specific public-installation limitation: several packages the documented
 * public `npx navirox` path needs are not served by the registry.
 *
 * This module is the machine-readable twin of that statement. It declares the
 * packages the documented public path names, the subset the documentation
 * currently states as unpublished, and a check that fails when the registry and
 * the documentation disagree. A package that is stated as unpublished but is in
 * fact served, or a package the documented path needs but that is neither served
 * nor stated as missing, both fail: the limitation is never allowed to drift out
 * of date silently.
 *
 * Findings carry a package name, because the name is what a reader needs to fix
 * the gap. They never carry a version or a registry response body.
 */

export const VERIFIED_INSTALLATION_PATH = 'pnpm test:e2e (packed tarballs)'

export const DOCUMENTED_PATH_DOCUMENTS = ['docs/GETTING-STARTED.md', 'docs/DEVELOPER-PREVIEW.md']

/** Every package the documented public `npx navirox` path needs. */
export const DOCUMENTED_PACKAGES = [
  'navirox',
  '@memolabs-apps/cli',
  '@memolabs-apps/source-lit',
  '@memolabs-apps/source-solid',
  '@memolabs-apps/target-vue',
  '@memolabs-apps/visual-benchmark',
]

/**
 * The packages the documentation currently states as not served by the
 * registry. Changing this list is how the limitation is updated; the check
 * fails until the list matches what the registry actually serves.
 */
export const STATED_UNPUBLISHED = [
  'navirox',
  '@memolabs-apps/cli',
  '@memolabs-apps/source-lit',
  '@memolabs-apps/source-solid',
  '@memolabs-apps/target-vue',
  '@memolabs-apps/visual-benchmark',
]

export const FINDING_CLASSES = {
  statedButServed: 'stated-unpublished-but-served',
  neededButNotServed: 'needed-but-not-stated-unpublished',
}

/**
 * Resolves a package name to a published version, or null when the registry does
 * not serve it. Injected so the check can be tested without the network.
 */
export async function resolvePublishedVersion(name) {
  const { execFileSync } = await import('node:child_process')
  try {
    const output = execFileSync('npm', ['view', name, 'version', '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    return output.trim().replace(/^"|"$/g, '') || null
  } catch {
    return null
  }
}

/**
 * Compares what the registry serves against what the documentation states.
 * Returns one finding per disagreement, so an accurate limitation passes and a
 * drifted one fails.
 */
export async function checkPublicDistribution({
  packages = DOCUMENTED_PACKAGES,
  stated = STATED_UNPUBLISHED,
  resolve = resolvePublishedVersion,
} = {}) {
  const statedSet = new Set(stated)
  const findings = []
  for (const name of packages) {
    const served = (await resolve(name)) !== null
    if (statedSet.has(name) && served) {
      findings.push({ class: FINDING_CLASSES.statedButServed, name })
    } else if (!statedSet.has(name) && !served) {
      findings.push({ class: FINDING_CLASSES.neededButNotServed, name })
    }
  }
  return findings
}

export function formatFindings(findings) {
  return findings.map((finding) => `${finding.class}: ${finding.name}`)
}

export function formatPublicDistribution(findings) {
  if (findings.length === 0) {
    return `public distribution: ${DOCUMENTED_PACKAGES.length} documented packages match the stated limitation (${STATED_UNPUBLISHED.length} unpublished)`
  }
  return [
    `public distribution: ${findings.length} disagreement(s) between the registry and the documentation`,
    ...formatFindings(findings).map((line) => `  ${line}`),
    `Update the stated limitation, the documents, or the registry so they agree. The verified installation path is ${VERIFIED_INSTALLATION_PATH}.`,
  ].join('\n')
}
