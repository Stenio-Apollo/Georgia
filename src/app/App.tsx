import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AudioProvider } from '../audio/AudioProvider';
import { Router } from './Router';

/**
 * The root of the app. Providers and nothing else.
 *
 * Note there is no dark mode. The React Native template started with
 * `useColorScheme()` and switched between light and dark, and that has been
 * removed on purpose: this app has one deliberate warm palette, and a cream
 * picture-book background is the whole visual premise. A dark variant would be
 * a second design system to maintain for no benefit to a two-year-old.
 *
 * `StatusBar` is set to dark content because the background is always light.
 * (There is no `backgroundColor` here: React Native 0.87 dropped that prop,
 * since Android now draws edge-to-edge and the screen's own background shows
 * through instead.)
 */
export function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      {/* Provides the single shared audio player to every screen. */}
      <AudioProvider>
        <Router />
      </AudioProvider>
    </SafeAreaProvider>
  );
}

export default App;
