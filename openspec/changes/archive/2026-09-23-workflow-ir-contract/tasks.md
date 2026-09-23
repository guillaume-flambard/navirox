## 1. Create the package

- [x] 1.1 Create `packages/workflow` (package.json, tsconfig.json) and add it to
  the root `tsconfig.json` references. Done: the package exists with no runtime
  dependency, `corepack pnpm build` reports 35/35 tasks, and the root
  `tsconfig.json` lists `./packages/workflow`.

## 2. Define the IR

- [x] 2.1 Define the versioned types (`Workflow`, `Screen`, `ViewNode`,
  `Binding`, `Action`, `StateModel`, `LayoutConstraint`, `StyleToken`,
  `Resource`, `Coverage`) with no framework, target or renderer name. Done:
  `src/index.ts` declares them with `WORKFLOW_IR_SCHEMA_VERSION` and imports only
  `node:crypto`, and the test asserts that single import.
- [x] 2.2 Define the stable serialization, its hash and the provenance reference
  on every node. Done: `serializeWorkflow` writes a fixed field order and
  `hashWorkflow` hashes it; the test asserts two serializations are byte-identical
  with equal hashes, and that a node's source survives a round trip.

## 3. Enforce coverage

- [x] 3.1 Add validation that refuses a workflow with an uncovered node. Done:
  `validateWorkflow` reports `unknown-coverage` for the refused fixture while the
  positive and boundary fixtures validate.
- [x] 3.2 Refuse an unknown schema version with an error naming it. Done:
  `parseWorkflow` throws `WorkflowIrError` naming version 99 in the test.

## 4. Fixtures

- [x] 4.1 Add the positive, boundary and refused fixtures. Done: the three
  fixtures live in `src/index.test.ts` and each produces its expected outcome.

## 5. Validate the build

- [x] 5.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Done: build 35/35, test 62/62, lint exits 0
  and every file is formatted.
- [x] 5.2 Run `corepack pnpm exec openspec validate workflow-ir-contract
  --strict`. Done: it exits 0 after the last edit.
