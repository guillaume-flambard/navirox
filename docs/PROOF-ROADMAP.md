# Proof-journeys roadmap

This is the active execution order. It narrows, but does not rewrite, the
longer-horizon direction in `docs/repositioning/ROADMAP.md`. Do not begin a
later stage because its technology is attractive: its predecessor's exit is the
permission to start it.

## Program gates

| Stage                      | Outcome                                                                                                                  | Exit criteria                                                                                                                                                           | Explicitly not proven                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| P0: control and baseline   | One source-of-truth map and an executable, ordered backlog.                                                              | Charter and roadmap are linked from `AGENTS.md`; OpenSpec validates; baseline commands and known failures are recorded.                                                 | New runtime, adapter, migration, or public-install claims.                          |
| P1: Vue/Nuxt qualification | A pinned Baserow analysis yields a named, independent companion workflow and a reproducible source-to-workflow contract. | Immutable revision, findings used, scope, desktop-only remainder, synthetic-data policy, and acceptance actions are recorded.                                           | A Baserow app, partnership, or source-UI conversion.                                |
| P2: Vue/Nuxt companion     | The declared workflow has an original native companion whose generated and manual parts are traceable.                   | Fresh source analysis; no hidden web surface; every manual replacement, portable unit, and unsupported construct is listed; native build succeeds.                      | Visual parity or production readiness.                                              |
| P3: Vue/Nuxt device proof  | The same workflow passes declared acceptance steps on iOS and Android and produces retained evidence.                    | Device profiles, commands, artifacts, source/compiler provenance, results, limitations, and failures are published.                                                     | Broad Vue/Nuxt support or an external-product conversion.                           |
| P4: Angular qualification  | A pinned SuiteCRM analysis and instance-independent fixture produce one operational workflow contract.                   | The contract acknowledges dynamic routes/version limits, states the unknowns, and bounds a record update plus attachment-style workflow or an evidence-led replacement. | A SuiteCRM integration, authentication, offline sync, compliance, or visual parity. |
| P5: Angular companion      | The declared Angular workflow has an original native companion with honest source and manual-work provenance.            | Same P2 conditions, applied without framework logic leaking across the source or runtime seams.                                                                         | An Angular target compiler or general Angular screen transformation.                |
| P6: Angular device proof   | The Angular companion passes the same workflow contract on iOS and Android with durable evidence.                        | Same P3 conditions, plus known SuiteCRM benchmark uncertainty remains visible.                                                                                          | A claim that any real SuiteCRM instance works.                                      |
| P7: public proof release   | The two proofs can be communicated and reproduced within their actual distribution limits.                               | Public wording is reviewed against the pilot, fidelity, and release constraints; commands are reproducible; public-install status is stated accurately.                 | Public npm installation until a fresh consumer path is evidenced.                   |

## Per-journey definition of done

A journey is complete only when all of the following are true:

1. The analyzed benchmark revision is immutable and named in the evidence.
2. The chosen workflow is bounded, independently named, and has user intent,
   trigger, success state, data assumptions, non-goals, and acceptance actions,
   recorded per [`docs/WORKFLOW-EVIDENCE.md`](WORKFLOW-EVIDENCE.md) with a
   validation status and an explicit native-versus-alternative decision.
3. The companion is native and independent: no WebView fallback, copied brand
   assets, credentials, benchmark data, or unapproved connector is hidden in it.
4. The evidence separates generated output, safely migrated portable/shared
   units, and manual native work. Unsupported source behavior is named rather
   than approximated silently.
5. The workflow passes its declared automated acceptance path on both iOS and
   Android from a fresh build or install path.
6. The evidence records platform/device details, source and compiler
   provenance, executable commands, retained artifacts, result, limitations,
   and any unavailable run with its reason.
7. Any public wording stays within `docs/GO-TO-MARKET.md`, the applicable pilot
   brief, and `docs/VISUAL-FIDELITY.md`.

8. Its operational and accessibility conditions are recorded in
   [`docs/READINESS-MATRIX.md`](READINESS-MATRIX.md) with an outcome for each,
   and nothing deferred or excluded is presented as supported.

## Stop conditions

Stop the active stage and create a new, bounded proposal when any of these is
true: the workflow needs a real service or credential; a licensing or trademark
question affects distribution; a shared App Graph or public API change is needed;
a fixture no longer represents the benchmark finding; a device run is not
reproducible; or the work would imply visual-fidelity, installation, partnership,
or framework-support language beyond the evidence.

The next atomic implementation work is specified in
[`docs/OPENSPEC-BACKLOG.md`](OPENSPEC-BACKLOG.md).
