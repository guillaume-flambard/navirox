## Context

Eight adapters read eight frameworks. Solid is the ninth, and the two shapes that make it
worth reading are its reactivity and its JSX.

Its reactivity is neither of the two the adapter set already handles. Vue has a store library
the adapter imports a module from, React has hooks whose names it recognises, and Solid has
fine grained signals plus a store that is a proxy with a path setter, taken from a subpath of
the same package as the runtime. That is a third shape, and the honest question is whether it
forces a new concept into the neutral model.

Its JSX is the second time an adapter reads source that looks a lot like what Navirox emits.
React already sits closest to the target and its adapter refuses a project that declares the
native runtime for exactly that reason. Solid is further from the target than React is, but
the JSX is the same syntax, so the same guard is worth holding.

The router is the third thing. Solid Router documents two shapes for the same route table, a
JSX element with a `path` prop and an object array passed to a factory, and the second one is
new relative to the React and Angular readers, which only ever read one.

## Goals / Non-Goals

**Goals:**

- Detect a Solid project and refuse one that is already aimed at the native runtime.
- Read components, state modules and routes from the files a project has, with the same
  neutral helpers the other adapters use.
- Read both documented shapes of the route table.
- Report what could not be resolved, rather than inventing a route.
- Keep the App Graph at schema version 1 and add nothing to the shared contract.

**Non-Goals:**

- SolidStart as a composed meta framework. It changes the routing model to file based, which
  is a separate reading of its own, and the same reasoning put Nuxt after Vue rather than
  with it.
- Reading JSX to resolve which component a route renders. The React adapter does not do it
  either, and a name is not a fact.
- Signal reads and writes as capabilities. They are not browser capabilities; they are the
  framework's own reactivity.
- Any transform, any migration, and any change to the runtime, the UI, the router or the
  acceptance app.

## Decisions

**A base adapter, not a composed one.** Solid has a runtime, a store subpath and a router
package, and no meta framework is in scope, so there is nothing to compose and nothing to
compose it from.

**The native refusal is inherited rather than rewritten.** `nativeDeclarations` already lives
in `@navirox/source-react` and is already imported by the Next and Astro adapters. Rejected:
writing a fourth copy of the same three prefixes, which is how the same rule drifts apart;
and moving it into the neutral package now, which is a shared contract change this ticket
does not need and which the compatibility work can do when a second consumer outside React
genuinely needs it.

**A component is a function returning elements.** Same rule as React, same reason: a file
name is a naming convention, an export is a fact. Rejected: a file extension rule, which
would report every `.tsx` in the project as a component.

**A store is recognised by the subpath it comes from, and by the two documented factories.**
`solid-js/store` exports `createStore` and `createMutable`, and both declare a store. Rejected:
recognising the import alone, which would report a module that imports the package and
declares nothing as a state module.

**Both router shapes are read, and only literal paths become routes.** The JSX form and the
object form are both documented, so a reader that only handled one would under report half of
the projects it is pointed at. Rejected: reading only the object form, which is the newer
documentation but not the only one in use.

**A wildcard segment does not become a route pattern verbatim.** Solid Router writes a
catch-all as an asterisk, optionally named, and the router's own matcher treats it as a
segment, so the adapter reports the route it matches rather than the asterisk. Rejected:
carrying the asterisk through, which would put a router-internal token in a neutral pattern.

**The adapter declares the version it was tested on.** `^1.9.0`, measured against the
published line, with an untested major reported. Rejected: remaining silent about the range,
which the adapter contract already forbids.

## Risks / Trade-offs

The route reader is textual, so a path built at runtime is invisible. The mitigation is that
it is reported: a non-literal path is a finding, not silence, and the requirement says so.
The adapter is also the third to read a route table by pattern, which is duplication the
React reader already records as assumed: the next adapter that needs it should push it down
into the neutral package, and that is written here so it is not forgotten.

The store reading recognises two factory names, so a project that builds its store through a
helper it wrote itself will be reported as a plain application module. That is the honest
result rather than a guess, and the pattern list is data, so the third documented shape is a
line rather than a branch.

Naming the adapter's JSX reading "the second one that looks like the target" is a claim about
risk, not about behaviour. The behavioural guard is the native declaration refusal, and it is
tested.

## Open Questions

Whether SolidStart deserves its own adapter once the file routing is worth reading, which
would make this adapter its composed base in the same way Vue is Nuxt's.
