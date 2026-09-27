import { redLesson } from '../content/colors';
import {
  createInitialState,
  getCurrentStep,
  lessonReducer,
  type LessonEvent,
  type LessonState,
} from './reducer';

/**
 * Tests for the lesson state machine.
 *
 * These run in milliseconds and need no simulator, no audio files and no
 * rendering — which is the practical payoff of keeping the reducer pure. The
 * whole RED flow, including getting it wrong, is verified here.
 */

const initial = () => createInitialState(redLesson);

/** Apply several events in order, so tests read like a sequence of events. */
function apply(state: LessonState, ...events: LessonEvent[]): LessonState {
  return events.reduce(
    (current, event) => lessonReducer(redLesson, current, event),
    state,
  );
}

/** Drive the lesson to the guided step, waiting for a touch. */
function atGuidedAwaiting(): LessonState {
  const afterIntroduction = apply(
    initial(),
    { type: 'ENTRANCE_DONE' },
    { type: 'NARRATION_DONE' },
    { type: 'OBSERVATION_DONE' },
    { type: 'ADVANCE' },
  );
  return apply(
    afterIntroduction,
    { type: 'ENTRANCE_DONE' },
    { type: 'NARRATION_DONE' },
  );
}

/** Drive the lesson to the question step, waiting for a choice. */
function atQuestionAwaiting(): LessonState {
  const afterGuided = apply(
    atGuidedAwaiting(),
    { type: 'CHOICE_SELECTED', choiceId: 'red' },
    { type: 'FEEDBACK_DONE' },
    { type: 'ADVANCE' },
  );
  return apply(
    afterGuided,
    { type: 'ENTRANCE_DONE' },
    { type: 'NARRATION_DONE' },
  );
}

describe('lesson start', () => {
  it('opens on the introduction step with the object still arriving', () => {
    const state = initial();
    expect(getCurrentStep(redLesson, state)?.type).toBe('introduction');
    expect(state.phase).toBe('entering');
    expect(state.isFinished).toBe(false);
  });
});

describe('introduction step', () => {
  it('pauses in silence after narration before settling', () => {
    let state = apply(initial(), { type: 'ENTRANCE_DONE' });
    expect(state.phase).toBe('narrating');

    state = apply(state, { type: 'NARRATION_DONE' });
    // The point of this phase: nothing plays and nothing moves, so the child
    // can just look. If this ever becomes 'settled', the pause is gone.
    expect(state.phase).toBe('observing');

    state = apply(state, { type: 'OBSERVATION_DONE' });
    expect(state.phase).toBe('settled');
  });

  it('advances to the guided step', () => {
    const state = apply(
      initial(),
      { type: 'ENTRANCE_DONE' },
      { type: 'NARRATION_DONE' },
      { type: 'OBSERVATION_DONE' },
      { type: 'ADVANCE' },
    );
    expect(getCurrentStep(redLesson, state)?.type).toBe('guided');
    expect(state.phase).toBe('entering');
  });
});

describe('guided step', () => {
  it('waits for a touch rather than observing', () => {
    expect(atGuidedAwaiting().phase).toBe('awaiting');
  });

  it('treats touching the object as correct', () => {
    const state = apply(atGuidedAwaiting(), {
      type: 'CHOICE_SELECTED',
      choiceId: 'red',
    });
    expect(state.phase).toBe('responding');
    expect(state.lastResponse).toEqual({ choiceId: 'red', isCorrect: true });
  });
});

