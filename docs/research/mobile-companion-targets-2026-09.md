# Historical benchmark selection note

Date: September 2026

This note records why public repositories were considered as technical inputs
for Navirox proof work. It is historical research, not a list of customers,
prospects, partners, or endorsements.

## Selection criteria

A useful benchmark has:

- a public repository and a revision that can be pinned;
- a framework and repository shape the relevant source adapter can inspect;
- one bounded workflow that can be represented with synthetic data and original
  assets;
- enough unsupported surface to test honest reporting and refusal;
- a licence compatible with the exact analysis being performed.

Baserow was considered for a Vue or Nuxt-shaped workflow. SuiteCRM was
considered for an Angular-shaped workflow. Their repositories are inputs to
analysis only. Navirox does not claim to convert either product, and no
relationship with their maintainers is implied.

## Evidence rules

Every benchmark run must record the repository URL, immutable revision,
commands, output, exclusions, and licence assumptions. Findings should describe
the inspected revision rather than generalize to the external product.

Any companion fixture must use synthetic data and original assets. Connecting
to a real instance, using credentials, redistributing third-party assets, or
publishing a comparative product claim requires separate review and authority.
