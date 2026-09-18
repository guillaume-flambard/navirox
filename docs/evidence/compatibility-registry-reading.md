# The plan, once compatibility facts exist

This records what changed when the plan could consult compatibility records, and
what deliberately did not.

## Before and after

`navirox plan -C examples/vue-basic`, on the same project, with the same adapter
and the same rules except one:

| Class                | Before | After |
| -------------------- | -----: | ----: |
| `shared`             |      0 |     4 |
| `portable`           |      1 |     9 |
| `adaptable`          |      0 |     1 |
| `native-replacement` |      4 |     4 |
| `manual`             |      0 |     0 |
| `unknown`            |     14 |     1 |

The fourteen unknown dependencies became thirteen answers and one honest unknown.
The one left is `@vue/devtools-api`, and the seed does not cover it because
nothing in this repository demonstrates anything about it.

## Where the thirteen answers come from

Every record in `packages/compat/src/records.ts` names the demonstration it rests
on, and none names an expectation:

- `vue`, `pinia`, `@vue/runtime-core`, `react-native`, `react`,
  `@symbiote-native/vue`, `@symbiote-native/engine` are `supported` and cite the
  acceptance application building and running on both platforms, with the shared
  Detox journey for the store.
- `react-native-haptic-feedback` and `react-native-keychain` are `supported` and
  cite the native APIs journey, because that is the test that drives them.
- `@symbiote-native/css-parser` is `supported-with-adapter` and cites the Metro
  preset it is reached through, because it is a build time parser rather than a
  runtime shim.
- The `@navirox/*` packages are `not-applicable`: they are the native side, and a
  project depends on them rather than migrating them.

## What the model refuses

- A record with no evidence fails the load by name. A claim nothing supports is
  not a weak record, it is not a record.
- A status or an evidence level outside the declared sets fails the load.
- Two records that disagree about a subject fail the load.
- A package this repository cannot demonstrate is absent. The registry test
  asserts that packages nothing here runs or builds are not in the seed, and an
  absent package produces the unknown the planner already reported.

## What this does not claim

- No semver resolution. A subject carries the range as written, and satisfying a
  range is a separate problem.
- No hosted registry, no contribution flow, no network access. The registry is
  data in this package, loaded through the same validation as any data would be.
- No capability facts. The model declares the subject kinds for them and the seed
  holds none, because the repository has no demonstrated capability compatibility
  to record yet.

## The boundary check this change had to make precise

The seed names `react-native`, `react` and `@symbiote-native/*` as the subjects of
records, and the renderer boundary check failed the build on it. The check was a
quoted-substring scan over every line, which was precise enough while the only
reason to write a renderer name in a neutral package was a mistake. A data file
naming a package is not a dependency on it, so the check now extracts module
specifiers and tests those, which is what the rule was always about: exactly one
package may *import* the renderer.

The check was then shown to still fail: an import of `react-native` added to
`packages/compat` is reported by file and specifier. Making a check precise is not
the same as weakening it, and this is the case that proves the difference.
