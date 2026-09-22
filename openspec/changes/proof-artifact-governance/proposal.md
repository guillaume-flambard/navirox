# Proof artifact governance

## Why

The proof program retains source snapshots, fixtures, device screenshots, build
artifacts, and evidence reports. The pilot briefs forbid real credentials, data,
and copied assets, but no unified gate currently checks retained artifacts or
defines how a pinned benchmark is requalified as upstream changes.

## What changes

- Add an artifact-hygiene gate for fixtures, captures, reports, and CI uploads.
- Require provenance and retention rules for externally visible proof artifacts.
- Define a scheduled or release-triggered benchmark requalification that detects
  drift while preserving historical pinned evidence.

## Capabilities

### New Capabilities

- `proof-artifact-governance`

### Modified Capabilities

- None.

## Impact

- Documentation, CI proof artifacts, and benchmark maintenance.
- No secret scanning policy for the whole organization, real customer-data
  processing, benchmark update, or license determination is performed by this
  proposal alone.
