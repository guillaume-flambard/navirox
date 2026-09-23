# adapter-version-governance

## Why

A framework name in a manifest is not a compatibility claim. Today an adapter
detects a framework from a dependency range and the graph is built, so a project
on an unverified major or with an unknown plugin looks as supported as a verified
one. This change makes support a versioned, evidenced matrix and refuses a
profile that is outside it.

## What Changes

- Add a machine-readable compatibility matrix per adapter: framework, verified
  versions, topology profiles, admitted plugins and configs, covered constructs,
  escape hatches, target profiles, evidence and gate.
- Add a positive, a boundary and a refused corpus with lockfiles and config
  snapshots for Vue, Angular, React and Svelte.
- Add a contract suite across discovery, graph and diagnosis for an
  out-of-range version.
- Return `outside-verified-range` with an alternative and no generation for an
  unverified version, and define a requalification protocol for an upstream
  major.

## Capabilities

### New Capabilities

- `adapter-version-governance`: the evidenced compatibility matrix that decides
  which framework versions a profile may transform.

### Modified Capabilities

None.

## Impact

This touches `@memolabs-apps/source`, `@memolabs-apps/inspect` and
`@memolabs-apps/compat` (matrix, corpus, contract suite) plus adapter fixtures.
It changes no source adapter graph shape, no target provider, no runtime seam, no
public `@memolabs-apps/*` type name and no existing schema version.
