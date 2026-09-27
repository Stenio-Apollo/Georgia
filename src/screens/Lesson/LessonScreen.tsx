import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AnswerOption } from '../../components/AnswerOption/AnswerOption';
import { CaptionText } from '../../components/CaptionText/CaptionText';
import {
  LearningObject,
  NAME_GUTTER,
  type LearningObjectState,
} from '../../components/LearningObject/LearningObject';
import { LessonHeader } from '../../components/LessonHeader/LessonHeader';
import { Screen } from '../../components/Screen/Screen';
import { SoftButton } from '../../components/SoftButton/SoftButton';
import { useLessonEngine } from '../../lesson/useLessonEngine';
import type { Lesson, LessonStep } from '../../lesson/types';
import {
  cardSurface,
  radius,
  spacing,
  textStyles,
  touchTarget,
  ui,
} from '../../theme';
import { getVisualColor } from '../../utils/visual';

interface LessonScreenProps {
  lesson: Lesson;
  /** Leave the lesson early. */
  onExit: () => void;
  /** The lesson reached its end. */
  onFinished: () => void;
}

/**
 * Runs one lesson.
 *
 * Notice how little this file decides. It does not know that red comes before
 * the question, how long to pause, what counts as correct, or what to say when
 * a child gets it wrong. All of that is in the engine and in the lesson data.
 *
 * This screen answers exactly one question: given the current step and phase,
 * what should be on the screen? That is why adding BLUE needs no changes here.
 */
