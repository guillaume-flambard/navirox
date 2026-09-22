# External validation of the readiness report

This record is a self-run read of the Navirox report against public repositories
this project does not own. It answers one question: when a repository the project
has never seen is analysed, does the report name work in the tool's own
vocabulary without inventing a decision the evidence does not support.

## Consent

No conversation was held and no practitioner was contacted. Every repository here
is public and read from a clone, so this record rests on an executed command and
not on anyone's testimony. Consent is therefore not applicable, and no
credentials, account access, customer data or real records were requested or
used.

## Collected

2026-09-22, from the built CLI at the verified installation path
(`node packages/cli/dist/bin.js`, the entry the packed-tarball row installs), on
this machine.

## Participants

None. This is a self-run validation, not practitioner feedback.

## Credentials or customer data requested

no

## Observations

Each repository was cloned to a directory outside the workspace, pinned to the
commit below, and read with `navirox analyze -C <path> --json` followed by
`navirox plan -C <path> --json`.

### nuxt/movies at `ce256d64f4c9ddf93da44fa88d7662678853aed3`

A real Nuxt application whose `app/` directory sits at the repository root.

- `analyze` exited 0 with adapter `nuxt`, framework version
  `npm:nuxt-nightly@4.6.0-29812804.e29b3dd9`, support level `experimental`, and
  summary `{files:122, units:52, capabilities:9, dependencies:2, routes:8,
  screens:8, findings:{info:5, warning:0, error:0}}`.
- The eight routes are the eight files under `app/pages/`, including dynamic
  segments such as `/:type/:id` and `/genre/:no/movie`.
- Five `info` findings correctly report code the adapter does not model: a
  `nuxt-plugin`, the `nuxt-runtime-config`, a `nuxt-server-code` file, and two
  pages whose `key` is not a literal.
- `plan` exited 0 with 63 decisions and summary
  `{shared:8, portable:7, adaptable:2, native-replacement:42, web-fallback:0,
  manual:2, unknown:2}`.

### nuxt/ui at `bab8c5af30dd4e6cb14d42144e82b9c8863d2cc6`

A component library, not an application: its demo lives under `playgrounds/`.

- `analyze` exited 0 with adapter `nuxt`, `frameworkVersion` `catalog:` (an
  unresolved workspace catalog reference), support level `experimental`, and
  summary `{files:2281, units:1195, capabilities:223, dependencies:65, routes:0,
  screens:0, findings:{info:9, warning:2, error:0}}`.

## Inferences

The report is useful on a repository the project does not own: it resolves the
adapter, the framework version and the route set from files alone, names the code
it deliberately does not model, and reaches every category of its classification
vocabulary including `manual` and `unknown`.

## Contradictions

The two repositories disagree on what the report can conclude from a root. A
repository whose application sits at the root yields routes and screens; a
repository that is a library whose application sits in a subdirectory yields
none, and its `frameworkVersion` reads `catalog:`. The report does not claim to
have read an application it did not find, but a reader who points the tool at a
library root would see zero routes and could mistake that for a failure of the
tool rather than a property of the repository.

## Effect on the workflow record

The workflow hypothesis under test is that a deterministic report is a useful
first read on an unfamiliar Vue/Nuxt repository. This round supports the
hypothesis on an application root and records a boundary on a library root.

Status now: unvalidated hypothesis

Basis: two self-run analyses of public repositories, no practitioner contacted
and no feedback obtained, so the strongest claim available is a hypothesis.

## Boundaries

This record tests whether the report is useful on external repositories. It is
not a support upgrade: it does not raise a support level, does not assert demand
from a customer, and does not establish any formal agreement with a third party.
No number here is a percentage, because two repositories are not a sample.
