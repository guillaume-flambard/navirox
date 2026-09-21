## 1. Record the change

- [x] 1.1 Write the proposal, the `project-scaffolding` and `release-candidate` spec
      deltas, the design and these tasks. Verify with
      `openspec validate installable-release-candidate --strict`.

## 2. Give the release one version

- [x] 2.1 Write one changeset that names every publishable workspace at `patch`, so
      the release lands on `0.1.1` and not on the `0.2.0` the roadmap reserves for
      the router. Verify with `pnpm changeset status` listing all 31 (29 scoped
      `@memolabs-apps/*` plus `create-navirox` and `navirox`; the "29" in the
      proposal/design predates the `navirox` launcher and the 29th scoped package).
- [x] 2.2 Apply it with `pnpm version-packages`. Verify that every publishable
      manifest reads `0.1.1`, that each gained a changelog entry, and that the
      private root manifest still reads `0.0.0`.

## 3. Make the scaffolder write an installable version

- [x] 3.1 Read the released version from the scaffolder's own manifest at runtime and
      write that instead of `0.0.0` when no checkout is found. Verify by scaffolding
      into a temporary directory outside the repository and reading the manifest: the
      Navirox entries name `0.1.1`, not `0.0.0`.
- [x] 3.2 Reword the report so it names the arrangement it actually chose and the
      version it actually wrote. Verify by scaffolding once with a checkout above the
      target and once without, and reading both messages.
- [x] 3.3 Cover both branches with tests, since no existing test asserts the
      placeholder. Verify with `pnpm --filter create-navirox test`.

## 4. Pack the candidate and install it outside the workspace

- [x] 4.1 Build and pack the candidate: `pnpm build` then
      `node scripts/e2e-scaffold.mjs --bundle` from a clean destination. Verified:
      31 archives produced at `0.1.1`, the app installs with one copy of the
      runtime, both Metro bundles built (ios 6614 kB, android 6634 kB).
- [x] 4.2 Create an application from the packed artifacts in a directory outside the
      repository and drive `doctor`, `inspect`, `plan` and `migrate` from it.
      Verified: each command exits 0, transcript kept for the evidence report
      (`/tmp/navirox-rc42/transcript.txt`, app at the kept e2e workspace).

## 5. Write the release notes and the candidate evidence

- [x] 5.1 Write the release notes: prerequisites, what the candidate does, what stays
      manual, the publication sequence and the verification that follows publication.
      Verify that every capability named is one task 4 exercised, and that the
      sequence names issue #17 as the step that publishes and `npm view` as the check
      after it.
- [x] 5.2 Write `docs/evidence/release-candidate-0.1.1.md`: the candidate commit, the
      clean-install transcript, the command transcripts, the CI run for the same
      commit with the journey result per platform, the version and tag mismatch
      (the bare `0.1.0` names the abandoned scope), and the known gaps. Verify that
      the report names the commit its evidence belongs to.
- [x] 5.3 Update the onboarding documents where the version or the install story
      changed. Verify with `pnpm format:check`.

## 6. Tag the candidate

- [x] 6.1 Commit the work, then tag the candidate commit. Verify with
      `git tag --points-at HEAD` and confirm that every pre-existing tag still
      resolves to the commit it named before.
- [x] 6.2 Push the commit and the tag. Verify with `git ls-remote --tags origin`.

## 7. Verify

- [x] 7.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [ ] 7.2 Run `openspec validate installable-release-candidate --strict` and archive
      the change with `openspec archive installable-release-candidate --yes`.
