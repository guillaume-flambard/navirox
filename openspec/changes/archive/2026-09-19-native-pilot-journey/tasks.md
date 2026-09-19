## 1. Record the change

- [x] 1.1 Write the proposal, the `migrated-journey` spec delta, the design and
      these tasks. Verify with `openspec validate native-pilot-journey --strict`.

## 2. Generate the native pilot application

- [x] 2.1 Scaffold `examples/vue-pilot` with the shipped scaffolder:
      `node packages/create-navirox/dist/bin.js vue-pilot -d examples/vue-pilot`.
      Verify that the directory is created and the package identity is
      `dev.navirox.vuepilot` / `VuePilot`.
- [x] 2.2 Make it a workspace member: set the five `@memolabs-apps/*` entries back to
      `workspace:*`, delete the template's nested `pnpm-workspace.yaml`, adopt the
      canary's member `metro.config.js`, and copy the canary's `eslint.config.js`,
      `.prettierrc.js`, `.watchmanconfig`, `css.d.ts` and `vue-runtime-core.d.ts`.
      Verify with `pnpm install` at the root and
      `pnpm --filter vue-pilot typecheck`.
- [x] 2.3 Add the native test dependencies and scripts the canary has
      (`detox`, `jest`, `jest-circus`, `ts-jest`, `@types/jest`, and the four
      `e2e:*` scripts). Verify with `pnpm install` and
      `pnpm --filter vue-pilot exec detox --version`.

## 3. Run the migration into it

- [x] 3.1 Run the shipped CLI over the pilot:
      `node packages/cli/dist/bin.js migrate -C pilots/vue-web --write --out examples/vue-pilot`.
      Verify that the run moves `src/stores/catalogue.ts` and names the two imports
      it did not carry.
- [x] 3.2 Confirm the moved file is what the run wrote. Verify with
      `git diff --no-index pilots/vue-web/src/stores/catalogue.ts examples/vue-pilot/src/stores/catalogue.ts`
      reporting no difference.

## 4. Write the manual work

- [x] 4.1 Adapt the API client: replace the static asset read with a bundled product
      list, keeping the `Product` shape and the async `fetchProducts` contract.
      Verify with `pnpm --filter vue-pilot typecheck`.
- [x] 4.2 Adapt the favourites module to the secure store from
      `@memolabs-apps/native`, keeping the `Favourites` interface the migrated store
      calls. Verify with a test or a manual run that a written favourite is read back.
- [x] 4.3 Write the native views for the journey: the product list, the header count,
      the favourites view and the product detail, with the router replaced by a view
      switch in the store or the app shell. Verify with `pnpm --filter vue-pilot lint`
      and `pnpm --filter vue-pilot typecheck`.

## 5. Automate the journey

- [x] 5.1 Add `detox.config.js` and `e2e/` for the pilot, following the canary's
      configuration and its shared testID conventions, with the pilot's own bundle
      identity and device names. Verify with
      `pnpm --filter vue-pilot e2e:build:ios`.
- [x] 5.2 Write one spec that drives the journey: list all products, favourite one,
      assert the header count and the favourites view, open one detail, relaunch and
      assert the favourite survives. Verify with
      `pnpm --filter vue-pilot e2e:test:ios` on the iOS simulator.
- [x] 5.3 Run the same spec on the Android emulator. Verify with
      `pnpm --filter vue-pilot e2e:test:android`.

## 6. Prove the canary is untouched

- [x] 6.1 Run the canary journey on both platforms, killing any Metro first. Verify
      with `pnpm --filter vue-basic e2e:test:ios` and
      `pnpm --filter vue-basic e2e:test:android` still passing four of four.

## 7. Record the evidence and verify

- [x] 7.1 Write `docs/evidence/native-pilot-journey.md` with the source, migration
      and target revisions, the files the run wrote, every file written or edited by
      hand with its reason, the per platform journey result, the capabilities with no
      native counterpart, and the known gaps.
- [x] 7.2 Run the full gate: `pnpm build`, `pnpm typecheck`, `pnpm test`,
      `pnpm lint`, `pnpm format:check`, `pnpm deps:check`.
- [x] 7.3 Run `openspec validate native-pilot-journey --strict` and archive the
      change with `openspec archive native-pilot-journey --yes`.
