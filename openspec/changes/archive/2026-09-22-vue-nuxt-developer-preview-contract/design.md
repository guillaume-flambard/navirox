# Vue/Nuxt developer preview contract design

## Context

The deterministic path is farther along than automatic view conversion. Source
analysis reports routes, units, capabilities and uncertainty; the migration
engine moves only justified classifications; native evidence is bounded. CI is
currently red and public npm installation is incomplete.

## Decisions

### The preview is a readiness product

The promise starts with a Vue or Nuxt repository and ends with a deterministic
report plus a bounded companion recommendation, not automatically generated
mobile screens.

Rejected: a generic web-to-native converter preview. That wording would make
the narrow compiler subset and manual native work look like broad automation.

### CI and public installation are independent gates

Red CI and incomplete public npm installation are explicit blockers. Their
repair belongs in separate changes, so documentation cannot hide an operational
failure.

### LLM output is optional and subordinate

An LLM may elaborate on deterministic facts but cannot promote an unknown
classification or define a support promise.

Rejected: model confidence as a compatibility signal. That would weaken the
evidence contract that distinguishes Navirox from a speculative converter.

## Contract change questions

No shared contract changes. The real consumer is a developer evaluating a
Vue/Nuxt repository; adapter metadata cannot define distribution, CI or public
claim constraints; no schema version changes.

