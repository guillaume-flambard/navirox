# Tasks

## 1. Define the selection record

- [x] 1.1 Add a workflow-evidence template under `docs/` that requires source
  provenance, actor/context, trigger, success state, friction measure,
  desktop-only remainder, alternative-path comparison, confidence, and known
  unknowns. Verify the template can be completed with no real credentials or
  customer data.

  `docs/WORKFLOW-EVIDENCE.md` holds the template and its boundaries. Every
  section asks for reproducible source provenance (upstream, full commit,
  source directory, reproducing command, machine readable report), a named actor
  and mobile context, trigger, success state with bounded data assumptions, a
  friction measure stated as a claim to test, the desktop-only remainder, the
  alternative-path comparison table and its decision, confidence and validation
  status, and known unknowns. The completed record at
  `docs/evidence/workflow-baserow-field-work.md` was filled in with no
  credential, no real record and original synthetic data only, so the template is
  demonstrably completable inside those boundaries.
- [x] 1.2 Add a decision rule that marks an unvalidated workflow hypothesis as
  such and prevents it from being described as customer demand. Verify the rule
  is linked from the proof roadmap and both pilot briefs.

  The rule is the `## Validation status rule` section of
  `docs/WORKFLOW-EVIDENCE.md`: an unvalidated hypothesis MUST be labelled as such
  and MUST NOT be described as customer demand, a user request or a validated
  need, a negative result is recorded the same way, and no record may claim
  validation from a public repository's structure, download count or issue
  tracker. It is linked from `docs/PROOF-ROADMAP.md` (per-journey definition of
  done item 2), `docs/pilots/baserow.md` and `docs/pilots/suitecrm.md`, each of
  which now points at the document and states that the workflow stays an
  `unvalidated hypothesis` until practitioner feedback exists.

## 2. Apply it to the Vue qualification gate

- [x] 2.1 Re-run the pinned Baserow diagnostic and complete one evidence record
  using only reproducible findings and original synthetic data. Verify the
  benchmark command succeeds and the record names its immutable input.

  `node scripts/benchmark-projects.mjs --project baserow` exited 0 and printed
  `baserow: nuxt, 46 routes, 41 screens` then `baserow: target diagnostic, 12
  screens compiled, 113 findings (unsupported-directive 20, unsupported-element
  41, unsupported-text 52), no file written`. The record
  `docs/evidence/workflow-baserow-field-work.md` names its immutable input
  (`https://github.com/baserow/baserow.git` at
  `81e094a1f4b3a62625c218d78fe319ba44098617`, source directory `web-frontend`,
  command `pnpm test:benchmarks -- --project baserow`, report
  `docs/evidence/vue-target-baserow-diagnostic.json`) and uses only those
  reproducible findings plus original synthetic data: one record, a small field
  set, one attachment, a local queue. The re-run also refreshed the machine
  readable diagnostic and the counts in `docs/evidence/vue-target-baserow-diagnostic.md`,
  which had become stale after the target compiler began refusing text it cannot
  render (61 findings and two supported screens before, 113 findings and one
  supported screen now).
- [x] 2.2 Compare the selected workflow against a PWA, WebView, and Capacitor
  using declared criteria such as offline need, device integration, interaction
  cost, and operational ownership. Verify the record reaches one explicit
  decision or says that no native proof should proceed.

  `docs/evidence/workflow-baserow-field-work.md` carries the comparison table
  across the four declared criteria and reaches one explicit decision: proceed
  with the independent native companion, because the two deciding criteria are
  offline queueing away from the desktop and camera attachment, the repository
  has an evidenced native path for both (device journeys and the capture harness
  run in continuous integration, and the secure store survives a relaunch on a
  device), Capacitor would keep the queue and storage in the web layer, and a
  WebView wrapper would present a desktop-shaped interface that the pinned
  analysis shows is largely outside the supported subset (one of twelve attempted
  screens compiles cleanly). The record states the decision is a hypothesis to be
  tested at the device-proof stage and that a PWA satisfying the offline and
  attachment needs would be the cheaper and better answer.

## 3. Make feedback safe and auditable

- [x] 3.1 Write a minimal voluntary interview guide and synthesis format for
  operator feedback. Verify it requests neither credentials nor customer data
  and separates direct observation from inference.

  `docs/OPERATOR-FEEDBACK.md` holds the consent and boundaries section (purpose
  stated, participation voluntary, no credentials, account access, customer data
  or real records requested or accepted, no audio or video without separate
  consent), six questions that ask what the operator does now rather than whether
  they would use an app, and the synthesis format whose `## Observations` and
  `## Inferences` are separate sections with each inference naming the
  observations it rests on. Its rules forbid committing a transcript, name,
  contact detail, employer or identifying quote, and cap the strongest claim at
  `practitioner-informed`.
- [x] 3.2 If feedback is authorized and obtained, record only anonymized
  synthesized findings; otherwise record the workflow as unvalidated. Verify no
  raw personal data or transcript is committed.

  No feedback was authorised or obtained, so
  `docs/evidence/workflow-baserow-field-work.md` records the workflow as an
  `unvalidated hypothesis` with `Practitioner feedback: None`, and that record is
  what the pilot briefs and the roadmap point at. `git status` shows no transcript
  or interview artifact: the only feedback-related file is the guide itself
  (`docs/OPERATOR-FEEDBACK.md`), which contains no personal data, and the
  committed record's known unknowns and confidence sections carry no name, contact
  detail or identifying quote.

## 4. Validate

- [x] 4.1 Run `pnpm format:check` and `openspec validate workflow-value-evidence
  --strict`. Verify both commands exit 0.

  `pnpm format:check` printed `All matched files use Prettier code style!` and
  exited 0; `openspec validate workflow-value-evidence --strict` printed
  `Change 'workflow-value-evidence' is valid` and exited 0. The validation also
  passed before implementation. Every task above was left unchecked until its
  stated command or artifact existed.
