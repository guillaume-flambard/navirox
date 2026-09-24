## Context

The App Graph already has a route node shape, and the Vue adapter reads literal top-level `createRouter` routes. The Workflow IR currently has only screens, so the generated workspace imports all generated screens without route identity, parameters or navigation. Router support must extend the neutral contract without placing Vue Router types in the core.

## Goals / Non-Goals

**Goals:**

- Preserve literal route path, optional name, parameter names, resolved screen and source location.
- Represent navigation as a route-linked action or deep-link pattern.
- Refuse dynamic routes, guards, plugins and unresolved components with explicit findings.
- Keep repeated route lowering deterministic.

**Non-Goals:**

- No computed route evaluation, guard execution, plugin runtime, SSR or Nuxt middleware.
- No general router abstraction for every framework.
- No browser or device behavior claim.

## Decisions

### Add a versioned route collection to Workflow IR

The IR will carry routes with stable ids, path patterns, optional names, parameter names, source locations and screen references. Screens will retain their source and may expose route ids. Navigation actions will reference a route id or a literal deep-link pattern.

This is a schema change because routes are user-visible generated behavior and cannot be represented by the current screen-only shape. The migration will accept the current route-less shape only when the profile explicitly permits route-less workflows; otherwise it will refuse with a versioned finding.

### Resolve only literal component references

The Vue adapter will lower only route objects whose path and component are literal source facts. It will not infer routes from a views directory or evaluate computed tables. Guards and plugin callbacks remain findings and do not become route metadata.

### Keep navigation separate from view structure

A navigation action is an action record targeting a route, not a framework-specific link binding. The target can render the action using its own route surface, while the source adapter owns Vue Router syntax.

## Risks / Trade-offs

- [Schema migration changes existing hashes] -> Record the version change and update fixtures; do not silently reinterpret old workflows.
- [Route coverage is narrower than Vue Router] -> Name every refused shape and keep the supported profile explicit.
- [Screen ids and route ids may diverge] -> Require a resolved screen reference for every emitted route and validate it before target emission.

## Migration Plan

1. Extend the App Graph and Workflow IR schemas with route records and tests.
2. Add Vue router positive, boundary and refusal fixtures.
3. Connect route records to the existing screen lowering and target navigation action contract.
4. Run the T2 workspace verifier and the full baseline.
5. Open T3 only after route and action contracts are both proven.
