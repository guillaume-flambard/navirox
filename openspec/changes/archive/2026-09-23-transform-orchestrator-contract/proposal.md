# transform-orchestrator-contract

## Why

Discovery, the version gate, the Workflow IR and the source/target seam each
exist, but nothing sequences them into `navirox transform`. Without a deep
orchestration contract, every new stage would be wired ad hoc in the CLI, partial
writes would be possible, and a refusal would not guarantee an untouched output.

## What Changes

- Specify the deep module `transform({ root, app, profile, output }) ->
  TransformResult` as the one entry point that sequences discovery, eligibility,
  inspect/plan, lowering, emission, migration of approved units, provenance and
  scaffold.
- Make dry-run the default: nothing is written unless the caller explicitly asks
  for a write, and a refusal at any stage leaves the output path untouched.
- Refuse path traversal, an output inside the source tree, a partial write after
  a refusal, and an ambiguous profile, each with a finding rather than a best
  effort.
- Introduce the output layout `generated/`, `shared/`, `manual/`,
  `navirox.manifest.json` and a delta report that separates generated, migrated
  and manual work.
- Wire a `navirox transform` CLI command to that deep module, using a fake source
  and a fake target in tests so the path is proven before a real framework
  lowering exists.

## Capabilities

### New Capabilities

- `transform-orchestrator`: the contract of the deep transform module and its
  CLI surface, covering sequencing, refusal-before-write, output layout and
  manifest.

### Modified Capabilities

None.

## Impact

Touches `@memolabs-apps/cli` (the deep module, argument parsing and dispatch)
and its workspace dependencies (`discovery`, `source`, `workflow`, `migrate`,
`planner`, `inspect`). It does not change the graph, any adapter public API, the
runtime seam, or the lowering/emission contracts. No public claim about Vue or
any other framework coverage: this change only proves the orchestration path
with fakes.
