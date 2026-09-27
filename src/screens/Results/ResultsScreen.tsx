import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LearningObject } from '../../components/LearningObject/LearningObject';
import { Screen } from '../../components/Screen/Screen';
import { SoftButton } from '../../components/SoftButton/SoftButton';
import type { Lesson } from '../../lesson/types';
import { spacing, textStyles, touchTarget, ui } from '../../theme';

interface ResultsScreenProps {
  lesson: Lesson;
  /** Run the same lesson again from the start. */
  onRepeat: () => void;
  /**
   * Move on to the next lesson in this subject. Undefined at the end of a
   * subject, and the button is then simply not shown.
   */
  onNext?: () => void;
  onHome: () => void;
}

/**
 * The end of a lesson.
 *
 * "Results" is a slightly misleading name inherited from the folder structure —
 * there is no result. No score, no stars, no time taken, no "3 of 3 correct",
 * no comparison to last time. A child who needed six tries and a child who
 * needed one see exactly the same screen, because repetition is how this works
 * and being slower at it is not a worse outcome.
 *
 * What it does offer is the single most valuable thing for learning at this
 * age: an easy way to do it again.
 */
export function ResultsScreen({
  lesson,
  onRepeat,
  onNext,
  onHome,
}: ResultsScreenProps) {
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;

  return (
    <Screen>
      <View style={styles.body}>
        <LearningObject
          visual={lesson.concept.visual}
          accessibilityLabel={lesson.concept.name}
          size={isTablet ? 260 : touchTarget.comfortable}
        />
        {/* "We looked at red." / "We looked at 3." / "We looked at the dog."
            The content supplies the last one — see `inSentence` in
            `lesson/types.ts`. Lower-casing the name is the right default for a
            colour or a numeral, and wrong for any noun that needs an article,
            which is not something a screen should be guessing at. */}
        <Text style={styles.message}>
          We looked at{' '}
          {lesson.concept.inSentence ?? lesson.concept.name.toLowerCase()}.
        </Text>
      </View>

      <View style={styles.actions}>
        {/* "Again" comes first and is the primary action, because repeating is
            the point rather than a consolation.

            "Next" is deliberately the quiet one. Every other children's app
            makes advancing the loud button, which teaches a child that the
            point is to get through things. Here, moving on is available to
            whoever wants it and doing it again is what the screen suggests.

            And nothing advances on its own. An adult decides when the next
            lesson starts. */}
        <SoftButton label="Again" onPress={onRepeat} />
        {onNext ? (
          <SoftButton label="Next" variant="quiet" onPress={onNext} />
        ) : null}
        <SoftButton label="Home" variant="quiet" onPress={onHome} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  message: {
    ...textStyles.title,
    color: ui.ink,
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
});
