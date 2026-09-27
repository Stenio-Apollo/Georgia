import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing, ui } from '../../theme';

interface ProgressIndicatorProps {
  /** 1-based position. */
  current: number;
  total: number;
}

/**
 * A row of small dots showing where we are in the lesson.
 *
 * Kept deliberately plain: no percentage, no numbers, no fill animation, no
 * celebration when it completes. It is orientation for the adult, not a
 * reward for the child — the moment progress becomes something to *earn*, we
 * have built the gamified app we set out not to build.
 *
 * It is also not animated. The dots change between steps, which is already a
 * moment of change on screen; animating them too would add movement competing
 * with the learning object.
 */
export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  // Build a plain array [0, 1, 2, ...] to map over.
  const dots = Array.from({ length: total }, (_, index) => index);

  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current} of ${total}`}>
      {dots.map(index => (
        <View
          key={index}
          style={[
            styles.dot,
            index < current ? styles.dotReached : styles.dotAhead,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  dotReached: {
    backgroundColor: ui.inkSoft,
  },
  dotAhead: {
    backgroundColor: ui.border,
  },
});
