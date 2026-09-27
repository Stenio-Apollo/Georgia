module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Required by react-native-reanimated v4.
    // In Reanimated 4 the Babel plugin moved out of `react-native-reanimated`
    // and into the `react-native-worklets` package. It rewrites functions
    // marked with 'worklet' so they can run on the UI thread.
    // This MUST stay last in the plugins array.
    'react-native-worklets/plugin',
  ],
};
