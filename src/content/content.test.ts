import { audioCues, type AudioCueId } from '../audio/cues';
import { illustrations } from '../components/LearningObject/illustrations';
import type { Lesson, QuestionStep, Visual } from '../lesson/types';
import { subjects } from './index';

/**
 * Integrity checks over every lesson in the app.
 *
 * This is the most valuable test in the project, and it is worth being clear
 * about why, because it does not test any behaviour at all.
 *
 * Nineteen hand-written lessons are nineteen chances to make a silent mistake: a
 * cue id with a typo, a `correctChoiceId` that is not among the choices, a
 * question where the answer appears twice, a copy-pasted step id. None of those
 * would crash. Each would produce a lesson that runs perfectly and teaches the
 * wrong thing — a child asked to find three, with no three on screen.
 *
 * The reducer tests prove the engine is right. This one proves the content
 * is, which is the half that grows every time a lesson is added.
 */

/** Every lesson in the app, paired with the subject it lives in. */
const allLessons: { subjectId: string; lesson: Lesson }[] = subjects.flatMap(
  subject =>
    subject.lessons.map(lesson => ({ subjectId: subject.id, lesson })),
);

/** The question step of a lesson. Every lesson has exactly one. */
function questionStepOf(lesson: Lesson): QuestionStep {
  const step = lesson.steps.find(candidate => candidate.type === 'question');
  if (!step || step.type !== 'question') {
    throw new Error(`${lesson.id} has no question step`);
  }
  return step;
}

/** Flatten a visual to a string, so two visuals can be compared for sameness. */
function visualKey(visual: Visual): string {
  return JSON.stringify(visual);
}

/** Total items if this is a group; 1 for a single object. */
function countOf(visual: Visual): number {
  return visual.kind === 'group' ? visual.count : 1;
}

