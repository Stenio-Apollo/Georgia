const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Metro is React Native's bundler — the thing that turns all of `src/` into
 * one JavaScript file the app can run, and that reloads it while you develop.
 *
 * The Reanimated wrapper is optional but worth having: it hides Reanimated's
 * own internal frames from error stack traces, so when something goes wrong
 * the top of the stack is *your* component rather than twenty lines of library
 * code. Purely a debugging convenience — it changes nothing about the app.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {};

module.exports = wrapWithReanimatedMetroConfig(
  mergeConfig(getDefaultConfig(__dirname), config),
);
