# Security policy

## Supported versions

Navirox is pre-alpha and nothing is published yet, so there is no released
version to support. Security fixes land on `main`.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private vulnerability reporting on this repository:

https://github.com/guillaume-flambard/navirox/security/advisories/new

That channel is private between you and the maintainer, and it gives us a place
to agree on a fix and a disclosure date before anything becomes public.

Please include:

- what the problem is, and where it lives (package, file, or version)
- what an attacker can do with it, and what they need in order to try
- the smallest reproduction you have, if you have one

## What to expect

- An acknowledgement within a few days. This is a small project, so if a week
  passes without a reply, please ping the advisory thread.
- An honest assessment. If we decide the report is not a vulnerability, we will
  say why rather than leave it open.
- Credit in the advisory when a fix ships, unless you would rather stay
  anonymous.

## Scope

Reports about Navirox's own code are in scope. Reports about upstream
dependencies, `@symbiote-native/*`, React Native, or the native toolchains
belong with those projects, though we are happy to help route one.
