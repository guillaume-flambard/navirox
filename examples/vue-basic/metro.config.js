/**
 * Navirox Metro config for the example app.
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
 * and links it into `examples/vue-basic/node_modules` as a symlink. Metro's
 * default config watches and searches only the project root, so the symlink's
 * real target sits outside everything Metro is willing to look at, and the
 * bundle dies with "could not be found within the project or in these
 * directories" even though the package is clearly installed. Naming the
 * repository root in both lists puts the store back in reach.
 *
 * What it looks like without them is worth recording, because the failing
 * specifier is not one of ours: the first thing to break was
 * `@babel/runtime/helpers/interopRequireDefault`, which this app declares as a
 * devDependency and which pnpm links out of the root store like everything else.
 * `@navirox/metro-preset` sets neither key, because a published app installs
 * `@navirox/*` and their dependencies inside its own root and needs no help.
 */
const path = require('path');
const { getDefaultConfig } = require('@react-native/metro-config');
const { withNavirox } = require('@navirox/metro-preset');

const projectRoot = __dirname;
// Two levels up: examples/vue-basic, then examples, then the repository root.
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = withNavirox(getDefaultConfig(projectRoot));

config.watchFolders = [projectRoot, workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
