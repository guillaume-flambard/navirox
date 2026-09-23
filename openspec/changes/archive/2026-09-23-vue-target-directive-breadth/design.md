## Context

See `proposal.md` - Why. The compiler's `properties()` function in
`packages/target-vue/src/index.ts` already passes through `v-bind`, `v-if`,
`v-else-if`, `v-else` and `v-for`, and rewrites `@click` to `@press`. The
native renderer's directive surface is in the Symbiote Vue adapter, not in this
repository, so the evidence is cited here.

## Goals / Non-Goals

**Goals:**

- Accept exactly the directives the native renderer implements.
- Keep the refusal honest for everything else.

**Non-Goals:**

- New primitives, tags or styles.
- Any runtime, adapter or schema change.

## Decisions

### Accept `v-show` because the adapter implements it

The Symbiote Vue adapter's `runtime-helpers/index.js` exports its own `vShow`,
whose `mounted`/`updated` run `whenCommitted(el, () => setNativeProps(el, {
style: { display: value ? undefined : 'none' } }))`. So `v-show` has a real
native effect and the compiler may keep it.

Rejected: refusing it, which would refuse a screen for a construct that renders.

### Accept `v-model` only on a `text-input`

The same module exports `vModelText`, which owns the `value` prop and an
`onValueChange` listener for a text input. Its own source notes that it
stringifies the value for anything it does not recognise as a Switch, so `v-model`
is only honest on the one input primitive the target has.

Rejected: accepting `v-model` on any element, which would stringify a value the
native node cannot use.

### Accept the press events the pressable surface names

`components/pressable-props.js` states that `@press` / `@press-in` / ... reach the
press machine as ordinary `onPress` / `onPressIn` props. So `@press-in`,
`@press-out` and `@long-press` are accepted beside `@press` and the `@click`
rename.

Rejected: accepting arbitrary events, which the adapter does not implement.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version moves,
no public `@memolabs-apps/*` type name is added or re-exported, and no source
adapter or runtime seam is touched.

## Risks / Trade-offs

- A directive accepted without a native effect would generate a silent no-op ->
  each accepted directive is backed by a named adapter implementation, and a test
  pins the accepted and refused sets.
- The adapter could drop a directive in a later version -> the dependency is
  pinned exactly, and the tests would fail on a behaviour change.
