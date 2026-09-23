# repository-capability-manifest

## Why

The golden path `navirox transform` must decide whether a repository can be
transformed before it writes anything. Today discovery is implicit: the adapters
read files and the graph is built directly, so an ambiguous monorepo, an unknown
package manager or an out-of-range framework surfaces downstream instead of as a
deterministic preflight. This change makes discovery an explicit, versioned
artefact.

## What Changes

- Add a `RepositoryCapabilityManifest`: a versioned, hashed description of the
  repository, produced before any graph or generated output.
- Record topology (git roots, workspaces, packages, applications, generated
  directories, symlinks), package manager and lockfiles, resolved versions,
  framework candidates with confidence, configs and plugins, build entries,
  conventions and escape hatches.
- Classify the repository as `eligible`, `eligible-with-deltas`,
  `manual-discovery-required` or `refused`; only `eligible` may advance.
- Add fixtures: a conventional single package, a pnpm workspace, an Nx/Turborepo
  monorepo, a custom configuration that is refused, and a framework collision.

## Capabilities

### New Capabilities

- `repository-capability-manifest`: the deterministic preflight manifest and its
  eligibility decision, produced before any graph or generated output.

### Modified Capabilities

None.

## Impact

This adds the neutral package `@memolabs-apps/discovery` (no framework import, no
target import) and lists it in the root `tsconfig.json` references. It changes no
source adapter graph, no target provider, no runtime seam, no public
`@memolabs-apps/*` type name and no existing schema version.
