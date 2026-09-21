# Baserow pilot brief

Baserow is the first commercial qualification target and Nuxt/Vue benchmark.
The snapshot in `benchmarks/catalog.json` pins the web frontend at a public Git
commit. It is an analysis input, not a customer engagement and not a Baserow
mobile application.

## Paid discovery offer

1. Analyze the customer-selected revision and document routes, screens, API
   boundaries, mobile-only requirements and unresolved migration risks.
2. Define a narrow companion-app workflow, rather than copying the desktop
   editor: field updates, forms, attachments, notifications and role-specific
   views are candidate scopes.
3. Deliver a fixed-scope implementation proposal only after the workflow and
   data-access model are confirmed by Baserow.

Generic Navirox adapter and benchmark improvements remain product work. Any
customer-specific code, data, credentials or bespoke integration requires a
separate written agreement before it is used in Navirox.

## Independent reference application

Navirox may ship an independent field-work reference application before a
customer engagement. It is not a renamed Baserow application, and it must not
claim to be affiliated with Baserow.

The reference application's first workflow is deliberately narrow: a worker sees
assigned records, changes a status, completes a form, takes or attaches a photo,
and queues a change while offline for later submission. It uses original source,
original visual assets and synthetic demonstration data. This proves a mobile
delivery path and a useful native experience rather than reproducing a desktop
table editor.

An optional connector may talk directly to an instance that its user administers,
using the documented Baserow API and a token whose permissions are restricted by
that instance's administrator. It must never proxy customer data through Navirox,
embed a Baserow Cloud credential, copy Baserow premium or enterprise code, or use
Baserow's name, logo or store assets without written permission. Baserow's open
source edition includes MIT-licensed client-side code, while premium and
enterprise directories carry distinct licenses. The relevant sources are the
[repository license](https://github.com/baserow/baserow/blob/develop/LICENSE),
[REST API documentation](https://baserow.io/docs/apis/rest-api), and
[personal API token documentation](https://baserow.io/user-docs/personal-api-tokens).

The Store listing must use its own name, icon, screenshots, support channel and
privacy policy. It may describe a factual compatibility only after a current
license, trademark and terms review, and must state that it is not affiliated
with Baserow. A store release is a portfolio proof and lead generator, not a
revenue assumption. Customer-specific applications remain published under the
customer's developer accounts.
