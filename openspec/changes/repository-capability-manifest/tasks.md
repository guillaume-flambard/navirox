## 1. Create the package

- [ ] 1.1 Create `packages/discovery` (package.json, tsconfig.json) and add it to
  the root `tsconfig.json` references. Verify `corepack pnpm build` builds it.

## 2. Define the manifest

- [ ] 2.1 Define the versioned `RepositoryCapabilityManifest` schema, the fact
  shape (`value`, `location`, `confidence`), the topology record and the
  eligibility union. Verify a serialization fixture is stable and a hash is
  deterministic.
- [ ] 2.2 Define the injected reader interface (`files`, `readText`) and the
  discovery entry point. Verify the module never touches the filesystem itself.

## 3. Classify

- [ ] 3.1 Implement the classification (`eligible`, `eligible-with-deltas`,
  `manual-discovery-required`, `refused`) with enumerated deltas. Verify a
  positive fixture is `eligible`, a delta fixture is `eligible-with-deltas` with
  its deltas listed, and a refused fixture stops.
- [ ] 3.2 Detect the package manager and lockfiles for pnpm, npm, Yarn and Bun,
  and the workspace declarations for Nx and Turborepo. Verify a fixture per
  family.

## 4. Fixtures

- [ ] 4.1 Add the positive, boundary and refused fixtures: a conventional single
  package, a pnpm workspace, an Nx/Turborepo monorepo, a custom configuration
  refused and a framework collision. Verify each produces the expected
  classification.

## 5. Validate the build

- [ ] 5.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
- [ ] 5.2 Run `corepack pnpm exec openspec validate
  repository-capability-manifest --strict`. Verify it exits 0.
