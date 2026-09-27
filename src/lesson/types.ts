import type { AudioCueId } from '../audio/cues';

/**
 * The shapes that lesson *content* takes.
 *
 * This file contains no logic and no UI. It is the contract between the data
 * in `src/content/` and the engine in this folder. If you can describe a new
 * lesson using only the types below, that lesson needs no new code.
 */

export type SubjectId = 'colors' | 'numbers' | 'animals' | 'planets';

export type PlanetName =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'sun';

/**
 * The animals there are drawings for.
 *
 * This list is the honest state of the artwork, not a wish list: every name
 * here must have a drawing in `illustrations.tsx`, because that file is typed
 * as `Record<IllustrationName, ...>`. So adding `'rabbit'` to this line stops
 * the app compiling until a rabbit has actually been drawn — which is much
 * better than a lesson that runs fine and shows nothing.
 */
export type IllustrationName =
  | 'dog'
  | 'bear'
  | 'bird'
  | 'elephant'
  | 'fish'
  | 'giraffe'
  | 'lion'
  | 'monkey'
  | 'mouse'
  | 'tiger';

/**
 * How to draw a learning object, described as data rather than as a component.
 *
 * This is the seam that keeps the app extensible. `LearningObject` is the only
 * component that reads this, so adding a new way to draw something means
 * adding a case there — not changing any lesson. Still planned:
 *
 *   | { kind: 'rive'; file: string; }        for animated characters
 */
export type Visual =
  | { kind: 'circle'; color: string }
  | { kind: 'rounded-square'; color: string }
  /**
   * A drawing with parts: a dog's ears, muzzle, eyes and nose.
   *
   * Called `illustration` rather than `svg` on purpose. The circles above are
   * drawn with SVG too, so `svg` would name the technology while every other
   * member of this union names the *thing*. What actually separates this case
   * is that the drawing is assembled from several shapes, and that the data
   * only says which animal — never how it is drawn.
   */
  | { kind: 'illustration'; name: IllustrationName }
  | { kind: 'planet'; name: PlanetName }
  /**
   * A quantity: the same thing drawn `count` times. This is what a number
   * lesson shows — seven dots *are* the concept "seven".
   *
   * `perRow` defaults to 5, which is not an arbitrary number. Laid out five to
   * a row, seven reads as "a row of five and two more" instead of an
   * uncountable scatter, which is how children actually learn to recognise
   * quantities above four without counting one by one.
   */
  | { kind: 'group'; item: Visual; items?: Visual[]; count: number; perRow?: number };

/** One thing being taught: "red", "three", "rabbit". */
export interface Concept {
  id: string;
  /** Written form shown on screen, e.g. "Red". */
  name: string;
  /**
   * How the concept is named *inside a sentence*, for the one place the app
   * writes a full one: "We looked at red." / "We looked at 3."
   *
   * Optional, and lower-casing `name` is the right answer for a colour or a
   * numeral. Animals are why it exists: "We looked at dog." is not English, and
   * the fix belongs in the content — where the word is — rather than in a
   * screen trying to work out which nouns need "the" in front of them.
   */
  inSentence?: string;
  subject: SubjectId;
  visual: Visual;
}

/** One tappable option in a question. */
export interface AnswerChoice {
  id: string;
  /** Used for the accessibility label, not usually shown on screen. */
  label: string;
  /**
   * Written form printed beside the drawing, e.g. "3" next to three dots.
   *
   * Absent for colours and animals, and that absence is the whole design of
   * those questions: writing "Red" beside a red circle would let a reading
   * adult point at the word instead of the colour, and the child is meant to
   * recognise the thing itself.
   *
   * A quantity is the exception, and it is not really an exception at all.
   * The numeral IS half of what a number lesson teaches — "3" and three dots
   * are two ways of writing the same idea, and the association only forms if
   * a child sees them together every single time. So wherever dots are drawn,
   * their numeral is drawn with them.
   */
  name?: string;
  visual: Visual;
}

/**
 * A question type. Today there is exactly one kind.
 *
 * This is written as a discriminated union — a union of object types that each
 * carry a distinguishing `kind` field — so that adding e.g.
 * `{ kind: 'count-the-objects'; ... }` later forces TypeScript to tell us
 * every place that needs to handle the new case. Cheap to add now, expensive
 * to retrofit.
 */
export type Question = {
  kind: 'find-the-target';
  choices: AnswerChoice[];
  correctChoiceId: string;
  /**
   * How to arrange the choices. 'row' (the default) puts them side by side,
   * which is right for single objects like coloured circles.
   *
   * 'column' stacks them instead. Counting lessons need this: three groups of
   * ten dots squeezed side by side on a phone are too small to count, whereas
   * stacked they each get the full width. This is data rather than something
   * the screen works out from the visuals, so the choice stays visible and
   * adjustable in the lesson itself.
   */
  choiceLayout?: 'row' | 'column';
};

interface StepBase {
  id: string;
  /** Lines spoken when the step opens. */
  audio: AudioCueId[];
}

/** Show the concept and name it. The child just watches. */
export interface IntroductionStep extends StepBase {
  type: 'introduction';
}

/** Ask the child to touch the concept. Only the concept is tappable. */
export interface GuidedStep extends StepBase {
  type: 'guided';
  successAudio: AudioCueId[];
}

/** Ask the child to pick the concept out of several choices. */
export interface QuestionStep extends StepBase {
  type: 'question';
  question: Question;
  correctAudio: AudioCueId[];
  /** Played on a wrong choice. Must be neutral and encouraging. */
  retryAudio: AudioCueId[];
}

/** Quietly close the lesson. */
export interface CompletionStep extends StepBase {
  type: 'completion';
}

export type LessonStep =
  | IntroductionStep
  | GuidedStep
  | QuestionStep
  | CompletionStep;

export interface Lesson {
  id: string;
  concept: Concept;
  /** Optional styled name used only in a subject picker. */
  pickerLabel?: string;
  steps: LessonStep[];
}

/** A subject on the home screen, e.g. "Colors". */
export interface Subject {
  id: SubjectId;
  title: string;
  /** Parent-facing one-liner, e.g. "Red, blue, yellow, green". */
  description: string;
  lessons: Lesson[];
}
