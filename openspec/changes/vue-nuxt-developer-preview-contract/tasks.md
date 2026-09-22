# Vue/Nuxt developer preview contract

## 1. Write the contract

- [x] 1.1 Add `docs/DEVELOPER-PREVIEW.md` with the verified boundary,
  acceptance bar, LLM policy and follow-up sequence. Verify statements link to
  evidence or are explicitly future gates.
- [x] 1.2 Add pointers from the execution charter and backlog. Verify agents
  selecting preview work reach this contract before implementation scope.

## 2. Validate the planning increment

- [x] 2.1 Run narrow formatting checks, `openspec validate
  vue-nuxt-developer-preview-contract --strict`, and `git diff --check`.
  Record results before archival.

## Follow-up changes, intentionally not implemented here

- [x] 3.1 Create `preview-ci-baseline` only after reading the failed CI log and
  linking a diagnosis to a job and commit. Done: CI run `35765671500` on
  `41a7b56` was diagnosed and repaired, and run `35774150595` on `abbefcb` is
  fully green; archived as `2026-09-22-preview-ci-baseline`.
- [x] 3.2 Create `preview-public-distribution` after the CI baseline is green.
  Done: it took the contract's retained-limitation branch and named the five
  unpublished packages; archived as `2026-09-22-preview-public-distribution`.
- [ ] 3.3 Create `preview-external-validation` after distribution is proven or
  its limitation is retained and checked, which satisfies this contract's
  dependency-ordered change 3 either way.
- [ ] 3.4 Create `deterministic-transform-validation` only with provenance,
  rollback, behavioural validation and a clean build check.
- [ ] 3.5 Create `optional-llm-assistance` only after the deterministic preview
  is independently useful, with suggestions opt-in, labelled and validated.
