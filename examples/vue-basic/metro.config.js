/**
 * Navirox Metro config. One line of intent: the preset composes the Vue SFC
 * transform and the CSS parser, so a `.vue` file and its `<style>` block both
 * reach the bundle.
 *
 * `withNavirox` rather than `createNaviroxConfig` because this app wants the
 * plain React Native defaults underneath. See `@navirox/metro-preset` for what
 * the preset wires, and for the collision it exists to avoid: the `expo`
 * meta-package ships its own Metro config and Babel preset, and both fight this
 * pipeline, so Navirox never depends on it.
 */
const { getDefaultConfig } = require('@react-native/metro-config');
const { withNavirox } = require('@navirox/metro-preset');

module.exports = withNavirox(getDefaultConfig(__dirname));
