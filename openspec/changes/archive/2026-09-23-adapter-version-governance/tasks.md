## 1. Define the matrix

- [x] 1.1 Define the machine-readable matrix (framework, verified range, topology
  profile, admitted plugins/configs, constructs, escape hatches, target profiles,
  evidence, gate) beside the compatibility registry. Verify a schema test rejects
  a row that names no evidence.
- [x] 1.2 Make each adapter read the matrix for its framework instead of
  hard-coding a version. Done: the gate lives in
  `packages/source/src/version-gate.ts` (`checkVerifiedRange`, line 47) and is
  applied by `packages/inspect/src/inspect.ts` (lines 135-139) with
  `verifiedVersions: governing.flatMap((row) => row.verifiedVersions)`, so the
  decision comes from the matrix. The boundary behaviour is asserted by
  `packages/inspect/src/version-governance.test.ts` (`version-positive` and
  `version-boundary` pass, `version-refused` is refused, lines 84-189) and
  `packages/source/src/version-gate.test.ts` (lines 9-26).

## 2. Refuse outside the range

- [x] 2.1 Return `outside-verified-range` with the fact, its location, the
  expected profile and a resumption path, and generate nothing. Verify a
  contract test across discovery, graph and diagnosis for an unverified major.

## 3. Build the corpus

- [x] 3.1 Add positive, boundary and refused fixtures with lockfiles and config
  snapshots for Vue, Angular, React and Svelte. Verify a test asserts each
  verified line has its three fixtures.

## 4. Requalification

- [x] 4.1 Write the requalification protocol and exercise it on a fixture for an
  unverified major (initially Vue 4). Verify the range stays unchanged and the
  refusal is deterministic.

## 5. Validate the build

- [x] 5.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Done: after merging this change and
  correcting the out-of-perimeter CLI expectation, `corepack pnpm build` reports
  34/34, `corepack pnpm test` 61/61, `corepack pnpm lint` exits 0 and
  `corepack pnpm format:check` reports every file formatted.
- [x] 5.2 Run `corepack pnpm exec openspec validate adapter-version-governance
  --strict`. Verify it exits 0.
