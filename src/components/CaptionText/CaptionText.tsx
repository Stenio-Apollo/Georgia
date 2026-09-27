import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeInOnChange } from '../../animation/transitions';
import { fontSize, spacing, textStyles, ui } from '../../theme';

interface CaptionTextProps {
  /** The line currently being spoken, or null for silence. */
  text: string | null;
}

/**
 * Shows the words being spoken.
 *
 * This exists for the adult, not the child — a toddler cannot read it. It lets
 * a parent sitting alongside know exactly what the app just said so they can
 * repeat it, answer a question about it, or carry the idea off-screen. That is
 * the "encourage parent/child interaction" requirement made concrete.
 *
 * The container keeps a fixed height whether or not there is text, so the
 * layout never shifts when a caption appears or goes. Content jumping around
 * is one of the most agitating things an interface can do.
 */
export function CaptionText({ text }: CaptionTextProps) {
  const fadeStyle = useFadeInOnChange(text);

  return (
    <View style={styles.container}>
      {text ? (
        <Animated.Text style={[styles.text, fadeStyle]}>{text}</Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Room for two lines, reserved permanently.
    minHeight: (fontSize.body + 7) * 1.45 * 2,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    transform: [{ translateY: -7 }],
  },
  text: {
    ...textStyles.body,
    fontSize: fontSize.body + 7,
    lineHeight: (fontSize.body + 7) * 1.45,
    color: ui.inkSoft,
    textAlign: 'center',
  },
});
