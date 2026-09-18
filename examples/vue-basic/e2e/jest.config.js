/**
 * Jest config for the Detox e2e layer.
 *
 * Detox's runners are jest or mocha, never vitest, so jest appears here scoped
 * to `e2e/` only. The unit layer of this repository is vitest and lives in the
 * packages, so the two runners never collect each other's files.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  rootDir: '.',
  maxWorkers: 1,
  testTimeout: 120000,
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  testEnvironment: 'detox/runners/jest/testEnvironment',
  setupFilesAfterEnv: ['./setup.ts'],
  reporters: ['detox/runners/jest/reporter'],
  transform: {
    '\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  verbose: true,
};
