# Tasks

## 1. Define the selection record

- [ ] 1.1 Add a workflow-evidence template under `docs/` that requires source
  provenance, actor/context, trigger, success state, friction measure,
  desktop-only remainder, alternative-path comparison, confidence, and known
  unknowns. Verify the template can be completed with no real credentials or
  customer data.
- [ ] 1.2 Add a decision rule that marks an unvalidated workflow hypothesis as
  such and prevents it from being described as customer demand. Verify the rule
  is linked from the proof roadmap and both pilot briefs.

## 2. Apply it to the Vue qualification gate

- [ ] 2.1 Re-run the pinned Baserow diagnostic and complete one evidence record
  using only reproducible findings and original synthetic data. Verify the
  benchmark command succeeds and the record names its immutable input.
- [ ] 2.2 Compare the selected workflow against a PWA, WebView, and Capacitor
  using declared criteria such as offline need, device integration, interaction
  cost, and operational ownership. Verify the record reaches one explicit
  decision or says that no native proof should proceed.

## 3. Make feedback safe and auditable

- [ ] 3.1 Write a minimal voluntary interview guide and synthesis format for
  operator feedback. Verify it requests neither credentials nor customer data
  and separates direct observation from inference.
- [ ] 3.2 If feedback is authorized and obtained, record only anonymized
  synthesized findings; otherwise record the workflow as unvalidated. Verify no
  raw personal data or transcript is committed.

## 4. Validate

- [ ] 4.1 Run `pnpm format:check` and `openspec validate workflow-value-evidence
  --strict`. Verify both commands exit 0.
