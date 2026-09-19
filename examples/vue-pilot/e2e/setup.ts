// Each test file owns its own `device.launchApp()`. There is no shared
// warm-launch here on purpose: a launch in the global setup would run before
// any test has chosen its launch arguments, and a suite that needs different
// arguments per file could never undo it. This file is the seam for future
// cross-suite setup only.
export {};
