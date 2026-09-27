import type { AudioCueId, ConceptSlot } from '../audio/cues';
import type { AnswerChoice, Lesson, Subject, Visual } from '../lesson/types';
import { countingObject } from '../theme/colors';

/**
 * Number lessons, one to ten.
 *
 * WHAT THESE LESSONS ACTUALLY TEACH, and why it matters:
 *
 * The question is "can you find three?" and the answer is a group of three
 * dots. The child is being asked to recognise a *quantity*, not to read the
 * numeral. Quantity comes first by a long way in how children develop, and it
 * is the thing the numeral will later stand for — so testing the symbol before
 * the amount would be backwards.
 *
 * THE NUMERAL IS NEVER ABSENT. Not on one step, not on one choice: wherever
 * this app draws a quantity, it writes the number next to it. Introduction,
 * guided step, all three answers, completion, and the picker tile.
 *
 * That is stricter than it needs to be for the question above, and the
 * strictness is the point. A child who cannot count yet is not going to work
 * out that "7" means seven by being told; they learn it the way they learn a
 * face, by seeing the two together enough times that they stop being two
 * things. Dropping the numeral from the one screen where the child is looking
 * hardest — the question — would remove exactly the repetitions that do the
 * work. Yes, it means the answer is also findable by matching the symbol. That
 * is not a leak in the lesson; pairing the symbol with the amount IS the
 * lesson, and the spoken prompt ("can you find seven?") teaches the word at
 * the same time.
 *
 * Every dot is the same warm brown, taken from `ui` rather than `learning`. In
 * a counting lesson the colour is not the lesson, so it must not compete — see
 * the note on `countingObject` in `src/theme/colors.ts`.
 */

/** Index 0 is "one". Used for cue ids and for spoken labels. */
const NUMBER_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
] as const;

type NumberWord = (typeof NUMBER_WORDS)[number];

function wordFor(count: number): NumberWord {
  const word = NUMBER_WORDS[count - 1];
  if (!word) {
    // Only reachable if a spec below is edited to a count outside 1-10, which
    // would otherwise produce a lesson with no audio and no obvious cause.
    throw new Error(`No number word for ${count}. Counts must be 1 to 10.`);
  }
  return word;
}

/** 'three' -> 'Three'. Spoken by a screen reader; not shown on screen. */
function displayWord(word: NumberWord): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** A quantity: `count` identical dots, laid out five to a row. */
function dots(count: number): Visual {
  return {
    kind: 'group',
    item: { kind: 'circle', color: countingObject },
    count,
  };
}

function choice(count: number): AnswerChoice {
  const word = wordFor(count);
  return {
    id: word,
    label: displayWord(word),
    // The numeral travels with the dots, here as everywhere else. A colour
    // choice has no `name` — see the note on `AnswerChoice`.
    name: String(count),
    visual: dots(count),
  };
}

/** Typed like `cue` in `colors.ts` — a missing cue is a compile error. */
function cue(word: NumberWord, slot: ConceptSlot): AudioCueId {
  return `number.${word}.${slot}`;
}

interface NumberLessonSpec {
  count: number;
  /**
   * The three options, top to bottom, as counts. Exactly one is `count`.
   *
   * These are written out per lesson rather than calculated, because the right
   * distractors change as the numbers get bigger:
   *
   *   1-5   wide gaps (1 against 3 and 5). At this stage the skill being built
   *         is "these are different amounts" at a glance, so the differences
   *         should be obvious.
   *   6-10  closer gaps (8 against 10). Once the small amounts are secure, the
   *         useful work is telling neighbours apart, which needs real counting
   *         rather than a glance.
   *
   * No question pairs two counts that differ by one. That distinction is a
   * later skill, and getting it wrong here would feel like being tricked.
   *
   * The answer's position moves around the list for the same reason it does in
   * the colour lessons: so that "it's the middle one" never becomes the pattern
   * the child learns instead of counting.
   */
  choices: number[];
}

const SPECS: NumberLessonSpec[] = [
  { count: 1, choices: [1, 3, 5] },
  { count: 2, choices: [4, 2, 6] },
  { count: 3, choices: [5, 1, 3] },
  { count: 4, choices: [4, 8, 2] },
  { count: 5, choices: [8, 3, 5] },
  { count: 6, choices: [2, 6, 9] },
  { count: 7, choices: [7, 10, 4] },
  { count: 8, choices: [5, 8, 10] },
  { count: 9, choices: [6, 3, 9] },
  { count: 10, choices: [10, 7, 4] },
];

/** Same four steps as a colour lesson. The engine sees no difference at all. */
function numberLesson({ count, choices }: NumberLessonSpec): Lesson {
  const word = wordFor(count);

  return {
    id: `number-${word}`,
    concept: {
      // Matches the correct choice's id, as the guided step answers with it.
      id: word,
      // The numeral, not the word: this is the flash-card face.
      name: String(count),
      subject: 'numbers',
      visual: dots(count),
    },
    steps: [
      {
        id: `${word}-introduction`,
        type: 'introduction',
        audio: [cue(word, 'this-is'), cue(word, 'name')],
      },
      {
        id: `${word}-guided`,
        type: 'guided',
        audio: [cue(word, 'touch-prompt')],
        successAudio: [cue(word, 'touch-success')],
      },
      {
        id: `${word}-question`,
        type: 'question',
        audio: [cue(word, 'find-prompt')],
        question: {
          kind: 'find-the-target',
          choices: choices.map(choice),
          correctChoiceId: word,
          // Stacked, not side by side. Three groups of ten dots squeezed into a
          // third of a phone's width each would be too small to count, which
          // would make this a test of eyesight rather than of counting.
          choiceLayout: 'column',
        },
        correctAudio: [cue(word, 'find-success')],
        retryAudio: ['shared.try-again'],
      },
      {
        id: `${word}-completion`,
        type: 'completion',
        audio: [cue(word, 'complete')],
      },
    ],
  };
}

export const numberLessons: Lesson[] = SPECS.map(numberLesson);

export const numbersSubject: Subject = {
  id: 'numbers',
  title: 'Numbers',
  description: "Learn 1-10",
  lessons: numberLessons,
};
