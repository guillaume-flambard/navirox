# Operator feedback

A short, voluntary conversation can tell a proof journey whether a workflow
hypothesis is worth building. This document defines the smallest question set that
does that and the synthesis format that keeps it usable in
[`docs/WORKFLOW-EVIDENCE.md`](WORKFLOW-EVIDENCE.md).

Feedback is optional. A workflow with no feedback stays an `unvalidated
hypothesis`, which is an allowed and honest state.

## Consent and boundaries

Before any question is asked, and recorded in the synthesis:

- State the purpose: understanding how a task is done today, to test a workflow
  hypothesis for a proof.
- State that participation is voluntary and may stop at any time.
- State that no credentials, account access, customer data, or real records are
  requested, and that none should be shared.
- Ask permission to keep anonymized notes.

Do not request or accept credentials, tokens, customer names, real record
contents, screenshots of live data, or a commitment to buy or partner. Do not
record audio or video without separate explicit consent. If something sensitive is
offered, decline it and note that it was declined.

## Interview guide

Six questions, roughly fifteen minutes. Ask them in this order and let the answers
run; the follow-up questions are prompts, not a script.

1. Walk me through a recent time you did this task. What started it?
   - Follow-up: what were you looking at when you began?
2. Where were you, and what were you using?
   - Follow-up: was the desktop the only place this happens?
3. What is the slowest or most annoying part?
   - Follow-up: how often does that happen, and what does it cost you?
4. What do you do right now to work around it?
   - Follow-up: any spreadsheet, message, or paper step?
5. If it worked on a phone, what part would you actually do there, and what would
   you keep on the desktop?
   - Follow-up: what would make a phone version useless to you?
6. What would tell you it worked, the first week you used it?

Do not present a solution before question six. Do not ask whether the person
"would use an app"; ask what they do now and what it costs.

## Synthesis format

One file per round of conversations, under `docs/evidence/`, containing only
synthesized findings.

```markdown
# Operator feedback: <topic>

- Collected: <date or date range>
- Consent: obtained, voluntary, anonymized notes
- Participants: <count and a role description, no names>
- Credentials or customer data requested: no

## Observations

Direct reports, one line each, no interpretation. For example: "three of four
described checking records before leaving a site".

## Inferences

What the observations suggest, marked as inference. Each inference names the
observations it rests on.

## Contradictions

Where answers disagreed, and what that means for the hypothesis.

## Effect on the workflow record

- Status now: <unvalidated hypothesis | practitioner-informed>
- Change to the workflow: <what was added, removed, or rejected>
- Rejected claim: <anything the feedback does not support>
```

## Rules

- Observation and inference are separate sections, never mixed in one sentence.
- Counts are approximate and stated as such; no percentages from a handful of
  conversations.
- Negative results are recorded. A workflow that practitioners do not recognize
  is a useful finding, not a failed conversation.
- No transcript, name, contact detail, employer, or verbatim identifying quote is
  committed. Keep raw notes outside the repository.
- Feedback never turns a hypothesis into customer demand. The strongest claim it
  supports is `practitioner-informed`, as defined in
  [`docs/WORKFLOW-EVIDENCE.md`](WORKFLOW-EVIDENCE.md).
