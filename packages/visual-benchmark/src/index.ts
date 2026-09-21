/**
 * Public surface of @memolabs-apps/visual-benchmark: the scenario contract,
 * the capture runners, and the normalized comparison used to review two
 * captures of the same screen.
 */
export {
  CaptureMissingError,
  CaptureUnavailableError,
  captureNativeDevice,
  captureWebChrome,
  type DeviceProcessRunner,
  type DeviceProfile,
  type DeviceRunOptions,
  type DeviceRunResult,
  type NativeDriverOptions,
  type NativePlatform,
  type WebDriverOptions,
} from './drivers.js'
export {
  DEVICE_HARNESS_DEPENDENCIES,
  DEVICE_HARNESS_DIRECTORY,
  DEVICE_HARNESS_FILES,
  deviceHarnessFile,
  writeDeviceHarness,
} from './device-harness.js'
export {
  StaleFixtureScreenError,
  compileFixtureScreen,
  type FixtureScreenCompilation,
  type FixtureScreenOptions,
} from './fixture-screen.js'
export {
  PngDecodeError,
  compareImages,
  decodePng,
  diffPixels,
  encodePng,
  normalizeImage,
  writeComparisonReview,
  type CaptureMask,
  type CompareOptions,
  type ComparisonResult,
  type ComparisonVerdict,
  type DecodedImage,
  type NormalizedImage,
  type ReviewPaths,
} from './measure.js'
export {
  ScenarioRunError,
  runScenario,
  type CaptureDriver,
  type CaptureOutcome,
  type ScenarioDrivers,
  type ScenarioRunContext,
  type ScenarioScreenRevision,
  type ScenarioMotionReport,
  type ScenarioRunReport,
} from './run.js'
export {
  validateScenario,
  type CaptureMoment,
  type ColourScheme,
  type ScenarioAction,
  type ScenarioCapture,
  type ScenarioIssue,
  type ScenarioMask,
  type ScenarioMotion,
  type VisualScenario,
} from './scenario.js'
