# Navirox execution charter

This is the operational entry point for agents. It turns the product direction
into the current, deliberately narrow program. It does not replace the product
definition or architectural boundaries.

## Authorized outcome

Before public communication, Navirox must have two complete and reproducible
proof journeys:

1. A Vue/Nuxt journey qualified against a pinned public Baserow revision.
2. An Angular journey qualified against a pinned public SuiteCRM revision.

Each journey must identify one bounded, high-value mobile workflow, produce an
independent native companion, run it on iOS and Android, and publish repeatable
evidence with explicit limitations. A benchmark is an analysis and
qualification input, never a customer, partner, endorsement, or permission to
copy its product, interface, assets, credentials, or data.

The companion is a focused native workflow, not a WebView and not a claim of
automatic full-screen conversion or visual parity. It may use synthetic data and
original assets. Any real-instance connector, customer data, credential, or
distribution work needs separate authority and must follow the relevant pilot
brief.

## Source of truth and conflict handling

Read sources in this order. A lower source can add detail only when it does not
contradict a higher one.

1. The task request and the hard rules in `AGENTS.md`. The runtime and source
   seams, package boundaries, safety rules, and evidence discipline are never
   negotiable within this repository.
2. This charter and the active OpenSpec change. This charter controls the active
   proof-journeys sequence. An active change controls its declared acceptance
   criteria, dependencies, and scope only.
3. `docs/repositioning/`. This is canonical product direction and the place to
   resolve identity, layer placement, and long-term architecture questions.
4. `docs/pilots/`, `docs/GO-TO-MARKET.md`, and `docs/VISUAL-FIDELITY.md`. They
   constrain benchmark use, commercial language, licensing, release claims, and
   visual evidence.
5. `PLAN.md`, `blueprint.md`, `docs/evidence/`, the executable code, and test
   output. These establish what is actually implemented. Prefer a fresh,
   reproducible run over an older narrative when they conflict.
6. README files and archived OpenSpec changes. They provide context, not a new
   product promise.

If a source is silent, preserve uncertainty. If sources disagree about current
behavior, run or inspect the smallest relevant verification and update evidence
instead of choosing the more optimistic claim. If the next task needs a new
shared contract, a new external dependency, a real service, credentials, legal
review, or a public claim, stop and open a bounded OpenSpec proposal rather than
expanding the task.

## Verified now, not inferred

| Area            | Verified state                                                                                                   | Do not infer                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Source analysis | Vue, Nuxt, and Angular inspection and planning exist behind the source seam.                                     | That a source screen can be emitted as a native screen.                            |
| Migration       | `navirox migrate` safely copies only explicitly shared or portable units.                                        | That it converts a web view or that moved code runs without adaptation.            |
| Native proof    | Native runtime and device-capture infrastructure exist; the capture harness has evidence on the records fixture. | Measured visual fidelity, parity, or an external application's mobile conversion.  |
| Benchmarks      | Baserow and SuiteCRM inputs are pinned public revisions with published bounded diagnostics.                      | A relationship, endorsement, client work, or permission to reuse branding or data. |
| Distribution    | A packed-tarball install path is evidenced. Public npm installation is incomplete.                               | That `npx navirox` works for a fresh public consumer.                              |

Read the linked evidence before repeating a number or a behavior: Baserow
diagnostic, SuiteCRM diagnostic, native capture report, and release-candidate
report live under `docs/evidence/`.

## Decision rules

- Put source syntax and framework behavior in `source-*`; put generic planning,
  migration, and evidence behavior in neutral packages; put renderer behavior at
  the runtime/provider edge. Use `docs/repositioning/AGENT-GUIDE.md` section 4
  when placement is unclear.
- Keep a decision `unknown` or `manual` until deterministic evidence justifies a
  stronger classification. Parsing is not portability.
- Pin every external input by immutable revision and record the command, input,
  result, platform, and known exclusions needed to reproduce a claim.
- A workflow is eligible only when it has a named user, trigger, success result,
  bounded data/API assumptions, explicit desktop-only remainder, and automated
  acceptance steps on both platforms.
- Never turn benchmark findings into a statement about the benchmark owner's
  product. Say "Baserow-shaped" or "SuiteCRM-shaped" only for an independent,
  original fixture where the pilot brief permits it.
- Treat visual evidence as a separate gate. Captures alone are measurements;
  `docs/VISUAL-FIDELITY.md` defines when a scoped fidelity statement is allowed.

## How to execute

1. Choose only the next unblocked item in `docs/OPENSPEC-BACKLOG.md`.
2. Read its dependency evidence and create or continue exactly that OpenSpec
   change. Do not combine Vue and Angular work or add a new framework to make a
   proof look more general.
3. Implement one observable increment. Keep the workspace buildable and run the
   task's stated checks before marking it complete.
4. Record facts in `docs/evidence/` and limitations beside the relevant pilot
   brief or release-proof document. Do not change status language without the
   evidence the document requires.
5. Validate the OpenSpec change strictly, then archive it only when every task
   has its own completed verification.

The staged exits and the proposed change sequence are in
[`docs/PROOF-ROADMAP.md`](PROOF-ROADMAP.md) and
[`docs/OPENSPEC-BACKLOG.md`](OPENSPEC-BACKLOG.md).