export function LessonScreen({
  lesson,
  onExit,
  onFinished,
}: LessonScreenProps) {
  const engine = useLessonEngine(lesson);
  const { width } = useWindowDimensions();
  const isLargeImageLesson =
    lesson.concept.subject === 'animals' || lesson.concept.subject === 'planets';

  /**
   * How big each answer option is, which depends on how they are arranged.
   *
   * Every choice sits on a tray — a raised frosted card, the app's word for
   * "you can touch this" — so both branches size the tray first and then give
   * the drawing what is left inside it.
   *
   * ROW (the default, used by the colour lessons): three across. The screen has
   * `spacing.lg` padding either side, and the two gaps between options are
   * `spacing.md` rather than `lg` — a tray has a visible edge of its own, so it
   * needs less empty space around it to read as separate, and the width that
   * buys back goes to the drawing. Capped so it does not become silly on a
   * tablet.
   *
   * COLUMN (used by the counting lessons): stacked, so each option gets the
   * full content width. That width is what makes ten dots countable — squeezed
   * into a third of a phone's width they would be a smudge. The drawing gets
   * the tray's width less its padding and less the numeral column, because a
   * stacked choice writes its number beside its dots and that numeral needs
   * room the dots cannot also have.
   */
  const rowTrayWidth = Math.min(
    isLargeImageLesson ? 240 : touchTarget.comfortable,
    (width - spacing.lg * 2 - spacing.md * 2) / 3,
  );
  const rowOptionSize = rowTrayWidth - spacing.sm * 2;
  const animalVisualSize = Math.min(320, width - spacing.lg * 2);
  const columnTrayWidth = Math.min(360, width - spacing.lg * 2);
  const columnOptionSize = columnTrayWidth - spacing.md * 2 - NAME_GUTTER;

  /**
   * Tell the router the lesson is over — exactly once.
   *
   * The ref matters. Without it, every re-render after finishing would call
   * `onFinished()` again, and since the router creates a new route object each
   * time, that would loop. A ref is a value that survives re-renders without
   * causing one, which is what "has this already happened?" needs.
   */
  const hasReportedFinish = useRef(false);
  useEffect(() => {
    if (engine.isFinished && !hasReportedFinish.current) {
      hasReportedFinish.current = true;
      onFinished();
    }
  }, [engine.isFinished, onFinished]);

  const conceptColor = getVisualColor(lesson.concept.visual) ?? ui.ink;

  /** The concept's written name, in its own colour. Like a flash card. */
  const conceptName = (
    <Text style={[styles.conceptName, { color: conceptColor }]}>
      {lesson.concept.name}
    </Text>
  );

  function renderStep(step: LessonStep) {
    switch (step.type) {
      // SHOW AND NAME IT. Nothing is tappable; the child just watches.
      case 'introduction':
        return (
          <View style={styles.centered}>
            <LearningObject
              visual={lesson.concept.visual}
              accessibilityLabel={lesson.concept.name}
              size={isLargeImageLesson ? animalVisualSize : undefined}
            />
            {conceptName}
          </View>
        );

      // "CAN YOU TOUCH RED?" One thing on screen, and it is the answer.
      //
      // The name stays under it, exactly as on the introduction step. The
      // counting lessons are why: "7" is not a label for the seven dots, it is
      // half of what the lesson teaches, and a numeral that vanishes the moment
      // the child is asked to do something is the one moment it would have been
      // looked at hardest. It is outside the Pressable, so the drawing is still
      // the only tap target.
      case 'guided': {
        const state: LearningObjectState = engine.lastResponse?.isCorrect
          ? 'confirmed'
          : engine.canInteract
          ? // Pulses a few times to say "you can touch me", then goes still.
            'interactive'
          : 'idle';

        return (
          <View style={styles.centered}>
            <LearningObject
              visual={lesson.concept.visual}
              accessibilityLabel={lesson.concept.name}
              size={isLargeImageLesson ? animalVisualSize : undefined}
              state={state}
              disabled={!engine.canInteract}
              onPress={() => engine.selectChoice(lesson.concept.id)}
            />
            {conceptName}
          </View>
        );
      }

      // "CAN YOU FIND RED?" Three choices, evenly spaced, none highlighted.
      case 'question': {
        // The lesson data says how to arrange them; this screen does not guess
        // from the visuals. See `choiceLayout` in `src/lesson/types.ts`.
        const isColumn = step.question.choiceLayout === 'column';

        return (
          <View style={isColumn ? styles.optionColumn : styles.optionRow}>
            {step.question.choices.map(choice => (
              <AnswerOption
                key={choice.id}
                choice={choice}
                size={isColumn ? columnOptionSize : rowOptionSize}
                // Every choice gets a tray; only its width and padding differ
                // by layout. See `optionTray` below.
                style={
                  isColumn
                    ? [styles.optionTray, { width: columnTrayWidth }]
                    : [styles.optionTrayRow, { width: rowTrayWidth }]
                }
                isEnabled={engine.canInteract}
                isAlreadyTried={engine.wrongChoiceIds.includes(choice.id)}
                isConfirmed={
                  engine.lastResponse?.choiceId === choice.id &&
                  engine.lastResponse.isCorrect
                }
                onPress={engine.selectChoice}
              />
            ))}
          </View>
        );
      }

      // CLOSE QUIETLY. The button appears only once the last line has been
      // spoken, and nothing moves on by itself — an adult ends the lesson.
      case 'completion':
        return (
          <View style={styles.centered}>
            <LearningObject
              visual={lesson.concept.visual}
              accessibilityLabel={lesson.concept.name}
              size={
                isLargeImageLesson ? animalVisualSize : touchTarget.comfortable
              }
            />
            {conceptName}
            {engine.state.phase === 'settled' ? (
              <SoftButton label="Finish" onPress={engine.advance} />
            ) : null}
          </View>
        );
    }
  }

  return (
    <Screen>
      <LessonHeader progress={engine.progress} onClose={onExit} />

      {/* The stage: one learning objective, centred, with room around it. */}
      <View style={styles.stage}>
        {engine.step ? renderStep(engine.step) : null}
      </View>

      {/* What was just said, for the adult in the room. */}
      <CaptionText text={engine.caption} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /**
   * The vertical rhythm of a step: object, name, and on the last step a button.
   *
   * The gap is `xxl` rather than `xl` because of the colour lessons. A solid
   * red disc with the word "Red" in the same red close underneath reads as one
   * shape with a tail, not as a thing and its name — and the name is doing real
   * work here, so the two need to be legibly separate before a child can
   * connect them. What looks like extra whitespace is the connection being made
   * visible.
   */
  centered: {
    alignItems: 'center',
    gap: spacing.xxl,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Narrower than the stacked layout's gap because each tray now has its own
    // edge. See the sizing note at the top of this file.
    gap: spacing.md,
  },
  optionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  /**
   * The tray a stacked choice sits on.
   *
   * This is not decoration, it is the fix for a genuine bug I could only see on
   * a device. Three groups of dots stacked with nothing but a gap between them
   * read as ONE tall field: the space between two choices was barely wider than
   * the space between two rows inside a choice, so ten, seven and four in a
   * column looked like rows of 5, 5, 5, 2, 4 and there was no way to tell where
   * one answer stopped. A child cannot answer "which one is ten?" if they
   * cannot see which dots belong together.
   *
   * A raised frosted card behind each one makes the grouping unambiguous, and
   * gives the choice an edge to aim at — closer to a wooden tray of counters
   * than to dots floating on a page. It is inside the Pressable, so the whole
   * tray is tappable, it sinks under a finger, and it dims with the object when
   * a choice recedes.
   */
  optionTray: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    ...cardSurface,
  },
  /**
   * The same tray, for three choices side by side.
   *
   * The colour and animal questions used to be the one place in the app where a
   * tappable thing had nothing behind it — three bare circles on the page — so
   * they get the tray too, and "raised card" stays a rule with no exceptions.
   *
   * Its padding is `sm` rather than `md`, and that is the whole cost of this
   * change: a tray in a row of three can only take its room out of the drawing
   * beside it, so the circle comes out around a tenth smaller than it did.
   * `sm` is the least that still leaves the drawing clear of the card's edge.
   */
  optionTrayRow: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    ...cardSurface,
  },
  conceptName: {
    ...textStyles.display,
  },
});
