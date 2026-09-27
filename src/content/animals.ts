import type { AudioCueId, ConceptSlot } from '../audio/cues';
import type {
  AnswerChoice,
  IllustrationName,
  Lesson,
  Subject,
  Visual,
} from '../lesson/types';

/**
 * Animal lessons.
 *
 * WHAT IS DIFFERENT ABOUT THIS SUBJECT. The first two subjects could both be
 * drawn with a coloured circle. An animal cannot, which made animals the
 * subject that finally exercised the promise in `Visual`: they needed a new
 * *kind* of drawing rather than a new value. That turned out to cost one case
 * in `LearningObject` and one new file of drawings — no screen, no lesson and
 * no part of the engine changed.
 *
 * They also needed the app to speak differently. "Can you find dog?" is not
 * English, so the cue registry grew a second set of templates with articles in
 * them ("This is a dog." / "Can you touch the dog?"). That is the other thing
 * this subject proved: the wording is data too.
 *
 * Each question shows the target alongside two deliberately chosen distractors.
 */

/**
 * An animal's slug, used as its concept id, choice id, cue prefix and drawing
 * name all at once.
 *
 * It is simply `IllustrationName` — the animals the app can draw are the
 * animals it teaches, and saying so in one line means adding `'rabbit'` to that
 * type is the only edit needed before a rabbit spec can be written below.
 */
type AnimalSlug = IllustrationName;

/** 'dog' -> 'Dog'. Shown under the drawing and read by a screen reader. */
function displayName(slug: AnimalSlug): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * The drawing, named rather than described.
 *
 * Note how little this file says about what a dog looks like. It says "dog" and
 * `illustrations.tsx` decides the rest, which is why replacing these drawings
 * with real artwork — or later with Rive animation — will not touch this file.
 */
function illustration(slug: AnimalSlug): Visual {
  return { kind: 'illustration', name: slug };
}

function choice(slug: AnimalSlug): AnswerChoice {
  return { id: slug, label: displayName(slug), visual: illustration(slug) };
}

/** Typed like `cue` in `colors.ts` — a missing cue is a compile error. */
function cue(slug: AnimalSlug, slot: ConceptSlot): AudioCueId {
  return `animal.${slug}.${slot}`;
}

interface AnimalLessonSpec {
  slug: AnimalSlug;
  /**
   * The three options, left to right.
   *
   * With three animals in the subject, every question shows all three and the
   * distractors are whatever is left over — so the only real choice here is
   * WHERE the answer sits, and it moves: first, middle, last. Same reason as
   * the colour lessons. If the answer were always in the middle, "it's the
   * middle one" is a pattern a child would learn instead of the animal, and
   * they would be right to learn it.
   *
   * Written out per lesson rather than generated, so that when rabbit arrives
   * and each question picks two distractors from three, the choices stay
   * visible and deliberate instead of being whatever a loop produced.
   */
  choices: AnimalSlug[];
}

const SPECS: AnimalLessonSpec[] = [
  { slug: 'dog', choices: ['dog', 'bear', 'bird'] },
  { slug: 'bird', choices: ['giraffe', 'lion', 'bird'] },
  { slug: 'elephant', choices: ['elephant', 'monkey', 'mouse'] },
  { slug: 'fish', choices: ['tiger', 'fish', 'dog'] },
  { slug: 'giraffe', choices: ['bear', 'giraffe', 'lion'] },
  { slug: 'lion', choices: ['mouse', 'elephant', 'lion'] },
  { slug: 'monkey', choices: ['monkey', 'bird', 'fish'] },
  { slug: 'mouse', choices: ['giraffe', 'mouse', 'tiger'] },
  { slug: 'tiger', choices: ['dog', 'tiger', 'bear'] },
  { slug: 'bear', choices: ['fish', 'bear', 'elephant'] },
];

/** The same four steps as every other lesson. The engine sees no difference. */
function animalLesson({ slug, choices }: AnimalLessonSpec): Lesson {
  return {
    id: `animal-${slug}`,
    concept: {
      // Matches the correct choice's id, as the guided step answers with it.
      id: slug,
      name: displayName(slug),
      // "We looked at the dog." — see `inSentence` in `lesson/types.ts`.
      inSentence: `the ${slug}`,
      subject: 'animals',
      visual: illustration(slug),
    },
    steps: [
      {
        id: `${slug}-introduction`,
        type: 'introduction',
        // "This is a dog." ... "Dog."
        audio: [cue(slug, 'this-is'), cue(slug, 'name')],
      },
      {
        id: `${slug}-guided`,
        type: 'guided',
        audio: [cue(slug, 'touch-prompt')],
        successAudio: [cue(slug, 'touch-success')],
      },
      {
        id: `${slug}-question`,
        type: 'question',
        audio: [cue(slug, 'find-prompt')],
        question: {
          kind: 'find-the-target',
          choices: choices.map(choice),
          correctChoiceId: slug,
          // Side by side, the default. Unlike a group of ten dots, one animal
          // is still legible at a third of the screen's width — the shape is
          // the whole message and it does not need counting.
        },
        correctAudio: [cue(slug, 'find-success')],
        retryAudio: ['shared.try-again'],
      },
      {
        id: `${slug}-completion`,
        type: 'completion',
        audio: [cue(slug, 'complete')],
      },
    ],
  };
}

export const animalLessons: Lesson[] = SPECS.map(animalLesson);

export const animalsSubject: Subject = {
  id: 'animals',
  title: 'Animals',
  description: 'Dog, Bear, Bird...',
  lessons: animalLessons,
};
