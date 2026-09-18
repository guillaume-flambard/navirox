## 1. The adapter

- [x] 1.1 Create `packages/source-react` with the package conventions, a dependency
      on the two neutral packages, and the tsconfig references. Verify with
      `pnpm --filter @navirox/source-react build`.
- [x] 1.2 Implement detection with the native runtime refusal, and prove all three
      outcomes: a web project matches, a native project does not, and a project
      without React does not throw.
- [x] 1.3 Implement component discovery by what a module exports, and prove that a
      file name alone decides nothing.
- [x] 1.4 Implement state module discovery by declaration, and prove that an import
      alone is not a store.
- [x] 1.5 Implement route reading from the router configuration, top level only,
      with children and lazy components as findings.
- [x] 1.6 Implement the capability scan, the dependencies, the native dependency
      finding, the version check and the fragment. Verify with the fixture.

## 2. The fixture and the gate

- [x] 2.1 Add the mirrored React fixture: the same journey, function components,
      a store module, storage, geolocation, an API call and a validated input.
- [x] 2.2 Add a negative fixture: a class component, nested routes, a native
      dependency.
- [x] 2.3 Extend the cross-adapter gate to compare the React report with the Vue
      one, and prove it fails when the mirror is broken on purpose.
- [x] 2.4 Prove the refusal directly: a fixture that declares React and the native
      runtime produces no candidate.

## 3. Wire and record

- [x] 3.1 Register the adapter at the composition root, and add the package to the
      root `tsconfig.json` and the lockfile. Verify with a root `pnpm build`.
- [x] 3.2 Update `README.md`: the package table and the support matrix.
- [x] 3.3 Record the gate outcome in `docs/evidence/`: did the model hold, and did
      the proximity to the target leak anywhere. Answer the question, do not
      describe the change.

## 4. Verify

- [x] 4.1 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 4.2 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 4.3 Run `openspec validate react-source-adapter --strict`.
