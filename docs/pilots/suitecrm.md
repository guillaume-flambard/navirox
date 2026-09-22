# SuiteCRM pilot brief

SuiteCRM is the first enterprise-oriented Angular qualification target and the
Angular benchmark. The snapshot in `benchmarks/catalog.json` pins the public
revision `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` of
[SuiteCRM-Core](https://github.com/salesagility/SuiteCRM-Core.git). It is an
analysis input, not a customer engagement, not an endorsement, and not a SuiteCRM
mobile application.

## What the analysis shows

The pinned revision is read only. The Angular adapter reports 12286 files, 1588
units, 684 capability usages and 0 routes, because the shell route table
(`core/app/shell/src/app/app-routing.module.ts`) is an empty literal `Routes`
array and the real routes arrive at runtime through federated extension loading,
which the adapter reports as `angular-remote-configuration` rather than guessing.
The declared `@angular/core` version is 18.2.14, outside the adapter's tested
`^20`/`^21` range, so that fact is reported as `version-untested` too. The full
counts and every unsupported surface are in
`docs/evidence/angular-suitecrm-benchmark.md`.

Because the real revision declares no route table the adapter can read, route
level scope has to be confirmed by whoever owns the instance. The
SuiteCRM-shaped fixture at `packages/source-angular/fixtures/suitecrm-app` shows
what the classification looks like when the source is readable: a record detail,
a record update form and an attachment path come back as `candidate`, an
administration and configuration screen comes back as `desktop-only`, and an
unread template comes back as `unknown`. The vocabulary is
`navirox inspect -C <path>`, and it is a statement about the source, never a
claim that a screen can be moved as it is.

## Paid discovery offer

Five days, one workflow, fixed-scope proposal at the end.

1. Day 1. Select one field workflow from the instance's own route and extension
   inventory. Nothing is scoped from a route name alone.
2. Day 2. Verify API and authentication ownership: which endpoints the workflow
   needs, who owns the credentials, and what the instance administrator is
   willing to authorise.
3. Day 3. Identify offline and compliance requirements that the workflow would
   have to meet before it can be promised.
4. Day 4. Scope the companion workflow against those findings and record what
   stays desktop.
5. Day 5. Return a fixed-scope implementation proposal, or a recommendation not
   to proceed.

Deliverables are the route and unit inventory for the selected workflow, the
blocker list, the confirmed workflow scope and the proposal. Customer-specific
code, data, credentials or bespoke integration requires a separate written
agreement before it is used in Navirox.

## The one workflow in scope

A field worker opens one record, updates one field, and attaches a document or a
photo. That is the shape the fixture classifies as `candidate` on three
separately observable signals, and it is deliberately not the desktop
configuration surface, which the analysis classifies `desktop-only`.

This workflow is selected and recorded per
[`docs/WORKFLOW-EVIDENCE.md`](../WORKFLOW-EVIDENCE.md), which states its source
provenance, the native-versus-PWA/WebView/Capacitor decision, and its validation
status. Until practitioner feedback exists it stays an `unvalidated hypothesis`
and must not be described as customer demand.

The completed record is
[`docs/evidence/workflow-suitecrm-record-workflow.md`](../evidence/workflow-suitecrm-record-workflow.md).
It names the immutable revision above, the readable fixture the workflow was
selected from, the ordered actions and the identifiers they act on, and the
failure state the companion has to surface. It is this project's own hypothesis,
not SuiteCRM's chosen workflow, and the unread federated routing stays a finding
in it: no route, screen or unit is claimed that the analysis did not establish,
and the actions are marked not yet executable because the Angular journey has no
target path. Navirox has no affiliation with SuiteCRM, which has not requested,
reviewed or endorsed any of this.

## Excluded until discovery confirms them

Authentication, offline synchronisation and compliance are open questions, not
promises. Nothing in this brief claims that a companion app can sign in against
a real instance, queue changes without connectivity, or satisfy data residency,
retention, audit or regulatory requirements. Those answers come from the
discovery days above and from the instance owner.

## What is not promised

- Not a SuiteCRM mobile app, and not a plan to copy the desktop interface.
- No official partnership, endorsement or affiliation, and no customer name.
- No visual parity claim, and no claim that any specific SuiteCRM screen is
  portable.
- No claim that the unread federated extension surface can be analysed before
  someone with instance knowledge names the routes.

## Licensing and branding

SuiteCRM-Core carries the GNU Affero General Public License v3 (`LICENSE.txt` in
the pinned revision). Any connector, distribution or hosted use needs its own
license review before it ships, and this brief is not that review. The Store
listing must use its own name, icon, screenshots, support channel and privacy
policy, must state that it is not affiliated with SuiteCRM, and must not use the
SuiteCRM name, logo or store assets without written permission. Customer-specific
applications remain published under the customer's developer accounts.
