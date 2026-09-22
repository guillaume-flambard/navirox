/**
 * The migration pilot's journey: one spec, both platforms.
 *
 * The journey is the web pilot's journey (`pilots/vue-web`): the catalogue loads
 * from the store the CLI moved, a product is favourited, the header count and
 * the favourites view follow, one product opens on its own, and the favourite
 * outlives a relaunch.
 *
 * The harness mirrors `examples/vue-basic/e2e/canary.test.ts`, for the same
 * reason that file gives: the renderer registers a load idling resource, so
 * synchronization is disabled after launch and re-disabled while the first
 * bundle arrives. Containers assert existence, leaves assert visible, because
 * iOS never settles the visibility of a view with no drawn surface.
 *
 * The secure store survives a reinstall-free relaunch, so the first test
 * normalises the favourite state instead of assuming a clean install.
 */
import { by, device, element, expect, waitFor } from 'detox';

const TIMEOUT = 20000;
const SETTLE_TIMEOUT = 120000;
const HOOK_TIMEOUT = 480000;

const LAUNCH_OPTS = {
  newInstance: true,
  launchArgs: { detoxEnableSynchronization: 0 },
};

async function visible(id: string): Promise<void> {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .withTimeout(TIMEOUT);
}

async function exists(id: string, timeout = TIMEOUT): Promise<void> {
  await waitFor(element(by.id(id)))
    .toExist()
    .withTimeout(timeout);
}

async function launchAndSettle(): Promise<void> {
  await device.launchApp(LAUNCH_OPTS);
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await device.disableSynchronization();
      await exists('pilot-root', SETTLE_TIMEOUT);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function openProducts(): Promise<void> {
  await visible('open-products');
  await element(by.id('open-products')).tap();
  await exists('products', SETTLE_TIMEOUT);
}

async function ensureNotFavourited(id: number): Promise<void> {
  await exists(`toggle-${id}`, SETTLE_TIMEOUT);
  try {
    await waitFor(element(by.id(`toggle-label-${id}`)))
      .toHaveText('Remove favourite')
      .withTimeout(4000);
  } catch {
    return;
  }
  await element(by.id(`toggle-${id}`)).tap();
  await waitFor(element(by.id(`toggle-label-${id}`)))
    .toHaveText('Add favourite')
    .withTimeout(TIMEOUT);
}

describe('the migrated pilot journey', () => {
  beforeAll(launchAndSettle, HOOK_TIMEOUT);

  it('renders the product list from the migrated store', async () => {
    await openProducts();
    await waitFor(element(by.id('product-name-1')))
      .toHaveText('Aurora Lamp')
      .withTimeout(SETTLE_TIMEOUT);
    await expect(element(by.id('product-name-2'))).toExist();
  });

  it('favourites a product and shows it in the header and the favourites view', async () => {
    await ensureNotFavourited(1);
    await expect(element(by.id('favourites-count'))).toHaveText(
      'Favourites (0)',
    );

    await element(by.id('toggle-1')).tap();
    await waitFor(element(by.id('favourites-count')))
      .toHaveText('Favourites (1)')
      .withTimeout(TIMEOUT);
    await waitFor(element(by.id('toggle-label-1')))
      .toHaveText('Remove favourite')
      .withTimeout(TIMEOUT);

    await element(by.id('open-favourites')).tap();
    await exists('favourites', SETTLE_TIMEOUT);
    await waitFor(element(by.id('favourite-name-1')))
      .toHaveText('Aurora Lamp')
      .withTimeout(TIMEOUT);
  });

  it('opens one product from the list and shows its detail', async () => {
    await visible('open-products');
    await element(by.id('open-products')).tap();
    await exists('products', SETTLE_TIMEOUT);
    await waitFor(element(by.id('product-name-1')))
      .toBeVisible()
      .withTimeout(SETTLE_TIMEOUT);

    await element(by.id('product-open-1')).tap();
    await exists('product-detail', SETTLE_TIMEOUT);
    await waitFor(element(by.id('product-name')))
      .toHaveText('Aurora Lamp')
      .withTimeout(TIMEOUT);
    await expect(element(by.id('product-toggle-label'))).toHaveText(
      'Remove favourite',
    );

    await element(by.id('back')).tap();
    await exists('products', SETTLE_TIMEOUT);
  });

  it('keeps the favourite across a relaunch', async () => {
    await launchAndSettle();
    await waitFor(element(by.id('favourites-count')))
      .toHaveText('Favourites (1)')
      .withTimeout(SETTLE_TIMEOUT);
    await openProducts();
    await waitFor(element(by.id('toggle-label-1')))
      .toHaveText('Remove favourite')
      .withTimeout(TIMEOUT);
  });
});
