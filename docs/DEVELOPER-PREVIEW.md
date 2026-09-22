# Vue/Nuxt developer preview contract

## Purpose

The first public developer preview is a narrow, reproducible Vue/Nuxt migration
readiness demonstration. It helps a web team identify portable business logic,
manual or native-replacement work, and unresolved risks before a focused native
companion starts.

It is an open-source audit and assisted-delivery entry point, not a self-serve
full-application converter.

## Verified boundary

| Evidence                         | Safe statement                                                          | Not established                                        |
| -------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------ |
| Vue/Nuxt inspection and planning | A repository receives a deterministic readiness report.                 | That every screen can become native.                   |
| Migration engine                 | Explicitly shared or portable units can be copied with recorded limits. | That copied code works without adaptation.             |
| Native/device evidence           | A bounded Vue journey and capture harness have evidence.                | General visual fidelity or an external-app conversion. |
| Distribution                     | Packed tarballs have a verified path.                                   | A fresh public `npx navirox` installation.             |
| External validation              | The report was read on public repositories we do not own.               | A support upgrade, customer demand or a partnership.   |

The current Baserow diagnostic is source-analysis evidence, not a Baserow mobile
application, partnership, or authority to reuse Baserow data, assets, or
credentials.

### Installation path

The only verified consumer installation path is the packed tarballs of
`pnpm test:e2e`, which scaffold, install and build Navirox without the registry.
The documented public path does not work today: `navirox` is not published, and
five workspace packages are absent from the registry
(`@memolabs-apps/cli`, `@memolabs-apps/source-lit`,
`@memolabs-apps/source-solid`, `@memolabs-apps/target-vue` and
`@memolabs-apps/visual-benchmark`). Because `navirox` depends on
`@memolabs-apps/cli`, and `@memolabs-apps/cli` depends on
`@memolabs-apps/source-lit` and `@memolabs-apps/source-solid`, the public path
fails at two links. `npx navirox doctor` reports `404 Not Found` for `navirox`,
and `npx @memolabs-apps/cli --help` reports `404 Not Found` for
`@memolabs-apps/cli`. No sentence here claims a working public `npx navirox`
installation while those five packages remain unpublished.
`node scripts/check-public-distribution.mjs` resolves each documented package
against the registry and fails when this stated limitation and the registry
disagree, so the gap cannot drift out of date without a failure.

## Preview acceptance bar

The preview may be announced only with fresh evidence for all of the following:

1. A narrow Vue/Nuxt demo starts from a pinned source revision and produces a
   readable report plus a bounded companion-workflow recommendation.
2. A new user can follow one documented public installation and analysis path
   without workspace links or unpublished dependencies.
3. Documentation states supported, unsupported, manual and unknown work in the
   vocabulary reported by the tool.
4. Installation, analysis, tests and build verification succeed from the
   declared baseline. A red CI run blocks the preview claim until repaired.
5. The demonstration identifies its revision, commands, artifacts and
   exclusions. It makes no full-conversion, production-readiness, visual-parity,
   partnership or customer claim.

## Decision policy

Compare the workflow against PWA, WebView and Capacitor when they are plausible.
Select Navirox only when evidence shows native-specific value beyond the
lower-cost alternative.

An LLM may later explain deterministic reports, rank established options,
propose a workflow, or draft scaffolding and TODOs. It must not decide
compatibility, portability or support level. Every suggestion is labelled
inferred or unverified, validated deterministically before use, and opt-in. The
core preview works without an LLM or source upload.

## Dependency-ordered changes

1. `vue-nuxt-developer-preview-contract`: establish this contract.
2. `preview-ci-baseline`: diagnose and repair red CI independently of messaging.
3. `preview-public-distribution`: prove a public consumer path or retain the
   verified tarball limitation.
4. `preview-external-validation`: test audit usefulness on external
   repositories without upgrading support from anecdotal feedback.
5. `deterministic-transform-validation`: add only provenance-linked,
   reversible transforms with behavioural and build validation.
6. `optional-llm-assistance`: add opt-in suggestions after the deterministic
   preview is useful on its own.

The proof-journeys program remains separate: it establishes companion evidence;
this contract governs the narrower developer-preview promise.
