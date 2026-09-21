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
  type NativeDriverOptions,
  type NativePlatform,
  type WebDriverOptions,
} from './drivers.js'
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
