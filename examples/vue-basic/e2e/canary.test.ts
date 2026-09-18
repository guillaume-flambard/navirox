/**
 * The NX-010 acceptance journey: one spec, shared testIDs, both platforms.
 *
 * It drives the canary the way a person would, and it reads its verdicts off
 * the screen rather than out of the store, because the thing under test is the
 * whole path from a native touch to a native view: the renderer, the runtime
 * provider, Pinia through the configure seam, and the native APIs. A JS-only
 * test could not prove any of that.
 *
 * The identifiers used here are the same ones the app's template carries, so
 * the same file runs under `e2e:test:ios` and `e2e:test:android` unchanged. That
 * is the property the plan asks for: the spec is shared, not duplicated.
 *
 * Synchronization has to be off, and getting it off is the one part of this
 * harness that needed measuring rather than copying. The upstream canary turns it
 * off with a launch argument alone; here that argument reaches the app (the
 * defaults log shows `detoxEnableSynchronization` read as 0) and the app still
 * reports itself busy, so every matcher stalls ten seconds at a time and dies.
 * A `device.disableSynchronization()` call does settle it, but only once the
 * renderer has finished loading: the load registers an idling resource of its own
 * that re-arms synchronization, which is why a single call right after launch is
 * a coin flip. So the launch disables it up front *and* keeps asking until the
 * app answers, and every assertion then carries its own explicit `waitFor`. The
 * asking is patient, too: the wait that sees the root view has to outlast a cold
 * Metro bundle, not just a slow render, so it gets its own budget below.
 */
import { by, device, element, expect, waitFor } from 'detox';

/** Long enough for a native mount and a store commit on a warm machine. */
const TIMEOUT = 20000;

/**
 * Long enough for the first bundle to arrive on a machine that has never built
 * one. Metro serves the dev bundle on demand, and the first request walks the
 * whole graph: measured at about a minute on a macOS runner (829 modules with an
 * empty cache) against a couple of seconds here, where the cache is warm. The
 * gate below waits for that bundle, so it is the one wait that has to outlast a
 * cold machine rather than a slow render.
 */
const SETTLE_TIMEOUT = 120000;

/**
 * The hook needs a budget of its own. jest applies `testTimeout` to hooks as
 * well as to tests, so at 120 seconds it ends `beforeAll` mid-wait: measured on
 * a macOS runner, a cold Metro bundle (about a minute) followed by a first
 * attempt whose query stalls because the renderer's load re-armed the idling
 * resource spends exactly the 120 seconds that `SETTLE_TIMEOUT` allows, and jest
 * kills the hook before the second attempt above can run. That retry is the
 * whole point of the loop, so the hook is given room for the launch plus three
 * full attempts.
 */
const HOOK_TIMEOUT = 480000;

/** Sync off from the first launch, before the renderer has anything to register. */
const LAUNCH_OPTS = {
  newInstance: true,
  launchArgs: { detoxEnableSynchronization: 0 },
};

/** With synchronization off, nothing may be touched before it is on screen. */
async function visible(id: string) {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

/**
 * For containers, assert existence rather than visibility. On iOS the visibility
 * matcher never settles on a view that has no drawn surface of its own, however
 * much of the screen it covers: the canary's root view is 402x874 at the origin
 * and Detox still reports it as not visible while the hierarchy dump from the
 * same run lists it as `visibility="visible"`. Existence is the honest claim for
 * a container, and the leaves inside it (text, pressables) are asserted visible.
 */
async function exists(id: string, timeout = TIMEOUT) {
  await waitFor(element(by.id(id)))
    .toExist()
    .withTimeout(timeout);
}

/**
 * Launch, then hold synchronization down. The renderer registers a load idling
 * resource of its own, which can re-arm synchronization after a disable that
 * lands too early, so a round that times out disables it again and waits once
 * more. Each round is a full wait rather than a short probe on purpose: a query
 * aborted mid-flight leaves the next one answering from a broken state. The wait
 * is `SETTLE_TIMEOUT` rather than `TIMEOUT`, because it is waiting on a bundle
 * that has never been built on this machine, not on a render that has.
 */
async function launchAndSettle() {
  await device.launchApp(LAUNCH_OPTS);

  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await device.disableSynchronization();
      await exists('canary-root', SETTLE_TIMEOUT);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

describe('the canary journey', () => {
  beforeAll(launchAndSettle, HOOK_TIMEOUT);

  it('drives one shared store from two sibling components', async () => {
    await expect(element(by.id('count'))).toHaveText('0');

    await visible('increment');
    await element(by.id('increment')).tap();
    await waitFor(element(by.id('count')))
      .toHaveText('1')
      .withTimeout(TIMEOUT);
    await expect(element(by.id('doubled'))).toHaveText('doubled: 2');
    await expect(element(by.id('history'))).toHaveText('recent: 1');

    await visible('increment');
    await element(by.id('increment')).tap();
    await waitFor(element(by.id('count')))
      .toHaveText('2')
      .withTimeout(TIMEOUT);
    await expect(element(by.id('doubled'))).toHaveText('doubled: 4');

    await visible('reset');
    await element(by.id('reset')).tap();
    await waitFor(element(by.id('count')))
      .toHaveText('0')
      .withTimeout(TIMEOUT);
  });

  /**
   * The list is the bottom band of the screen, so this journey runs before the
   * one that focuses the text input: the keyboard covers exactly that band and
   * would hide the rows for every journey after it.
   */
  it('renders the list and virtualizes its rows', async () => {
    await visible('list-row-one');
    // A virtualized list only keeps the visible rows in the native hierarchy, so
    // the last row cannot be asserted directly: the search action scrolls the
    // container until the row exists and is visible. This chain is not timed out
    // here because `withTimeout` only exists on the plain assertion branch of
    // `waitFor`, not after `whileElement(...).scroll(...)`; the suite's overall
    // `testTimeout` covers it.
    await waitFor(element(by.id('list-row-six')))
      .toBeVisible()
      .whileElement(by.id('list'))
      .scroll(300, 'down');
  });

  it('calls the native APIs behind the seam', async () => {
    await visible('haptics-tap');
    await element(by.id('haptics-tap')).tap();
    await waitFor(element(by.id('store-message')))
      .toHaveText('asked for a medium impact')
      .withTimeout(TIMEOUT);

    await visible('store-save');
    await element(by.id('store-save')).tap();
    await waitFor(element(by.id('store-stored')))
      .not.toHaveText('stored: nothing')
      .withTimeout(TIMEOUT);

    await visible('store-clear');
    await element(by.id('store-clear')).tap();
    await waitFor(element(by.id('store-stored')))
      .toHaveText('stored: nothing')
      .withTimeout(TIMEOUT);
  });

  /**
   * Last on purpose: focusing the input raises the keyboard, which covers the
   * band of the screen the list journey above needs to scroll.
   */
  it('binds a native input to the store with v-model', async () => {
    await visible('name-input');
    await element(by.id('name-input')).typeText('Ada');
    await waitFor(element(by.id('greeting')))
      .toHaveText('hello Ada')
      .withTimeout(TIMEOUT);
  });
});
