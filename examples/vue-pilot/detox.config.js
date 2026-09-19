/**
 * Detox e2e config for the migration pilot.
 *
 * Detox attaches at the stock React Native host, below the renderer that the
 * runtime provider swaps out, so this is the same wiring any RN app uses. Two
 * configurations: `ios.sim.debug` (the fast local loop) and `android.emu.debug`.
 * The test JS runs on the host machine; the app side is native only.
 *
 * The `start` script is not optional. Detox launches the app binary as-is, so
 * nothing is serving the JS bundle unless Metro is up: without `react-native
 * start` the device dies with RN's "Unable to load script". On Android
 * `reversePorts` maps the device's `localhost:8081` back to the host Metro
 * through `adb reverse`, which is why the port is named twice.
 *
 * Both device targets are machine-specific: a simulator name and an AVD name
 * only exist on the machine that made them. CI overrides them through the
 * environment instead of carrying a second config file, so the wiring under
 * test stays identical on both sides. The defaults are the ones this repo is
 * developed on.
 *
 * The pilot and the canary each carry their own bundle identity (`VuePilot`
 * against `VueBasic`) so that both can be installed on one machine without one
 * replacing the other, and their journeys can run in sequence.
 *
 * @type {Detox.DetoxConfig}
 */
const IOS_SIMULATOR = process.env.NAVIROX_IOS_SIMULATOR ?? 'iPhone 17';
const ANDROID_AVD = process.env.NAVIROX_ANDROID_AVD ?? 'atable_pixel';

module.exports = {
  testRunner: { args: { config: 'e2e/jest.config.js', _: ['e2e'] } },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/VuePilot.app',
      build:
        'xcodebuild -workspace ios/VuePilot.xcworkspace -UseNewBuildSystem=NO -scheme VuePilot -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
      start: 'react-native start',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android ; ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug ; cd -',
      start: 'react-native start',
      reversePorts: [8081],
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: IOS_SIMULATOR } },
    emulator: {
      type: 'android.emulator',
      // avdName must match a local AVD (`emulator -list-avds`).
      device: { avdName: ANDROID_AVD },
      reversePorts: [8081],
    },
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' },
  },
};
