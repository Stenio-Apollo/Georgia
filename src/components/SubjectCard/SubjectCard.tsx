import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { opacityTo } from '../../animation/constants';
import { useGentleEntrance, usePressFeel } from '../../animation/transitions';
import {
  cardSurface,
  radius,
  spacing,
  textStyles,
  touchTarget,
  ui,
} from '../../theme';

interface SubjectCardProps {
  title: string;
  /** Parent-facing hint at what is inside, e.g. "Red, blue, yellow, green". */
  description: string;
  accentColor: string;
  /** False for subjects with no lessons written yet. */
  isAvailable: boolean;
  /** Stagger the entrance slightly so cards do not all arrive at once. */
  entranceDelayMs?: number;
  onPress: () => void;
}

/**
 * One learning area on the home screen.
 *
 * The aim is "a door into a small world", not "a level select button". So:
 * no icons competing with the title, no progress bar, no lock badge, no count
 * of lessons completed. A wide calm card, a title, and a colour that belongs
 * to that subject.
 *
 * Subjects with nothing in them yet are shown rather than hidden, dimmed and
 * marked "Soon". A child sees three consistent doors every time they open the
 * app, which matters more for a sense of place than hiding the empty ones.
 */
export function SubjectCard({
  title,
  description,
  accentColor,
  isAvailable,
  entranceDelayMs = 0,
  onPress,
}: SubjectCardProps) {
  const entranceStyle = useGentleEntrance(entranceDelayMs);
  const press = usePressFeel();

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        onPress={onPress}
        disabled={!isAvailable}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={
          isAvailable ? title : `${title}, not available yet`
        }
        accessibilityState={{ disabled: !isAvailable }}>
        {/* `cardUnavailable` comes last on purpose: it has to win over the
            press style's resting shadow, so a "Soon" door goes flat as well as
            dim. A raised card that cannot be opened is the worst of both. */}
        <Animated.View
          style={[
            styles.card,
            press.style,
            !isAvailable && styles.cardUnavailable,
          ]}>
          {/* A soft bar of the subject's colour, standing in for an icon. */}
          <View style={[styles.accent, { backgroundColor: accentColor }]} />
          <View style={styles.textBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>
              {isAvailable ? description : 'Soon'}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.comfortable,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.lg,
    // Raised and frosted, because it opens. See `cardSurface`.
    ...cardSurface,
  },
  cardUnavailable: {
    opacity: opacityTo.dimmed,
    shadowOpacity: 0,
    elevation: 0,
  },
  accent: {
    width: 10,
    height: 56,
    borderRadius: radius.full,
  },
  textBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...textStyles.title,
    color: ui.ink,
  },
  description: {
    ...textStyles.caption,
    color: ui.inkSoft,
  },
});
