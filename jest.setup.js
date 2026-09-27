/* eslint-env jest */
/**
 * Jest setup.
 *
 * Reanimated and safe-area-context both talk to native code that does not
 * exist in a Node test process, so each ships a mock for exactly this purpose.
 * Without these, any test that renders the app crashes before it starts.
 *
 * Note this only affects tests. The real implementations are used in the app.
 */

// Reanimated's own mock: hooks and animation helpers become no-ops that apply
// their target value immediately. Animations do not "run" in tests, which is
// what we want — we test behaviour, not tweens.
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// Provides fixed, non-zero safe-area insets. The real provider measures the
// device and renders nothing until it has, which in a test means forever.
//
// Note the `.default`: this package puts its whole mock on the default export,
// so without it every named import (SafeAreaProvider, SafeAreaView) would come
// back undefined and React would complain about an invalid element type.
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);
