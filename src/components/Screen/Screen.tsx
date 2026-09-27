import React from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, ui } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * The outer frame for every screen.
 *
 * It does two small but important things: it applies the warm background
 * everywhere so no screen is accidentally white, and it keeps content clear of
 * the notch and home indicator. Having this in one place means a new screen
 * cannot forget either.
 */
export function Screen({ children, style }: ScreenProps) {
  return (
    <SafeAreaView style={[styles.root, style]} edges={['top', 'bottom']}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ui.background,
    paddingHorizontal: spacing.lg,
  },
});
