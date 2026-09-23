## 1. Define the matrix

- [ ] 1.1 Define the machine-readable matrix (framework, verified range, topology
  profile, admitted plugins/configs, constructs, escape hatches, target profiles,
  evidence, gate) beside the compatibility registry. Verify a schema test rejects
  a row that names no evidence.
- [ ] 1.2 Make each adapter read the matrix for its framework instead of
  hard-coding a version. Verify a boundary fixture at the edge of the verified
  range passes and one past it is refused.

## 2. Refuse outside the range

- [ ] 2.1 Return `outside-verified-range` with the fact, its location, the
  expected profile and a resumption path, and generate nothing. Verify a
  contract test across discovery, graph and diagnosis for an unverified major.

## 3. Build the corpus

- [ ] 3.1 Add positive, boundary and refused fixtures with lockfiles and config
  snapshots for Vue, Angular, React and Svelte. Verify a test asserts each
  verified line has its three fixtures.

## 4. Requalification

- [ ] 4.1 Write the requalification protocol and exercise it on a fixture for an
  unverified major (initially Vue 4). Verify the range stays unchanged and the
  refusal is deterministic.

## 5. Validate the build

- [ ] 5.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
- [ ] 5.2 Run `corepack pnpm exec openspec validate adapter-version-governance
  --strict`. Verify it exits 0.
