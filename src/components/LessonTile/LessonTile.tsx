import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useGentleEntrance, usePressFeel } from '../../animation/transitions';
import type { Lesson } from '../../lesson/types';
import { cardSurface, radius, spacing, textStyles, ui } from '../../theme';
import { getVisualColor } from '../../utils/visual';
import { LearningObject } from '../LearningObject/LearningObject';

interface LessonTileProps {
  lesson: Lesson;
  /** Size of the preview drawing inside the tile. */
  visualSize: number;
  /**
   * Height reserved for the drawing. The picker passes the same value to every
   * tile — the tallest any of its drawings needs — so the grid lines up without
   * each tile reserving a whole square it may not fill.
   */
  visualBoxHeight: number;
  /** Stagger the entrance so tiles do not all arrive at once. */
  entranceDelayMs?: number;
  onPress: () => void;
}

/**
 * One lesson in a subject's picker.
 *
 * A child who cannot read yet has to be able to choose, so the tile leads with
 * the thing itself — the red circle, the seven dots — and the written name sits
 * underneath as a smaller label. The drawing is the button; the word is a
 * caption for whoever is reading over the child's shoulder.
 *
 * Deliberately absent, as on the home screen: no tick for lessons already done,
 * no lock on lessons not reached, no ordering by "needs practice". All ten
 * numbers are open from the start. A child who wants to do "two" nine times in
 * a row is doing exactly the right thing, and a locked tile would say otherwise.
 */
export function LessonTile({
  lesson,
  visualSize,
  visualBoxHeight,
  entranceDelayMs = 0,
  onPress,
}: LessonTileProps) {
  const entranceStyle = useGentleEntrance(entranceDelayMs);
  const press = usePressFeel();

  // The name in its own colour, as on the introduction step. For a number
  // lesson this is the numeral in the counting brown.
  const nameColor = getVisualColor(lesson.concept.visual) ?? ui.ink;

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={lesson.concept.name}>
        <Animated.View style={[styles.tile, press.style]}>
          {/* The preview never animates or invites a touch — `state` stays at
              its default 'idle'. A grid of pulsing tiles would be exactly the
              kind of busy screen this app avoids. */}
          <View style={[styles.visual, { height: visualBoxHeight }]}>
            <LearningObject
              visual={lesson.concept.visual}
              accessibilityLabel={lesson.concept.name}
              size={visualSize}
            />
          </View>
          <Text style={[styles.name, { color: nameColor }]}>
            {lesson.concept.name}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    // The same reason the lesson screen's stack is generous: a coloured circle
    // with its name tight underneath, in that same colour, reads as one blob.
    // A tile is smaller than the lesson stage, so it takes one step less.
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    // A raised frosted card, which is how a grid of drawings reads as a grid of
    // things to choose rather than a page of pictures. Ten flat rectangles the
    // same colour as the page behind them said nothing about being touchable,
    // and a child who cannot read has only the shape to go on.
    ...cardSurface,
  },
  /**
   * The drawing gets a fixed height, set by the picker, so tiles line up in a
   * tidy grid whatever shape is inside them. Without it a row of one-dot tiles
   * would sit shorter than the two-row tiles beside them.
   */
  visual: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...textStyles.title,
  },
});
