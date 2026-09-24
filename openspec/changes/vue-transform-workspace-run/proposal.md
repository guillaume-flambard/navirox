# vue-transform-workspace-run

## Why

The delivered `navirox transform` command still refuses a real Vue run when no test context injects providers. The Vue lowering and native target exist, but their composition, generated workspace contract and CLI proof are not yet delivered.

## What changes

- Compose the real Vue adapter, Vue lowering, neutral native target and Vue workspace scaffold in the CLI production path.
- Keep `transform()` injectable for deterministic unit tests, while making provider injection optional for the delivered command.
- Preserve static text and render generated bindings as valid Vue syntax.
- Derive import-safe deterministic screen file stems from the Workflow IR.
- Generate a minimal Vue workspace with its own compiler-backed verification command.
- Prove a positive fixture through the delivered CLI and a separate refusal fixture that produces a finding and no screen file.

## Scope

This is the Vue T2 generation increment. It proves generated workspace syntax, determinism and refusal behavior for the exact fixture profile. It does not prove iOS or Android execution, visual fidelity, external repository support, or a general Vue transformation claim.

## Dependencies

- `vue-workflow-lowering-core`
- `vue-native-target-emission`
- `source-transform-provider-seam`
- `transform-orchestrator`

## Non-goals

- Native device journeys or screenshots.
- Visual parity and CSS fidelity.
- Nuxt, router behavior beyond literal routes already present in the fixture, or dynamic routes.
- Automatic migration of application state, stores or shared units.
- A public or broad framework-support claim.

## Acceptance

- `navirox transform` succeeds without a test context on the positive Vue fixture.
- The generated workspace test compiles every generated SFC and exits 0.
- The refusal fixture records its refusal and emits no replacement screen.
- The workspace, manifest and evidence remain reproducible from the recorded command.
