/**
 * Navirox Metro config for the migration pilot.
 *
 * The line of intent is the same one the template carries: the preset composes
 * the Vue SFC transform and the CSS parser, so a `.vue` file and its `<style>`
 * block both reach the bundle.
 *
 * The `watchFolders` and `nodeModulesPaths` lines below are not part of that
 * intent, and they are the one place this file deliberately differs from
 * `packages/create-navirox/template/metro.config.js`. They exist because this
 * app is a pnpm workspace member:
 *
 * pnpm installs every package into a virtual store at `<repo>/node_modules/.pnpm`
 * and links it into `examples/vue-pilot/node_modules` as a symlink. Metro's
 * default config watches and searches only the project root, so the symlink's
 * real target sits outside everything Metro is willing to look at, and the
 * bundle dies with "could not be found within the project or in these
 * directories" even though the package is clearly installed. Naming the
 * repository root in both lists puts the store back in reach.
 */
const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withNavirox } = require('@memolabs-apps/metro-preset');

const projectRoot = __dirname;
// Two levels up: examples/vue-pilot, then examples, then the repository root.
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = withNavirox(getDefaultConfig(projectRoot));

config.watchFolders = [projectRoot, workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
