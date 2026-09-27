module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],

  /**
   * Reanimated ships its own Jest resolver, and it is required.
   *
   * Reanimated and Worklets both keep `.native.ts` versions of files that call
   * into native code. In a test there is no native code, so this resolver
   * points those imports at the non-native versions instead. Without it you
   * get errors from deep inside `NativeWorklets` the moment anything imports
   * Reanimated.
   */
  resolver: 'react-native-reanimated/jest/resolver',

  /**
   * Jest ignores `node_modules` when transforming code, but some React Native
   * libraries ship untranspiled sources that Node cannot run as-is —
   * Reanimated's own Jest mock is written in TypeScript, for instance. The
   * pattern below is the React Native preset's default with Reanimated and
   * Worklets added to the list of packages Babel is allowed to process.
   *
   * The `(?!...)` is a negative lookahead: "ignore everything in node_modules
   * EXCEPT these". Getting this wrong produces a confusing
   * "Cannot use import statement outside a module" error.
   */
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-reanimated|react-native-worklets)/)',
  ],
};
