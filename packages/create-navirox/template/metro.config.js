/**
 * Navirox Metro config. One line of intent: the preset composes the Vue SFC
 * transform and the CSS parser, so a `.vue` file and its `<style>` block both
 * reach the bundle.
 *
 * `withNavirox` rather than `createNaviroxConfig` because this app wants the
 * plain React Native defaults underneath. See `@memolabs-apps/metro-preset` for what
 * the preset wires, and for the collision it exists to avoid: the `expo`
 * meta-package ships its own Metro config and Babel preset, and both fight this
 * pipeline, so Navirox never depends on it.
 *
 * There is deliberately no `watchFolders` / `nodeModulesPaths` wiring here. That
 * is a pnpm workspace concern, and it is the one place this file is meant to
 * differ from `examples/vue-basic`, which is a workspace member and carries it.
 * An app scaffolded from this template installs `@memolabs-apps/*` and everything
 * those packages need into its own `node_modules`, so Metro's defaults already
 * reach it and adding the lines would only make the file look like it needs
 * something it does not.
 */
const { getDefaultConfig } = require('@react-native/metro-config');
const { withNavirox } = require('@memolabs-apps/metro-preset');

module.exports = withNavirox(getDefaultConfig(__dirname));
