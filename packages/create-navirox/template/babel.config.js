// Inline `process.env.DEBUG` at bundle time so the @symbiote diagnostic logs can
// be toggled from the shell without a dependency:
//   DEBUG=1 npx react-native start --reset-cache
// The value is read from Metro's own environment when this config is evaluated
// and baked into every transformed module (the app entry and the shared source).
const debugFlag = process.env.DEBUG === '1' ? '1' : '0';

const { withVueFastRefresh } = require('@navirox/metro-preset');

function inlineDebugFlag({ types: t }) {
  return {
    name: 'inline-debug-flag',
    visitor: {
      MemberExpression(path) {
        if (path.matchesPattern('process.env.DEBUG')) {
          path.replaceWith(t.stringLiteral(debugFlag));
        }
      },
    },
  };
}

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Fast Refresh for single file components. The plugin runs on the module the
  // Vue transformer produced, which is why it activates on the `.vue.tsx` name
  // that transformer re-labels its output with, and not on `.vue`. It adds only
  // `__hmrId`, the registration with Vue's HMR runtime and a `module.hot.accept`
  // call, all of them behind `typeof` guards, so a production bundle evaluates
  // the same module it would have evaluated without it.
  plugins: [inlineDebugFlag, withVueFastRefresh],
};
