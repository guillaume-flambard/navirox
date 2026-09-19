# The cross-adapter gate: two frameworks through one pipeline

This records the outcome of the gate the repositioning calls primary. Its purpose
is not that a second adapter exists but that the neutral layer was proven neutral
by carrying one.

## Commission

```
pnpm --filter @memolabs-apps/cli test
```

The comparison is `packages/cli/src/adapters.test.ts`. It builds the registry
from the shipped composition root (`createAdapterRegistry`), inspects the Vue
fixture and the Svelte fixture through the same pipeline, and holds the two
reports to one shape.

## What the gate asserts

- Both fixtures are inspected through `@memolabs-apps/inspect` with no adapter
  specific code path.
- The two reports agree on the shape of the graph: the same node collections, the
  same set of unit kinds, the same set of keys present on a unit node, the same
  dependency node keys.
- The two projects produce the same capabilities with the same usage kinds:

  ```
  geolocation:invoke
  local-storage:read
  local-storage:unknown
  local-storage:write
  network-request:invoke
  ```

- Routes exist where a framework documents them and nowhere else: the SvelteKit
  fixture yields `/`, `/about` and `/blog/:slug`, and the Vue fixture yields no
  route, because the Vue adapter refuses to infer one.
- `APP_GRAPH_SCHEMA_VERSION` and the report schema version are both still `1`.

The gate was shown to fail when the comparison is false: deleting the network
call from the Svelte fixture makes two tests fail and the diff names the missing
capability rather than passing quietly.

## What moved into the neutral core, and why

Three things moved, and each moved for the same reason: a second (or third)
implementation needed it and it carries no framework knowledge.

| Moved                                                       | From          | Why                                                                                                        |
| ----------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| The browser capability scan and its declared pattern set      | `source-vue`  | It describes browser APIs, not a framework. Two copies would have let two adapters read one file differently. |
| Manifest reading (`package.json`, declared ranges, production dependencies) | `source-vue`  | Every framework declares itself in the same file and the same fields.                                      |
| The reading to graph mapper (`buildFragment`)                 | both adapters | At the third adapter a third copy of a fully generic mapping became evidence that it belonged to the core.  |

The discovery half stayed in the adapters, because that is the half that differs:
what a component is, which files are units, and how a store is declared are
framework facts. The line between the two is recorded in the open questions of
the change.

## What the second adapter does and does not do

`@memolabs-apps/source-svelte` detects, discovers components, store modules and
capability use, reports dependencies, enforces its tested version range, and
reports the constructs it does not model (Svelte 4 syntax, raw HTML insertion, the
`svelte:` namespace).

It does not compile a component. Svelte publishes no parser with a stable block
API the way Vue does, so the adapter reads the blocks it needs and can report what
a component contains rather than rejecting a malformed one. That is a narrower
claim than the Vue adapter makes, and it is stated in the adapter's own
documentation rather than left for a user to discover.

`@memolabs-apps/source-sveltekit` composes the Svelte adapter for everything except
routing, and contributes the routing the framework documents: one route per
`+page.svelte`, with a nested directory becoming a path and a bracketed segment
becoming a parameter. Server pages, layouts, error pages and endpoints are
reported as findings and produce no route, and a page outside the routes
directory produces nothing.

## What the gate does not prove

- That the two adapters read with equal depth. The comparison compares
  vocabulary, not fidelity, and the Svelte adapter reads less.
- Anything about a real Svelte project. The evidence rests on fixtures that were
  written to mirror each other; no third party project has been inspected.
- That the shared model is complete. Three adapters from the same broad family of
  component frameworks is not Angular, and it is not Astro's composition
  question. Those remain the next tests of the same kind.

## Verdict

The gate passes on its stated criteria: two frameworks reach the same graph
through the same neutral pipeline, the shared schema did not move, and the
framework boundary check reports no violation with three adapters present. The
abstraction is not obviously Vue shaped. Whether it survives Angular and Astro is
still open, and deliberately so.

## Two real projects, not only fixtures

Both adapters were pointed at the upstream Symbiote examples, which are projects
this change did not write. Both readings are recorded verbatim below, and the
first run of the Svelte one found a real defect.

### The real defect the real project found

The first reading reported eleven findings on the Svelte example, and two of them
were false: `svelte.config.js` and `components/api-playground/shim-node-guard.ts`
were reported for using `<svelte:element>`, and both only mention it in a comment
that documents the construct. The capability scan strips comments before matching
and the unmodelled scan did not, which is a claim about a file the adapter never
really read. Fixed in both adapters, and the reading below is the one taken after
the fix. This is the reason the evidence rests on a project nobody here wrote.

### Svelte, the upstream example

```
Navirox inspection
  project   /Users/memo/projects/upstream/symbiote-native/examples/svelte
  adapter   Svelte (experimental)
  framework svelte ^5.56.0

Found
  files        149
  units        52 (52 component)
  capabilities 12
  dependencies 10
  routes       0

Findings (4)
  info    svelte-element   components/api-playground/BindingsDemo.svelte
  info    svelte-element   components/api-playground/CompositionDemo.svelte
  info    svelte-element   components/api-playground/SpecialElementsDemo.svelte
  info    svelte-element   components/api-playground/TreeNode.svelte
```

### Vue, the upstream example

```
Navirox inspection
  project   /Users/memo/projects/upstream/symbiote-native/examples/vue-sfc
  adapter   Vue (experimental)
  framework vue ^3.5.38

Found
  files        323
  units        56 (56 component)
  capabilities 12
  dependencies 10
  routes       0

Findings (2)
  info    suspense   components/playground/SuspenseDemo.vue
  info    teleport   screens/CanaryScreen.vue
```

Both readings are component-only, which is the honest result for two projects
whose routing is done by the host application rather than by a framework router.
Neither project declared `vue-router`, so the Vue adapter produced no router
finding; the Svelte project is a plain Svelte application, so no SvelteKit
adapter was selected. No real SvelteKit project was available on this machine,
and none is claimed.
