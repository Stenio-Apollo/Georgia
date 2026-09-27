import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { duration, pause } from '../animation/constants';
import { useAudioPlayer } from '../audio/AudioProvider';
import { getCue, type AudioCueId } from '../audio/cues';
import {
  createInitialState,
  getCurrentStep,
  lessonReducer,
  type LessonEvent,
  type LessonState,
} from './reducer';
import type { Concept, Lesson, LessonStep } from './types';

/**
 * Runs a lesson.
 *
 * The reducer in `reducer.ts` decides *what state we are in*. This hook makes
 * the world match that state: it plays the audio, waits out the silences, and
 * reports back when each stage is done.
 *
 * The Lesson screen calls this and renders whatever it returns. The screen
 * itself holds no lesson rules.
 */

/** Which lines to speak when the child gets it right. */
function correctCuesFor(step: LessonStep): AudioCueId[] {
  switch (step.type) {
    case 'guided':
      return step.successAudio;
    case 'question':
      return step.correctAudio;
    default:
      return [];
  }
}

/** Which lines to speak after a wrong tap. Neutral and brief. */
function retryCuesFor(step: LessonStep): AudioCueId[] {
  return step.type === 'question' ? step.retryAudio : [];
}

export interface LessonEngine {
  /** Raw machine state. Mostly useful for debugging and tests. */
  state: LessonState;
  /** The step being shown, or undefined once the lesson is over. */
  step: LessonStep | undefined;
  concept: Concept;
  isFinished: boolean;
  /** True only while a tap should be accepted. */
  canInteract: boolean;
  /** The line to show on screen right now, or null for silence. */
  caption: string | null;
  /** For the quiet progress dots: 1-based position and total. */
  progress: { current: number; total: number };
  /** Choices the child has tried and got wrong on this step. */
  wrongChoiceIds: string[];
  /** The most recent tap, for feedback animation. */
  lastResponse: LessonState['lastResponse'];
  /** Call when the child taps a choice (or the object in a guided step). */
  selectChoice: (choiceId: string) => void;
  /** Move on. Used by the completion step's "done" control. */
  advance: () => void;
  /** Start over from the first step. */
  restart: () => void;
}

export function useLessonEngine(lesson: Lesson): LessonEngine {
  const audio = useAudioPlayer();

  // `useReducer` is React's built-in support for the reducer pattern. We wrap
  // our three-argument reducer so it has the two-argument shape React wants,
  // with `lesson` baked in.
  const reducer = useCallback(
    (state: LessonState, event: LessonEvent) =>
      lessonReducer(lesson, state, event),
    [lesson],
  );
  const [state, dispatch] = useReducer(reducer, lesson, createInitialState);

  const step = getCurrentStep(lesson, state);

  /**
   * One effect drives the entire lesson.
   *
   * It re-runs whenever the phase or step changes, does whatever that phase
   * requires, and then dispatches the event saying it finished. The reducer
   * moves to the next phase, which re-runs this effect — and so the lesson
   * walks itself forward.
   *
   * The `cancelled` flag is the important part. Audio and timers finish
   * *later*, by which time the child may have left the screen or the lesson
   * may have moved on. Checking `cancelled` after every `await` makes sure a
   * late-finishing sound can never push the lesson forward from a stale state.
   * This is the standard way to handle async work in a React effect.
   */
  useEffect(() => {
    if (!step) {
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    /** A pause we can cancel on cleanup. */
    const delay = (ms: number) =>
      new Promise<void>(resolve => {
        timers.push(setTimeout(resolve, ms));
      });

    /** Keeps the caption in step with the voice. */
    const handleCueStart = (cueId: AudioCueId) => {
      if (!cancelled) {
        dispatch({ type: 'CUE_STARTED', cueId });
      }
    };

    const run = async () => {
      switch (state.phase) {
        case 'entering':
          // Let the object finish settling before anything is said.
          await delay(duration.calm);
          if (!cancelled) {
            dispatch({ type: 'ENTRANCE_DONE' });
          }
          break;

        case 'narrating':
          await audio.speakSequence(step.audio, pause.beat, handleCueStart);
          if (!cancelled) {
            dispatch({ type: 'NARRATION_DONE' });
          }
          break;

        case 'observing':
          // Deliberate silence. Nothing moves, nothing plays.
          await delay(pause.observe);
          if (!cancelled) {
            dispatch({ type: 'OBSERVATION_DONE' });
          }
          break;

        case 'responding': {
          const response = state.lastResponse;
          if (!response) {
            break;
          }
          // A soft tone first, then words. Never at the same time.
          await audio.playSound(response.isCorrect ? 'confirm' : 'neutral');
          if (cancelled) {
            break;
          }
          const cues = response.isCorrect
            ? correctCuesFor(step)
            : retryCuesFor(step);
          await audio.speakSequence(cues, pause.beat, handleCueStart);
          if (!cancelled) {
            dispatch({ type: 'FEEDBACK_DONE' });
          }
          break;
        }

        case 'settled':
          // The completion step waits for a parent instead of auto-advancing,
          // so the lesson never ends by itself.
          if (step.type === 'completion') {
            break;
          }
          await delay(pause.settle);
          if (!cancelled) {
            dispatch({ type: 'ADVANCE' });
          }
          break;

        case 'awaiting':
          // Nothing to do. We are waiting on the child, for as long as it
          // takes. No timeout, no nudge, no hurry-up animation.
          break;
      }
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      audio.stopAll();
    };
  }, [state.phase, state.stepIndex, state.lastResponse, step, audio]);

  /**
   * The last line of the step's opening narration.
   *
   * While the child is deciding, we fall back to this so the question stays
   * on screen instead of the caption going blank.
   */
  const promptCueId = useMemo<AudioCueId | null>(() => {
    if (!step || step.audio.length === 0) {
      return null;
    }
    return step.audio[step.audio.length - 1];
  }, [step]);

  const captionCueId =
    state.activeCueId ?? (state.phase === 'awaiting' ? promptCueId : null);

  const selectChoice = useCallback((choiceId: string) => {
    dispatch({ type: 'CHOICE_SELECTED', choiceId });
  }, []);

  const advance = useCallback(() => {
    dispatch({ type: 'ADVANCE' });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return {
    state,
    step,
    concept: lesson.concept,
    isFinished: state.isFinished,
    canInteract: state.phase === 'awaiting',
    caption: captionCueId ? getCue(captionCueId).text : null,
    progress: {
      current: Math.min(state.stepIndex + 1, lesson.steps.length),
      total: lesson.steps.length,
    },
    wrongChoiceIds: state.wrongChoiceIds,
    lastResponse: state.lastResponse,
    selectChoice,
    advance,
    restart,
  };
}
