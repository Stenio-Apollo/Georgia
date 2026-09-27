import type { AudioCueId } from '../audio/cues';
import type { Lesson, LessonStep } from './types';

/**
 * The lesson state machine.
 *
 * This file is pure logic: given the current state and something that
 * happened, it returns the next state. It plays no audio, sets no timers, and
 * renders nothing. That separation is the single most important design
 * decision in the app, for two reasons:
 *
 *  1. It is testable. You can verify the whole RED flow in a unit test in
 *     milliseconds, with no simulator and no audio files.
 *  2. The Lesson screen becomes a *renderer*. It looks at the state and draws
 *     it. It contains no lesson rules of its own, which is what stops rules
 *     from being quietly duplicated per subject later.
 *
 * If you have not met a "reducer" before: it is just a function
 * `(state, event) => newState`. React has built-in support for the pattern via
 * `useReducer`, which is what `useLessonEngine` uses.
 */

/**
 * Where we are *within* the current step.
 *
 * Every step walks through some subset of these. The phase is what the screen
 * keys off of: it decides whether to animate an entrance, whether taps are
 * allowed, and whether to show feedback.
 */
export type StepPhase =
  /** The object is animating in. Nothing is audible and nothing is tappable. */
  | 'entering'
  /** Narration is playing. The screen deliberately stays still. */
  | 'narrating'
  /** Deliberate silence so the child can just look. Nothing happens. */
  | 'observing'
  /** The child may now touch something. */
  | 'awaiting'
  /** Reacting to a tap: confirmation sound and spoken response. */
  | 'responding'
  /** The step is finished and ready to hand over to the next one. */
  | 'settled';

export interface StepAttempts {
  correct: number;
  incorrect: number;
}

export interface LessonState {
  lessonId: string;
  /** Index into `lesson.steps`. */
  stepIndex: number;
  phase: StepPhase;
  /** The most recent tap, or null. Drives the feedback animation. */
  lastResponse: { choiceId: string; isCorrect: boolean } | null;
  /**
   * Choices already tried and wrong, for this step only.
   *
   * These stay gently dimmed rather than disappearing, so the child narrows
   * the field down instead of being told off. Cleared on every new step.
   */
  wrongChoiceIds: string[];
  /**
   * Attempt tally per step, kept for the future Parent screen.
   *
   * This is never shown to the child. There is no score, no streak, and
   * nothing here is used to gate progress — a child reaches the end of the
   * lesson regardless of how many tries it took.
   */
  attempts: Record<string, StepAttempts>;
  /** The line currently being spoken, so the caption can follow the voice. */
  activeCueId: AudioCueId | null;
  /** True once the last step has been passed. */
  isFinished: boolean;
}

export type LessonEvent =
  /** The entrance animation has finished. */
  | { type: 'ENTRANCE_DONE' }
  /** All of the step's opening narration has played. */
  | { type: 'NARRATION_DONE' }
  /** The silent observation pause has elapsed. */
  | { type: 'OBSERVATION_DONE' }
  /** The child tapped something. */
  | { type: 'CHOICE_SELECTED'; choiceId: string }
  /** Feedback audio for a tap has finished. */
  | { type: 'FEEDBACK_DONE' }
  /** Move to the next step. */
  | { type: 'ADVANCE' }
  /** A line of narration started; update the caption. */
  | { type: 'CUE_STARTED'; cueId: AudioCueId }
  /** Start the lesson over from the beginning. */
  | { type: 'RESET' };

export function createInitialState(lesson: Lesson): LessonState {
  return {
    lessonId: lesson.id,
    stepIndex: 0,
    phase: 'entering',
    lastResponse: null,
    wrongChoiceIds: [],
    attempts: {},
    activeCueId: null,
    isFinished: false,
  };
}

/** The step the child is currently on, or undefined once the lesson is over. */
export function getCurrentStep(
  lesson: Lesson,
  state: LessonState,
): LessonStep | undefined {
  return lesson.steps[state.stepIndex];
}

/**
 * Is a tap on `choiceId` the right answer for this step?
 *
 * Kept here, in one place, rather than in the screen — so the rule cannot
 * drift between step types or subjects.
 */
