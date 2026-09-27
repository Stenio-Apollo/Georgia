import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, textStyles, ui } from '../../theme';
import { ProgressIndicator } from '../ProgressIndicator/ProgressIndicator';

interface LessonHeaderProps {
  progress: { current: number; total: number };
  onClose: () => void;
}

/**
 * The quiet strip at the top of a lesson: a way out, and a sense of place.
 *
 * The close control is the one thing in this entire app that is intentionally
 * SMALL and low-contrast. Everywhere else we want large, obvious, generous
 * touch targets — here we want the opposite. A big, inviting exit button in
 * the corner of a toddler's screen gets pressed constantly and by accident,
 * and the lesson never finishes.
 *
 * So it is sized for an adult finger that is looking for it (44pt, Apple's
 * minimum) and coloured to recede. A parent finds it immediately; a child
 * exploring the screen mostly does not.
 */
export function LessonHeader({ progress, onClose }: LessonHeaderProps) {
  return (
    <View style={styles.row}>
      <ProgressIndicator current={progress.current} total={progress.total} />
      <Pressable
        onPress={onClose}
        style={styles.closeButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close lesson">
        <Text style={styles.closeLabel}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  closeLabel: {
    ...textStyles.caption,
    color: ui.inkSoft,
  },
});
