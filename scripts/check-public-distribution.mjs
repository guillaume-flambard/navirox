#!/usr/bin/env node
/**
 * Checks that the registry and the documented public-installation limitation
 * agree.
 *
 * docs/GETTING-STARTED.md and docs/DEVELOPER-PREVIEW.md name the packed tarballs
 * of `pnpm test:e2e` as the verified consumer installation path and state a
 * specific public limitation: several packages a documented `npx navirox` path
 * needs are not served by the registry. This command resolves each documented
 * package and fails when the registry and the documentation disagree, so the
 * limitation cannot drift out of date without a failure. A non-zero exit blocks
 * the release that would follow.
 */
import {
  DOCUMENTED_PACKAGES,
  checkPublicDistribution,
  formatPublicDistribution,
} from './lib/public-distribution.mjs'

const findings = await checkPublicDistribution({ packages: DOCUMENTED_PACKAGES })

console.log(formatPublicDistribution(findings))

if (findings.length > 0) {
  process.exit(1)
}