describe('the content registry', () => {
  it('has nineteen lessons: six colours, ten numbers and three animals', () => {
    // A blunt count, so accidentally deleting a lesson is visible immediately
    // rather than showing up as a slightly shorter picker nobody notices.
    expect(allLessons).toHaveLength(19);
    expect(
      allLessons.filter(entry => entry.subjectId === 'colors'),
    ).toHaveLength(6);
    expect(
      allLessons.filter(entry => entry.subjectId === 'numbers'),
    ).toHaveLength(10);
    expect(
      allLessons.filter(entry => entry.subjectId === 'animals'),
    ).toHaveLength(3);
  });

  it('gives every lesson a unique id', () => {
    // Duplicate ids would break `getLesson`, which returns the first match —
    // so one lesson would be unreachable and the other would open twice.
    const ids = allLessons.map(entry => entry.lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('files every lesson under the subject its concept claims', () => {
    // `getNextLesson` finds a lesson's siblings through `concept.subject`, so a
    // mismatch here would silently break the "Next" button.
    for (const { subjectId, lesson } of allLessons) {
      expect(lesson.concept.subject).toBe(subjectId);
    }
  });
});

describe.each(allLessons)('the $lesson.id lesson', ({ lesson }) => {
  it('follows the four-step flow in order', () => {
    // introduction -> guided -> question -> completion. Every lesson, no
    // exceptions, because a predictable shape is what lets a child know what
    // is coming next.
    expect(lesson.steps.map(step => step.type)).toEqual([
      'introduction',
      'guided',
      'question',
      'completion',
    ]);
  });

  it('gives every step a unique id', () => {
    const ids = lesson.steps.map(step => step.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('refers only to audio cues that exist', () => {
    // The cue ids are typed, so a typo is normally a compile error. This is the
    // backstop for the generated ones in `colors.ts` and `numbers.ts`, where
    // the id is assembled from pieces at runtime.
    const referenced = lesson.steps.flatMap(step => [
      ...step.audio,
      ...(step.type === 'guided' ? step.successAudio : []),
      ...(step.type === 'question' ? step.correctAudio : []),
      ...(step.type === 'question' ? step.retryAudio : []),
    ]);

    expect(referenced.length).toBeGreaterThan(0);
    for (const id of referenced) {
      expect(audioCues[id]).toBeDefined();
      expect(audioCues[id].text.length).toBeGreaterThan(0);
    }
  });

  it('offers the right answer among its choices', () => {
    const { question } = questionStepOf(lesson);
    const ids = question.choices.map(choice => choice.id);
    expect(ids).toContain(question.correctChoiceId);
  });

  it('answers its guided step with the same id as its question', () => {
    // The guided step has nothing to choose from, so the screen answers it with
    // `concept.id`. If that did not match the question's correct choice, the
    // two halves of the lesson would disagree about what the answer is.
    const { question } = questionStepOf(lesson);
    expect(question.correctChoiceId).toBe(lesson.concept.id);
  });

  it('never shows the same thing twice in one question', () => {
    // Two identical choices would mean a correct answer that reads as wrong,
    // which is the one experience this app must never produce.
    const { question } = questionStepOf(lesson);

    const ids = question.choices.map(choice => choice.id);
    expect(new Set(ids).size).toBe(ids.length);

    const visuals = question.choices.map(choice => visualKey(choice.visual));
    expect(new Set(visuals).size).toBe(visuals.length);
  });

  it('offers three choices', () => {
    // Three is the layout both `optionRow` and `optionColumn` are sized for.
    expect(questionStepOf(lesson).question.choices).toHaveLength(3);
  });

  it('writes the number beside every quantity it offers', () => {
    // The rule is "wherever there are dots, the numeral is there too", and it
    // is written here rather than in the number lessons on purpose: this runs
    // over EVERY lesson in the app, so a future subject that shows a quantity —
    // three apples, five stars — inherits it without anyone remembering to.
    //
    // A choice that draws a single object has no `name`, and must not: "Red"
    // written beside a red circle is a word to read instead of a colour to
    // recognise.
    const { question } = questionStepOf(lesson);
    for (const option of question.choices) {
      if (option.visual.kind === 'group') {
        expect(option.name).toBe(String(countOf(option.visual)));
      } else {
        expect(option.name).toBeUndefined();
      }
    }
  });

  it('draws the concept as the correct choice draws it', () => {
    // The thing shown during the introduction has to be the thing that counts
    // as right at the question — otherwise the lesson teaches one object and
    // then rewards a different one.
    const { question } = questionStepOf(lesson);
    const correct = question.choices.find(
      choice => choice.id === question.correctChoiceId,
    );
    expect(correct).toBeDefined();
    expect(visualKey(correct!.visual)).toBe(visualKey(lesson.concept.visual));
  });
});

describe('the number lessons', () => {
  const numberLessons = allLessons
    .filter(entry => entry.subjectId === 'numbers')
    .map(entry => entry.lesson);

  it('draws as many objects as the numeral says', () => {
    // The whole subject rests on this one line. "7" beside six dots would be
    // teaching a child something false, repeatedly and convincingly.
    for (const lesson of numberLessons) {
      expect(countOf(lesson.concept.visual)).toBe(Number(lesson.concept.name));
    }
  });

  it('covers one to ten with no gaps', () => {
    const counts = numberLessons.map(lesson =>
      countOf(lesson.concept.visual),
    );
    expect(counts).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('labels each choice with the amount it actually draws', () => {
    const wordFor = [
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
    ];
    for (const lesson of numberLessons) {
      for (const choice of questionStepOf(lesson).question.choices) {
        expect(choice.label).toBe(wordFor[countOf(choice.visual) - 1]);
      }
    }
  });

  it('never asks a child to tell neighbouring amounts apart', () => {
    // Eight against nine is a much later skill than eight against five. Asking
    // for it here would feel like being tricked, which is the fastest way to
    // make a child stop wanting to try.
    for (const lesson of numberLessons) {
      const counts = questionStepOf(lesson)
        .question.choices.map(choice => countOf(choice.visual))
        .sort((a, b) => a - b);
      for (let i = 1; i < counts.length; i += 1) {
        expect(counts[i] - counts[i - 1]).toBeGreaterThan(1);
      }
    }
  });

  it('stacks its choices rather than putting them side by side', () => {
    // Three groups of ten dots squeezed into a third of a phone's width each
    // would be a test of eyesight instead of counting.
    for (const lesson of numberLessons) {
      expect(questionStepOf(lesson).question.choiceLayout).toBe('column');
    }
  });
});

describe('the colour lessons', () => {
  const colorLessonEntries = allLessons.filter(
    entry => entry.subjectId === 'colors',
  );

  /** Pairs that are genuinely hard to tell apart at this age. */
  const CONFUSABLE: [string, string][] = [
    ['red', 'orange'],
    ['blue', 'purple'],
    ['yellow', 'orange'],
  ];

  it('never puts a confusable pair in the same question', () => {
    // A wrong answer should mean "not sure yet", not "those two look the same
    // on a small screen".
    for (const { lesson } of colorLessonEntries) {
      const ids = questionStepOf(lesson).question.choices.map(
        choice => choice.id,
      );
      for (const [a, b] of CONFUSABLE) {
        expect(ids.includes(a) && ids.includes(b)).toBe(false);
      }
    }
  });
});

describe('the animal lessons', () => {
  const animalLessons = allLessons
    .filter(entry => entry.subjectId === 'animals')
    .map(entry => entry.lesson);

  it('teaches an animal that has a drawing', () => {
    // `illustrations.tsx` is typed as a Record over `IllustrationName`, so the
    // compiler already guarantees a drawing exists for every name. This checks
    // the other direction: that an animal lesson is drawn as an illustration
    // and has not been left as a placeholder circle.
    for (const lesson of animalLessons) {
      expect(lesson.concept.visual.kind).toBe('illustration');
      expect(Object.keys(illustrations)).toContain(lesson.concept.id);
    }
  });

  it('offers only other animals as distractors', () => {
    // A coloured circle among three animals would be answerable without
    // looking at any of the animals, which would teach nothing.
    for (const lesson of animalLessons) {
      for (const choice of questionStepOf(lesson).question.choices) {
        expect(choice.visual.kind).toBe('illustration');
      }
    }
  });

  it('speaks about them with an article', () => {
    // "Can you find dog?" is not English. A child hearing the app speak is
    // hearing language whether or not that is the lesson, so this checks the
    // animal template set is actually the one in use — the difference is one
    // argument in `cues.ts` and easy to forget on a fourth animal.
    for (const lesson of animalLessons) {
      const spoken = lesson.concept.id;
      expect(audioCues[`animal.${spoken}.this-is` as AudioCueId].text).toBe(
        `This is a ${spoken}.`,
      );
      expect(audioCues[`animal.${spoken}.find-prompt` as AudioCueId].text).toBe(
        `Can you find the ${spoken}?`,
      );
    }
  });

  it('gives them a sentence form, since lower-casing the name is not enough', () => {
    // The results screen writes the only full sentence in the app. Without
    // this it would read "We looked at dog."
    for (const lesson of animalLessons) {
      expect(lesson.concept.inSentence).toBe(`the ${lesson.concept.id}`);
    }
  });

  it('puts its choices side by side rather than stacked', () => {
    // The opposite of the counting lessons, and for a reason that is about the
    // content rather than the layout: one animal is still legible at a third of
    // the screen's width because its shape is the whole message. Ten dots at
    // that size cannot be counted.
    for (const lesson of animalLessons) {
      expect(questionStepOf(lesson).question.choiceLayout).not.toBe('column');
    }
  });
});

describe.each(['colors', 'numbers', 'animals'])('the %s subject', subjectId => {
  it('does not always put the answer in the same place', () => {
    // If it did, "it's the middle one" is the pattern a child learns instead of
    // the colour or the amount — and they would be right to learn it, which is
    // what makes this worth a test rather than a comment.
    //
    // Three distinct positions is the strongest form of this check, and the
    // animals happen to be exactly three lessons: with all three showing all
    // three animals, WHERE the answer sits is the only variable the specs
    // control, so every one of them has to be used.
    const positions = allLessons
      .filter(entry => entry.subjectId === subjectId)
      .map(({ lesson }) => {
        const { question } = questionStepOf(lesson);
        return question.choices.findIndex(
          choice => choice.id === question.correctChoiceId,
        );
      });

    expect(new Set(positions).size).toBe(3);
  });
});
