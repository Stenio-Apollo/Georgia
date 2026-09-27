import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { AnswerChoice } from '../../lesson/types';
import {
  LearningObject,
  type LearningObjectState,
} from '../LearningObject/LearningObject';

interface AnswerOptionProps {
  choice: AnswerChoice;
  /** False while narration is playing, so taps are ignored until it finishes. */
  isEnabled: boolean;
  /** This choice has already been tried and was not the answer. */
  isAlreadyTried: boolean;
  /** This choice was just chosen and was correct. */
  isConfirmed: boolean;
  size: number;
  /**
   * Applied to the drawing itself, which sits *inside* the Pressable — so a
   * tray or card drawn here is part of the touch target rather than a decoration
   * around it, and it moves with the press instead of the object sliding about
   * on top of it.
   */
  style?: StyleProp<ViewStyle>;
  onPress: (choiceId: string) => void;
}

/**
 * One tappable choice in a question.
 *
 * Its only real job is translating lesson state into a visual state, which is
 * worth a component of its own because getting it wrong is easy and the
 * consequences are exactly what this app is trying to avoid.
 *
 * Note what it deliberately does NOT do: an enabled choice is 'idle', not
 * 'interactive'. Three pulsing circles would be three competing animations
 * fighting for attention, which breaks both "one thing at a time" and "avoid
 * simultaneous unrelated animations". Only the single object in a guided step
 * pulses, because there it means "this one, touch this".
 */
export function AnswerOption({
  choice,
  isEnabled,
  isAlreadyTried,
  isConfirmed,
  size,
  style,
  onPress,
}: AnswerOptionProps) {
  const visualState: LearningObjectState = isConfirmed
    ? 'confirmed'
    : isAlreadyTried
    ? 'receded'
    : 'idle';

  return (
    <LearningObject
      visual={choice.visual}
      accessibilityLabel={choice.label}
      // Undefined for colours and animals, so nothing is written beside them.
      // A counting choice carries its numeral. See `AnswerChoice.name`.
      name={choice.name}
      size={size}
      style={style}
      state={visualState}
      // A previously tried choice stays tappable. Locking it out would turn a
      // wrong answer into a punishment, and a child may well want to touch it
      // again while working it out.
      disabled={!isEnabled}
      onPress={() => onPress(choice.id)}
    />
  );
}
