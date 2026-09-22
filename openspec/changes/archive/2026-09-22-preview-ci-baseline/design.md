# preview-ci-baseline design

## Context

CI run `35765671500` on commit `41a7b56` failed three jobs. The failure was known
only as "CI is red": no note linked a failing job to its cause, so a repair could
not be scoped and the developer-preview gate had no concrete blocker to clear.
`docs/DEVELOPER-PREVIEW.md` names `preview-ci-baseline` as the change that
diagnoses and repairs red CI independently of messaging, and `vue-nuxt-developer-preview-contract`
task 3.1 withholds that change until a failed log has been read and linked to a
job and a commit.

## Decisions

### The diagnosis is part of the change

The proposal records the run id, the commit, each failing job and each cause. A
repair that lands without the diagnosis would leave the next red run as opaque as
this one, and the gate would be argued from memory rather than from a log.

Rejected: opening the change on the bare observation that CI is red. That is the
state the contract already describes and forbids as a basis for a claim.

### The two failures are separate defects and are fixed separately

`--workspace` missing from the Angular companion script is an argument-parsing
gap; the single-shot `toExist` assertion in the pilot spec is a synchronization
gap. They share a run but not a cause, so they are separate commits and separate
tasks. Bundling them would make a future regression hard to attribute.

Rejected: repairing only the `--workspace` failure because it is deterministic
and deferring the pilot failure. The pilot job is one of the failing jobs, and
the contract blocks the claim until every failing job is green.

### The DevTools message is recorded but not repaired

The `An unknown error occurred while installing React Native DevTools` line
appears in the emulator capture log and did not fail the job. It is out of scope:
repairing a non-fatal message would widen this change beyond the failing jobs and
would not move any gate.

Rejected: treating the message as a failure. The job's conclusion is `success`,
so claiming it blocks the preview would be a claim the log does not support.

### The named workspace is the shared contract

`capture-records-native.mjs` already accepts `--workspace`, prepares the directory
and keeps it, because continuous integration uploads what the run wrote after the
run ends. The Angular companion capture needs the same behaviour for the same
reason, so it is given the same option rather than a new one.

Rejected: a new option name or an environment variable. A second spelling for one
concept is the drift this change is repairing.

## Contract change questions

No shared contract changes. This repairs a local script's command-line surface
and one end-to-end spec; both are internal to the repository, no
`@memolabs-apps/*` package or public type changes, adapter metadata is unrelated
to a capture script's arguments, and no schema version changes.
