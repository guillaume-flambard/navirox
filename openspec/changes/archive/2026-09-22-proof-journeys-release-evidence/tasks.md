# Tasks

## 1. Index the proofs

- [x] 1.1 Create a proof index that links each command, immutable input,
  artifact, limitation, and release status without duplicating evidence
  documents. Verify every cited artifact exists and every benchmark project has
  a row.
  - `docs/PROOF-INDEX.md` carries two journey rows (Vue: field record update,
    Angular: record update with attachment) and three benchmark rows (baserow,
    cal-com, suitecrm). Each row cites the command, the pinned revision, the
    artifact, the limitation and the release status, and every benchmark project
    in `benchmarks/catalog.json` has a row.
- [x] 1.2 Add a check that fails when a row cites a missing artifact, when a
  journey has no row, or when a status word is outside the declared vocabulary.
  Verify a seeded missing path and a seeded unknown status each fail.
  - `node scripts/check-proof-index.mjs` prints
    `proof index: 2 journeys and 3 benchmarks clean in docs/PROOF-INDEX.md` and
    exits 0. `packages/visual-benchmark/src/proof-index.test.ts` proves that a
    seeded missing artifact, a catalog project without a row and an unknown
    status each fail, and that the report names the class and the rule without
    echoing a value.

## 2. Review the public language

- [x] 2.1 Review the README and public-facing language against the pilot,
  marketing, visual, and installation constraints. Verify the reviewed files
  make no conversion, production, parity, partnership, or support claim.
  - `README.md` states that the product is pre-alpha and that a public
    `npm install` is not demonstrated; `docs/GETTING-STARTED.md` states that the
    published scaffolder writes `0.0.0` dependencies that `pnpm install` cannot
    resolve and points at the tarball path. Neither document claims conversion,
    production, visual parity, a partnership or support.

## 3. State the installation path

- [x] 3.1 Re-run the documented consumer installation path. If public npm
  remains incomplete, state that fact and publish only the verified tarball
  path. Verify the recorded command and its output.
  - `npm view` reports `@memolabs-apps/cli`, `@memolabs-apps/source-lit` and
    `@memolabs-apps/source-solid` as unpublished, while `create-navirox`
    resolves at 0.1.0 and `@memolabs-apps/runtime` at 0.1.0, so public package
    installation is incomplete. `docs/PROOF-INDEX.md` states that fact and names
    the packed tarballs of `pnpm test:e2e` as the only verified path.

## 4. Validate

- [x] 4.1 Run the documentation checks, the release verification, and
  `openspec validate proof-journeys-release-evidence --strict`. Verify all exit
  0.
  - `pnpm format:check` prints "All matched files use Prettier code style!" and
    exits 0; `pnpm test` completes 57 of 57 turbo tasks successfully, including
    the 7 proof-index cases; `openspec validate proof-journeys-release-evidence
    --strict` prints "Change 'proof-journeys-release-evidence' is valid" and
    exits 0. `node scripts/check-proof-index.mjs` prints "proof index: 2
    journeys and 3 benchmarks clean in docs/PROOF-INDEX.md" and exits 0. The
    release command itself (`pnpm release`) is out of scope, as publishing
    packages is excluded by this change.
