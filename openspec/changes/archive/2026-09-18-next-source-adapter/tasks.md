## 1. Add the Next adapter

- [x] 1.1 Create `packages/source-next` with the package conventions, depending on
      the neutral packages and on `@navirox/source-react`, declaring that it
      composes the React adapter, and referencing the three in its tsconfig.
      Verify with `pnpm --filter @navirox/source-next build`.
- [x] 1.2 Implement detection over the manifest with evidence, and the refusal of a
      project that declares a native dependency. Verify with three fixtures: a Next
      project, a plain React project, and a project that declares a native
      dependency.
- [x] 1.3 Implement the App Router reading: page files, directory paths, index
      files, dynamic segments and route groups. Verify with the fixture and a table
      of expected patterns.
- [x] 1.4 Implement the Pages Router reading on the same rules. Verify with the
      fixture.
- [x] 1.5 Implement layout units and the module boundary metadata. Verify that the
      boundary produces no finding and that the layout is a unit of the layout
      kind.
- [x] 1.6 Implement the findings for API routes, the middleware and the
      configuration file. Verify with the negative fixture.
- [x] 1.7 Implement the fragment through the neutral mapper with this adapter's
      identifier, and prove determinism with two inspections.

## 2. Extend the gate

- [x] 2.1 Register the adapter at the composition root and confirm the registry
      lists seven adapters. Verify with the CLI tests.
- [x] 2.2 Add the Next comparison to the gate: the same capability set as Vue, the
      same three unit kinds, and the layout as the only addition, named. Verify
      with `pnpm --filter @navirox/cli test`.
- [x] 2.3 Prove the comparison can fail: break one fixture capability, confirm the
      test names the missing capability, and restore it.

## 3. Position and record

- [x] 3.1 Add the package to the root `tsconfig.json` references and to
      `pnpm-lock.yaml`. Verify with a root `pnpm build`.
- [x] 3.2 Update `README.md`: the package table gains the adapter and the matrix
      moves Next.
- [x] 3.3 Record the reading in `docs/evidence/`, including what the module
      boundary is and is not, and what the adapter refuses to read.

## 4. Verify

- [x] 4.1 Run the full gate.
- [x] 4.2 Confirm the acceptance app is untouched and its Detox journey still
      passes locally on both platforms.
- [x] 4.3 Run `openspec validate next-source-adapter --strict`.
