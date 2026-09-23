## 1. Declare the capability

- [x] 1.1 Add the `llm-assistance` spec delta with its six requirements. Done:
  `specs/llm-assistance/spec.md` carries the six requirements and
  `corepack pnpm exec openspec validate optional-llm-assistance --strict`
  reports the change valid.
- [x] 1.2 Confirm the preview contract's LLM policy and its change 6 name the
  declared capability. Done: `docs/DEVELOPER-PREVIEW.md` states the policy
  (opt-in, labelled, never a decision, no source upload) and its change 6 is
  `optional-llm-assistance`, which is this change.

## 2. Prove the opt-in gate

- [x] 2.1 A plan without the flag constructs no judge and requests no suggestion.
  Done: `packages/cli/src/plan.test.ts` "asks nothing when the rules decided
  everything" (code 0, `judge.calls` 0, output `no judgment was requested`) and
  `packages/planner/src/semantics.test.ts` "requests nothing when the plan
  decided everything" (`judge.calls` 0).
- [x] 2.2 Assistance with no key fails readably and produces no suggestion. Done:
  `packages/planner/src/semantics.test.ts` "refuses without an API key, before
  any network" throws `MissingTypesafeKeyError`, and
  `packages/cli/src/plan.test.ts` "fails readably when no key is configured"
  exits 1 with `TYPESAFE_API_KEY` on stderr.

## 3. Prove a suggestion never decides

- [x] 3.1 Only `manual` and `unknown` subjects are submitted and a decided
  subject is never submitted. Done: "submits only the manual and unknown
  subjects in one request" asserts one call whose subjects are exactly the
  undecided ones.
- [x] 3.2 An answer outside the plan's class set is reported as `unknown` and
  never accepted. Done: "answers unknown honestly when the judge answer is
  unusable" asserts two suggestions, each `unknown` and `low`, with the
  `unusable` message.
- [x] 3.3 A suggestion leaves the plan's decision unchanged and is
  distinguishable in machine output. Done: `packages/cli/src/plan.test.ts`
  "leaves every plan decision unchanged and keeps the suggestions separate"
  compares the decisions with and without `--semantic` and finds `semantic`
  beside them, model `jev-latest`.
- [x] 3.4 The submitted state carries names and kinds and no file content, and
  the rendered output is labelled and names the model. Done:
  `packages/planner/src/semantics.test.ts` "submits names and kinds only, never a
  file body" asserts every submitted key is a name or a kind, and
  `packages/cli/src/plan.test.ts` "labels the second opinion and names the model
  in the human report" asserts the `Second opinions` heading carries
  `jev-latest`.

## 4. Validate the build

- [x] 4.1 Run `corepack pnpm build`, `corepack pnpm format:check`,
  `corepack pnpm lint`, and the planner and cli test suites. Done: build 33/33
  tasks, format clean, lint clean, planner 23 tests and cli 116 tests pass.
- [x] 4.2 Run `corepack pnpm exec openspec validate optional-llm-assistance
  --strict`. Done: it exits 0 and reports the change valid.