describe('question step', () => {
  it('offers blue, red and yellow with red as the answer', () => {
    const step = getCurrentStep(redLesson, atQuestionAwaiting());
    expect(step?.type).toBe('question');
    if (step?.type !== 'question') {
      throw new Error('expected a question step');
    }
    expect(step.question.choices.map(c => c.id)).toEqual([
      'blue',
      'red',
      'yellow',
    ]);
    expect(step.question.correctChoiceId).toBe('red');
  });

  it('settles on a correct choice and moves to completion', () => {
    let state = apply(atQuestionAwaiting(), {
      type: 'CHOICE_SELECTED',
      choiceId: 'red',
    });
    expect(state.lastResponse).toEqual({ choiceId: 'red', isCorrect: true });

    state = apply(state, { type: 'FEEDBACK_DONE' });
    expect(state.phase).toBe('settled');

    state = apply(state, { type: 'ADVANCE' });
    expect(getCurrentStep(redLesson, state)?.type).toBe('completion');
  });

  // The behaviour this app cares most about: a wrong answer costs nothing.
  it('returns to waiting after a wrong choice, with no progress lost', () => {
    let state = apply(atQuestionAwaiting(), {
      type: 'CHOICE_SELECTED',
      choiceId: 'blue',
    });
    expect(state.phase).toBe('responding');
    expect(state.lastResponse).toEqual({ choiceId: 'blue', isCorrect: false });
    expect(state.wrongChoiceIds).toEqual(['blue']);

    state = apply(state, { type: 'FEEDBACK_DONE' });
    // Back to waiting — not skipped, not failed, not moved on.
    expect(state.phase).toBe('awaiting');
    expect(state.lastResponse).toBeNull();
    // Still on the same step, with the option still listed as tried.
    expect(getCurrentStep(redLesson, state)?.type).toBe('question');
    expect(state.wrongChoiceIds).toEqual(['blue']);
  });

  it('allows unlimited tries and still reaches the end', () => {
    let state = atQuestionAwaiting();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      state = apply(
        state,
        { type: 'CHOICE_SELECTED', choiceId: 'yellow' },
        { type: 'FEEDBACK_DONE' },
      );
    }
    expect(state.phase).toBe('awaiting');
    // Repeating the same wrong choice does not list it five times.
    expect(state.wrongChoiceIds).toEqual(['yellow']);

    state = apply(
      state,
      { type: 'CHOICE_SELECTED', choiceId: 'red' },
      { type: 'FEEDBACK_DONE' },
      { type: 'ADVANCE' },
    );
    expect(getCurrentStep(redLesson, state)?.type).toBe('completion');
  });

  it('records attempts for the parent screen without gating progress', () => {
    const state = apply(
      atQuestionAwaiting(),
      { type: 'CHOICE_SELECTED', choiceId: 'blue' },
      { type: 'FEEDBACK_DONE' },
      { type: 'CHOICE_SELECTED', choiceId: 'red' },
      { type: 'FEEDBACK_DONE' },
    );
    expect(state.attempts['red-question']).toEqual({
      correct: 1,
      incorrect: 1,
    });
    expect(state.phase).toBe('settled');
  });
});

describe('completion step', () => {
  function atCompletion(): LessonState {
    const afterQuestion = apply(
      atQuestionAwaiting(),
      { type: 'CHOICE_SELECTED', choiceId: 'red' },
      { type: 'FEEDBACK_DONE' },
      { type: 'ADVANCE' },
    );
    return apply(
      afterQuestion,
      { type: 'ENTRANCE_DONE' },
      { type: 'NARRATION_DONE' },
    );
  }

  it('settles rather than waiting for a touch', () => {
    expect(atCompletion().phase).toBe('settled');
  });

  it('finishes the lesson when advanced', () => {
    const state = apply(atCompletion(), { type: 'ADVANCE' });
    expect(state.isFinished).toBe(true);
  });

  it('ignores further events once finished', () => {
    const finished = apply(atCompletion(), { type: 'ADVANCE' });
    const afterMore = apply(
      finished,
      { type: 'ADVANCE' },
      { type: 'CHOICE_SELECTED', choiceId: 'red' },
    );
    expect(afterMore).toEqual(finished);
  });
});

describe('guards against stray events', () => {
  it('ignores taps while narration is still playing', () => {
    // Phase is 'narrating' here — a tap must not register.
    const narrating = apply(initial(), { type: 'ENTRANCE_DONE' });
    const afterTap = apply(narrating, {
      type: 'CHOICE_SELECTED',
      choiceId: 'red',
    });
    expect(afterTap).toEqual(narrating);
  });

  it('ignores a second tap while already responding to the first', () => {
    const responding = apply(atQuestionAwaiting(), {
      type: 'CHOICE_SELECTED',
      choiceId: 'red',
    });
    const afterDoubleTap = apply(responding, {
      type: 'CHOICE_SELECTED',
      choiceId: 'blue',
    });
    // This guard is what makes double-taps and impatient jabbing harmless.
    expect(afterDoubleTap).toEqual(responding);
  });

  it('ignores a late timer arriving in the wrong phase', () => {
    const awaiting = atQuestionAwaiting();
    const afterStaleEvent = apply(awaiting, { type: 'NARRATION_DONE' });
    expect(afterStaleEvent).toEqual(awaiting);
  });
});

describe('reset', () => {
  it('returns to the very beginning', () => {
    const state = apply(atQuestionAwaiting(), { type: 'RESET' });
    expect(state).toEqual(initial());
  });
});
