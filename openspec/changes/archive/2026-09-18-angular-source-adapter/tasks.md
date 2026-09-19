## 1. The adapter

- [x] 1.1 Create `packages/source-angular` with the package conventions, depending
      on the two neutral packages, and the tsconfig references. Verify with
      `pnpm --filter @memolabs-apps/source-angular build`.
- [x] 1.2 Implement detection over the manifest with evidence, and no throw on a
      missing or malformed one. Verify with the fixture and an empty directory.
- [x] 1.3 Implement decorator reading: components, injectables, pipes, and the
      module decorator as a finding. Verify that a file name alone decides nothing.
- [x] 1.4 Implement the state module decision: an injectable that holds reactive
      state is a state module, one that does not is a utility. Verify both with the
      fixture.
- [x] 1.5 Implement route reading from the routes file: top level paths as routes,
      children and lazy loading as findings. Verify with the fixture.
- [x] 1.6 Implement the capability scan, the dependencies, the version check and
      the fragment through the neutral mapper. Verify with the fixture.

## 2. The fixture and the gate

- [x] 2.1 Add the mirrored Angular fixture: the same journey as the Vue and Svelte
      fixtures, component for component and service for service.
- [x] 2.2 Add a negative fixture: a module declaration, an external template, a
      nested route.
- [x] 2.3 Extend the cross-adapter gate to compare the Angular report with the Vue
      one on unit kinds and capabilities. Verify that it fails when the mirror is
      broken on purpose.
- [x] 2.4 Confirm the four existing adapters are untouched by this change.

## 3. Wire and record

- [x] 3.1 Register the adapter at the composition root and add the package to the
      root `tsconfig.json` and the lockfile. Verify with a root `pnpm build`.
- [x] 3.2 Update `README.md`: the package table and the support matrix, with
      Angular at the level its inspection actually reaches.
- [x] 3.3 Record the gate outcome in `docs/evidence/`: what Angular needed, what it
      did not, and whether the model moved. Answer the question the change exists
      for rather than describing the change.

## 4. Verify

- [x] 4.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 4.2 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 4.3 Run `openspec validate angular-source-adapter --strict`.
