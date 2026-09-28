# Security policy

## Supported versions

Navirox is pre-alpha and has no stable supported release. A partial set of
historical `0.1.0` packages exists on npm, but the public package set is
incomplete and is not a supported installation path. Security fixes currently
land on `main`.

## Report a vulnerability

Please do not open a public issue for a security problem. Use
[GitHub private vulnerability reporting](https://github.com/guillaume-flambard/navirox/security/advisories/new).

Include:

- the affected package, file, revision, or version;
- what an attacker can do and what access they need;
- the smallest reproduction you can safely share;
- whether you want public credit if a fix is disclosed.

This is a small project. Expect an acknowledgement within a few days. If a week
passes without a reply, add a message to the private advisory.

## Current security boundary

The repository runs dependency, secret, and code scanning, but a completed or
green workflow means the analysis ran. It does not mean there are no open
findings. Security alerts are triaged separately and are not hidden to improve a
public badge.

Reports about Navirox code and generated output are in scope. Reports about an
upstream dependency, the current renderer, React Native, Xcode, Gradle, or an
operating system should usually go to the upstream project. If Navirox exposes
or amplifies the issue, include that integration impact in the private report.

Please never include real credentials, private customer data, or an exploit
against a system you do not own in a report.