function isChoiceCorrect(step: LessonStep, choiceId: string): boolean {
  switch (step.type) {
    case 'question':
      return choiceId === step.question.correctChoiceId;
    case 'guided':
      // In a guided step the concept itself is the only tappable thing, so any
      // tap that arrives is by definition the right one.
      return true;
    default:
      return false;
  }
}

function recordAttempt(
  attempts: Record<string, StepAttempts>,
  stepId: string,
  isCorrect: boolean,
): Record<string, StepAttempts> {
  const previous = attempts[stepId] ?? { correct: 0, incorrect: 0 };
  return {
    ...attempts,
    [stepId]: {
      correct: previous.correct + (isCorrect ? 1 : 0),
      incorrect: previous.incorrect + (isCorrect ? 0 : 1),
    },
  };
}

/**
 * Which phase follows narration, for each kind of step.
 *
 * Introduction steps fall silent so the child can look. Steps that ask for
 * something go straight to waiting for a touch.
 */
function phaseAfterNarration(step: LessonStep): StepPhase {
  switch (step.type) {
    case 'introduction':
      return 'observing';
    case 'guided':
    case 'question':
      return 'awaiting';
    case 'completion':
      // Nothing auto-advances from completion — a parent closes the lesson.
      return 'settled';
  }
}

export function lessonReducer(
  lesson: Lesson,
  state: LessonState,
  event: LessonEvent,
): LessonState {
  const step = getCurrentStep(lesson, state);

  if (event.type === 'RESET') {
    return createInitialState(lesson);
  }

  // Once the lesson is over, or if we somehow have no step, ignore everything.
  if (!step || state.isFinished) {
    return state;
  }

  switch (event.type) {
    case 'CUE_STARTED':
      return { ...state, activeCueId: event.cueId };

    case 'ENTRANCE_DONE':
      // Guard: only meaningful while entering. Guards like this are what make
      // the machine safe against a late timer firing after we have moved on.
      return state.phase === 'entering'
        ? { ...state, phase: 'narrating' }
        : state;

    case 'NARRATION_DONE':
      // `activeCueId` is deliberately left alone. The last spoken line stays
      // on screen while the child looks or decides, so a parent can re-read
      // the prompt aloud without the caption vanishing.
      return state.phase === 'narrating'
        ? { ...state, phase: phaseAfterNarration(step) }
        : state;

    case 'OBSERVATION_DONE':
      return state.phase === 'observing'
        ? { ...state, phase: 'settled' }
        : state;

    case 'CHOICE_SELECTED': {
      // Only accept a tap when we are actually waiting for one. This single
      // guard is what prevents double-taps, taps during narration, and taps
      // landing during feedback.
      if (state.phase !== 'awaiting') {
        return state;
      }
      const isCorrect = isChoiceCorrect(step, event.choiceId);
      return {
        ...state,
        phase: 'responding',
        lastResponse: { choiceId: event.choiceId, isCorrect },
        wrongChoiceIds: isCorrect
          ? state.wrongChoiceIds
          : // Avoid listing the same wrong choice twice.
            Array.from(new Set([...state.wrongChoiceIds, event.choiceId])),
        attempts: recordAttempt(state.attempts, step.id, isCorrect),
      };
    }

    case 'FEEDBACK_DONE': {
      if (state.phase !== 'responding') {
        return state;
      }
      // A wrong answer returns to waiting. There is no penalty, no lockout,
      // and no limit on tries — the child simply gets to try again.
      // Clearing `activeCueId` here lets the caption fall back to the original
      // question, so "Try again." does not linger on screen.
      if (state.lastResponse && !state.lastResponse.isCorrect) {
        return {
          ...state,
          phase: 'awaiting',
          lastResponse: null,
          activeCueId: null,
        };
      }
      // On a correct answer the success line stays visible through the pause.
      return { ...state, phase: 'settled' };
    }

    case 'ADVANCE': {
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= lesson.steps.length) {
        return { ...state, isFinished: true, activeCueId: null };
      }
      return {
        ...state,
        stepIndex: nextIndex,
        phase: 'entering',
        lastResponse: null,
        wrongChoiceIds: [],
        activeCueId: null,
      };
    }
  }
}
