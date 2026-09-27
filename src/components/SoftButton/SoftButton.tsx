import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useGentleEntrance, usePressFeel } from '../../animation/transitions';
import {
  cardSurface,
  radius,
  spacing,
  textStyles,
  touchTarget,
  ui,
} from '../../theme';

interface SoftButtonProps {
  label: string;
  onPress: () => void;
  /**
   * 'primary' — the obvious next thing to do.
   * 'quiet'   — a secondary option that should not compete.
   */
  variant?: 'primary' | 'quiet';
}

/**
 * The app's only button.
 *
 * Buttons are for adults and for ending things — a child's interaction is
 * touching the learning object itself, never a button. Keeping one button
 * component means those adult-facing moments look consistent and stay visually
 * quieter than the lesson content.
 */
export function SoftButton({
  label,
  onPress,
  variant = 'primary',
}: SoftButtonProps) {
  const isPrimary = variant === 'primary';

  // Buttons in this app usually appear partway through a screen's life — for
  // example once narration has finished. Fading in rather than popping into
  // existence keeps that from being a jolt.
  const entranceStyle = useGentleEntrance();

  // Only the primary variant has a card to sink. A quiet button is flat by
  // definition — see `styles.quiet`.
  const press = usePressFeel(isPrimary);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityLabel={label}>
      {/* Two nested views on purpose: the outer one owns the entrance fade,
          the inner one owns the press scale. Keeping them apart means the two
          animations cannot overwrite each other's transform. */}
      <Animated.View style={entranceStyle}>
        <Animated.View
          style={[
            styles.base,
            isPrimary ? styles.primary : styles.quiet,
            press.style,
          ]}>
          <Text
            style={[
              styles.label,
              isPrimary ? styles.labelPrimary : styles.labelQuiet,
            ]}>
            {label}
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    // A raised frosted pill. `cardSurface` sets no corner radius, so the
    // `radius.full` above survives and this stays a pill rather than a tile.
    ...cardSurface,
  },
  /**
   * Flat, transparent, and shadowless — the recessive variant.
   *
   * Leaving the quiet button without a card is the change doing its second job.
   * Once a raised card means "touchable", a flat control reads as the one you
   * are not being pushed toward, which is exactly what "Next" and "Home" should
   * be next to "Again".
   */
  quiet: {
    backgroundColor: 'transparent',
  },
  label: {
    ...textStyles.body,
  },
  labelPrimary: {
    color: ui.ink,
  },
  labelQuiet: {
    color: ui.inkSoft,
  },
});
