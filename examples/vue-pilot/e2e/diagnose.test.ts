/**
 * A temporary diagnostic for the emulator-only failure of the favourites journey.
 *
 * The journey taps the header tab `open-favourites` and waits for the favourites view. That wait
 * times out on the Android emulator while the same journey passes on the iOS simulator, so this
 * test records what the emulator actually shows: the display geometry, the status bar, the view
 * hierarchy around the header and which of the favourites identifiers exist after the tap. It is
 * not a product test, it asserts nothing, and it is deleted once the failure is understood.
 */
import { execSync } from 'node:child_process';
import { by, device, element, waitFor } from 'detox';

const TIMEOUT = 20000;
const SETTLE_TIMEOUT = 120000;
const VIEWS = [
  'products',
  'favourites',
  'favourites-empty',
  'favourites-loading',
  'product-detail',
];

function adb(command: string): string {
  try {
    return execSync(`adb shell ${command}`, {
      encoding: 'utf8',
      timeout: 60000,
    }).trim();
  } catch (error) {
    return `adb failed: ${String(error)}`;
  }
}

async function present(ids: readonly string[]): Promise<string> {
  const found: string[] = [];

  for (const id of ids) {
    try {
      await waitFor(element(by.id(id)))
        .toExist()
        .withTimeout(2000);
      found.push(id);
    } catch {
      // An absent identifier is the finding.
    }
  }

  return found.length === 0 ? 'none' : found.join(',');
}

it('records what the emulator shows around the header tab', async () => {
  await device.launchApp({
    newInstance: true,
    launchArgs: { detoxEnableSynchronization: 0 },
  });

  try {
    await device.disableSynchronization();
  } catch {
    // The renderer re-arms synchronization while the first bundle arrives.
  }

  await waitFor(element(by.id('pilot-root')))
    .toExist()
    .withTimeout(SETTLE_TIMEOUT);
  await waitFor(element(by.id('open-favourites')))
    .toExist()
    .withTimeout(TIMEOUT);

  console.log(`DIAG geometry: ${adb('wm size; wm density')}`);
  console.log(
    `DIAG cutout: ${adb('dumpsys window displays | grep -i -A2 cutout')}`,
  );
  console.log(
    `DIAG statusbar: ${adb("dumpsys window windows | grep -i -A6 'StatusBar'")}`,
  );
  console.log(
    `DIAG focus: ${adb('dumpsys window | grep -iE "mCurrentFocus|mFocusedApp"')}`,
  );
  console.log(`DIAG present before: ${await present(VIEWS)}`);
  console.log(
    `DIAG hierarchy before: ${adb('uiautomator dump /sdcard/diag-before.xml >/dev/null; cat /sdcard/diag-before.xml').slice(0, 20000)}`,
  );

  await element(by.id('open-favourites')).tap();
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log(`DIAG present after: ${await present(VIEWS)}`);
  console.log(
    `DIAG hierarchy after: ${adb('uiautomator dump /sdcard/diag-after.xml >/dev/null; cat /sdcard/diag-after.xml').slice(0, 20000)}`,
  );
});
