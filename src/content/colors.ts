import type { AudioCueId, ConceptSlot } from '../audio/cues';
import type { AnswerChoice, Lesson, Subject, Visual } from '../lesson/types';
import { learning } from '../theme/colors';

/**
 * Colour lessons.
 *
 * This file is *data*. There is no UI here, and no part of the lesson engine
 * changed to add the five colours beyond red — which was the whole promise of
 * the architecture.
 *
 * The colours come from `learning`, not `ui`. See the comment at the top of
 * `src/theme/colors.ts` for why that distinction matters.
 *
 * All six lessons have an identical shape, so rather than copy the same four
 * steps out six times, the parts that are always the same are built by
 * `colorLesson` below and only the parts that *differ* are written down. Those
 * differences live in `SPECS`, which you can read top to bottom to see the
 * whole subject at a glance.
 */

/** 'red' | 'blue' | 'yellow' | 'green' | 'orange' | 'purple'. */
type ColorSlug = keyof typeof learning;

function circle(slug: ColorSlug): Visual {
  return { kind: 'circle', color: learning[slug] };
}

/** 'red' -> 'Red'. The written form shown on screen and read by a screen reader. */
function displayName(slug: ColorSlug): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function choice(slug: ColorSlug): AnswerChoice {
  return { id: slug, label: displayName(slug), visual: circle(slug) };
}

/**
 * Build one of the seven audio cue ids for a colour.
 *
 * The return type is `AudioCueId`, so if a cue were missing from
 * `src/audio/cues.ts` this line would stop compiling. Generated data does not
 * mean unchecked data.
 */
function cue(slug: ColorSlug, slot: ConceptSlot): AudioCueId {
  return `color.${slug}.${slot}`;
}

interface ColorLessonSpec {
  slug: ColorSlug;
  /**
   * The three options, in the order the child sees them left to right. Exactly
   * one of them is the lesson's own colour.
   *
   * Two things are being balanced here, and both are visible in the list below
   * rather than hidden in code:
   *
   * 1. WHERE the answer sits. Red is in the middle so it cannot be found by
   *    always picking an edge — but if every lesson put it in the middle,
   *    "always middle" is simply the next pattern to learn instead of the
   *    colour. So the answer's position moves around across the six.
   *
   * 2. WHICH colours sit next to it. Easily confused pairs are kept apart:
   *    red never appears beside orange, blue never beside purple, yellow never
   *    beside orange. A wrong answer should mean "not sure yet", not "those two
   *    are hard to tell apart on a small screen".
   */
  choices: ColorSlug[];
}

const SPECS: ColorLessonSpec[] = [
  { slug: 'red', choices: ['blue', 'red', 'yellow'] },
  { slug: 'blue', choices: ['blue', 'yellow', 'green'] },
  { slug: 'yellow', choices: ['green', 'purple', 'yellow'] },
  { slug: 'green', choices: ['green', 'red', 'purple'] },
  { slug: 'orange', choices: ['blue', 'green', 'orange'] },
  { slug: 'purple', choices: ['yellow', 'purple', 'green'] },
];

/**
 * One colour lesson.
 *
 * The four steps map exactly onto the flow from the brief:
 *   introduction -> show and name it
 *   guided       -> "can you touch red?"  (one correct thing to touch)
 *   question     -> "can you find red?"   (three choices)
 *   completion   -> close quietly
 */
function colorLesson({ slug, choices }: ColorLessonSpec): Lesson {
  return {
    id: `color-${slug}`,
    concept: {
      // `id` must match the correct choice's id, because the guided step
      // answers with the concept's own id.
      id: slug,
      name: displayName(slug),
      subject: 'colors',
      visual: circle(slug),
    },
    steps: [
      {
        id: `${slug}-introduction`,
        type: 'introduction',
        // Two lines with a pause between: "This is red." ... "Red."
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

export const colorLessons: Lesson[] = SPECS.map(colorLesson);

/**
 * Red on its own, kept as a named export because it is the lesson the tests
 * use as their worked example. It is first in `SPECS`.
 */
export const redLesson: Lesson = colorLessons[0];

export const colorsSubject: Subject = {
  id: 'colors',
  title: 'Colors',
  description: "Learn Primary Colors",
  lessons: colorLessons,
};
