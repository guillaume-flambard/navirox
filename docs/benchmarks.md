# External benchmark protocol

Navirox has two separate forms of evidence. `pnpm test:e2e` proves the packed
public packages install for a fresh consumer. `pnpm test:benchmarks` proves the
analyzers read real, immutable public repositories.

Run a profile with:

```sh
pnpm build
pnpm test:benchmarks -- --project baserow
```

The benchmark fetches only the exact commit recorded in
`benchmarks/catalog.json`. It does not install, build, execute, modify, or copy
the external project into this repository. Network, Git and report failures are
intentional failures, never skipped results.

## Measures

- adapter detection;
- routes and screens at or above the recorded baseline;
- successful `analyze` and `plan` JSON reports;
- a pinned source revision.

The Cal.com profile also records an official Expo companion as a semantic
reference. Each listed workflow must still resolve to the declared web route
and its source file, and to a real Expo screen at the companion's pinned
revision. It is not a pixel-comparison test: Navirox cannot claim visual
parity until a target provider emits independent native view trees.

## Adding a profile

Add a public repository only when it has a stable, full Git commit SHA, a
source directory with a supported framework manifest, and a baseline obtained
by a successful local run. A moving branch, a private repository, credentials,
or an application install requirement are not valid benchmark inputs.
