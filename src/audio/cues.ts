/**
 * The audio cue registry.
 *
 * Every spoken line in the app is listed here exactly once, with a stable id.
 * Lessons refer to audio by id (`'color.red.this-is'`), never by filename.
 *
 * Why the indirection?
 *  - Lesson data stays readable and stays free of file paths.
 *  - You can re-record, rename, or re-order audio files without touching any
 *    lesson or component.
 *  - `durationMs` lets the app pace itself correctly *before* you have real
 *    recordings, so the lesson already feels right today.
 *  - Translating the app later means writing a second registry, not editing
 *    lessons.
 *
 * `text` is the words spoken. It doubles as the on-screen caption, so a parent
 * can read along, and as the accessibility label.
 */

export interface AudioCue {
  /** The words spoken. Also used as the on-screen caption. */
  text: string;
  /**
   * Filename inside `src/audio/files/`. The file does not have to exist yet —
   * see the README in that folder. Until it does, the stub player uses
   * `durationMs` to simulate playback.
   */
  file: string;
  /** Roughly how long the line takes to say, in milliseconds. */
  durationMs: number;
}

/**
 * The seven lines every concept needs, whatever the subject.
 *
 * A lesson has four steps, and these are the lines those steps use. Naming the
 * slots rather than writing each line by hand is what keeps this file readable
 * at sixteen concepts instead of one — see `conceptCues` below.
 */
export type ConceptSlot =
  | 'this-is'
  | 'name'
  | 'touch-prompt'
  | 'touch-success'
  | 'find-prompt'
  | 'find-success'
  | 'complete';

/** One complete set of wordings: every slot, given the concept's spoken name. */
type CueTemplates = Record<ConceptSlot, (spoken: string) => string>;

/**
 * How each slot is worded for colours and numbers.
 *
 * The same seven templates serve both, which is a small piece of luck worth
 * pointing out: "This is three." and "Can you find three?" read just as
 * naturally as the red versions.
 */
const PLAIN_TEMPLATES: CueTemplates = {
  'this-is': spoken => `This is ${spoken}.`,
  name: spoken => `${capitalise(spoken)}.`,
  'touch-prompt': spoken => `Can you touch ${spoken}?`,
  'touch-success': spoken => `Yes. ${capitalise(spoken)}.`,
  'find-prompt': spoken => `Can you find ${spoken}?`,
  'find-success': spoken => `Yes. That's ${spoken}.`,
  complete: spoken => `You found ${spoken}.`,
};

/**
 * The same seven lines for animals, which need an article.
 *
 * This is the second template set the note above used to predict, and it is
 * here rather than as a tweak to the first one because the difference is not
 * cosmetic. "Can you find dog?" is not English, and a child hearing the app
 * speak is hearing *language* whether or not that is the lesson — so the app
 * has to say it properly.
 *
 * Note "a" when the animal is being introduced and "the" once it is on screen
 * and being pointed at: "This is a dog." then "Can you touch the dog?" That is
 * how a person would say it, and it is the kind of detail that makes the voice
 * sound like a parent reading rather than a machine filling in a blank.
 */
const ANIMAL_TEMPLATES: CueTemplates = {
  'this-is': spoken => `This is ${animalArticle(spoken)} ${spoken}.`,
  name: spoken => `${capitalise(spoken)}.`,
  'touch-prompt': spoken => `Can you touch the ${spoken}?`,
  'touch-success': spoken => `Yes. ${capitalise(animalArticle(spoken))} ${spoken}.`,
  'find-prompt': spoken => `Can you find the ${spoken}?`,
  'find-success': spoken => `Yes. That's the ${spoken}.`,
  complete: spoken => `You found the ${spoken}.`,
};

function animalArticle(animal: string): 'a' | 'an' {
  return /^[aeiou]/i.test(animal) ? 'an' : 'a';
}

// Both sets are a `Record<ConceptSlot, ...>`, so they always have the same
// seven keys and either can define the list.
const SLOTS = Object.keys(PLAIN_TEMPLATES) as ConceptSlot[];

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * A rough guess at how long a line takes to say.
 *
 * Fitted to the seven RED durations, which were set by hand by reading them
 * aloud at the slow, warm pace this app wants: about half a second to get
 * going, then 60ms per character. It only has to be close — the stub player
 * uses it to pace the lesson, and every value gets replaced with a measured one
 * once the line is actually recorded.
 */
function estimateDuration(text: string): number {
  return Math.round((500 + 60 * text.length) / 50) * 50;
}

interface ConceptCueSpec {
  /** How the concept is said out loud: "red", "three", "dog". Lower case. */
  spoken: string;
  /** Wording for the seven lines. Defaults to the plain set. */
  templates?: CueTemplates;
  /**
   * Measured durations, for lines that have been read aloud and timed. Anything
   * left out falls back to `estimateDuration`. Fill these in as you record.
   */
  durationMs?: Partial<Record<ConceptSlot, number>>;
}

/**
 * Builds one concept's seven cues.
 *
 * The return type is the interesting part. `{ [K in `${P}.${ConceptSlot}`] }`
 * is a *mapped type over a template literal* — it tells TypeScript that
 * `conceptCues('color.blue', ...)` produces exactly the seven keys
 * `'color.blue.this-is'`, `'color.blue.name'` and so on. That is what keeps
 * `AudioCueId` below a precise list of real ids, so a typo in a lesson is still
 * a compile error rather than silence at runtime.
 *
 * Filenames are derived from the id by swapping dots for dashes, so the naming
 * convention on disk stays mechanical and needs no decisions.
 */
function conceptCues<P extends string>(
  prefix: P,
  spec: ConceptCueSpec,
): { [K in `${P}.${ConceptSlot}`]: AudioCue } {
  const templates = spec.templates ?? PLAIN_TEMPLATES;
  const entries = SLOTS.map(slot => {
    const text = templates[slot](spec.spoken);
    return [
      `${prefix}.${slot}`,
      {
        text,
        file: `${prefix}.${slot}`.replace(/\./g, '-') + '.m4a',
        durationMs: spec.durationMs?.[slot] ?? estimateDuration(text),
      },
    ];
  });

  // The cast is unavoidable: building an object in a loop cannot be verified
  // key-by-key by the compiler. `SLOTS` comes straight from a template set, so
  // the seven keys are always present, and `content.test.ts` checks at runtime
  // that every id a lesson asks for actually resolves.
  return Object.fromEntries(entries) as {
    [K in `${P}.${ConceptSlot}`]: AudioCue;
  };
}

/**
 * RED's durations, measured by hand before the generator existed.
 *
 * Kept exactly as they were so the one lesson whose pacing has actually been
 * reviewed does not quietly shift underneath us. Every other concept uses the
 * estimate until someone records and times it.
 */
const RED_DURATIONS: Partial<Record<ConceptSlot, number>> = {
  'this-is': 1250,
  name: 750,
  'touch-prompt': 1500,
  'touch-success': 1200,
  'find-prompt': 1450,
  'find-success': 1500,
  complete: 1400,
};

export const audioCues = {
  // ---- Colours -----------------------------------------------------------
  ...conceptCues('color.red', { spoken: 'red', durationMs: RED_DURATIONS }),
  ...conceptCues('color.blue', { spoken: 'blue' }),
  ...conceptCues('color.yellow', { spoken: 'yellow' }),
  ...conceptCues('color.green', { spoken: 'green' }),
  ...conceptCues('color.orange', { spoken: 'orange' }),
  ...conceptCues('color.purple', { spoken: 'purple' }),

  // ---- Numbers -----------------------------------------------------------
  // Spoken as words, not digits: the child hears "three" and sees "3".
  ...conceptCues('number.one', { spoken: 'one' }),
  ...conceptCues('number.two', { spoken: 'two' }),
  ...conceptCues('number.three', { spoken: 'three' }),
  ...conceptCues('number.four', { spoken: 'four' }),
  ...conceptCues('number.five', { spoken: 'five' }),
  ...conceptCues('number.six', { spoken: 'six' }),
  ...conceptCues('number.seven', { spoken: 'seven' }),
  ...conceptCues('number.eight', { spoken: 'eight' }),
  ...conceptCues('number.nine', { spoken: 'nine' }),
  ...conceptCues('number.ten', { spoken: 'ten' }),

  // ---- Animals -----------------------------------------------------------
  // Animal concepts share article-aware wording. See ANIMAL_TEMPLATES.
  ...conceptCues('animal.dog', { spoken: 'dog', templates: ANIMAL_TEMPLATES }),
  ...conceptCues('animal.bear', { spoken: 'bear', templates: ANIMAL_TEMPLATES }),
  ...conceptCues('animal.bird', {
    spoken: 'bird',
    templates: ANIMAL_TEMPLATES,
  }),
  ...conceptCues('animal.elephant', {
    spoken: 'elephant',
    templates: ANIMAL_TEMPLATES,
  }),
  ...conceptCues('animal.fish', { spoken: 'fish', templates: ANIMAL_TEMPLATES }),
  ...conceptCues('animal.giraffe', {
    spoken: 'giraffe',
    templates: ANIMAL_TEMPLATES,
  }),
  ...conceptCues('animal.lion', { spoken: 'lion', templates: ANIMAL_TEMPLATES }),
  ...conceptCues('animal.monkey', {
    spoken: 'monkey',
    templates: ANIMAL_TEMPLATES,
  }),
  ...conceptCues('animal.mouse', { spoken: 'mouse', templates: ANIMAL_TEMPLATES }),
  ...conceptCues('animal.tiger', { spoken: 'tiger', templates: ANIMAL_TEMPLATES }),

  // ---- Planets -----------------------------------------------------------
  ...conceptCues('planet.mercury', { spoken: 'Mercury' }),
  ...conceptCues('planet.venus', { spoken: 'Venus' }),
  ...conceptCues('planet.earth', { spoken: 'Earth' }),
  ...conceptCues('planet.moon', { spoken: 'the Moon' }),
  ...conceptCues('planet.mars', { spoken: 'Mars' }),
  ...conceptCues('planet.jupiter', { spoken: 'Jupiter' }),
  ...conceptCues('planet.saturn', { spoken: 'Saturn' }),
  ...conceptCues('planet.uranus', { spoken: 'Uranus' }),
  ...conceptCues('planet.neptune', { spoken: 'Neptune' }),
  ...conceptCues('planet.pluto', { spoken: 'Pluto' }),
  ...conceptCues('planet.sun', { spoken: 'the Sun' }),

  // ---- Shared, reusable across every lesson ------------------------------
  'shared.try-again': {
    text: 'Try again.',
    file: 'shared-try-again.m4a',
    durationMs: 1000,
  },
} as const;

/**
 * The set of valid cue ids, derived from the object above.
 *
 * This is a useful TypeScript trick: because the type is *computed* from the
 * data, a typo in a lesson (`'color.red.nmae'`) becomes a compile error rather
 * than silent missing audio at runtime.
 */
export type AudioCueId = keyof typeof audioCues;

/** Short non-verbal sounds. Soft and quiet — never a fanfare. */
export const soundEffects = {
  /** A single soft tone acknowledging a correct touch. */
  confirm: { file: 'sfx-confirm.m4a', durationMs: 450 },
  /** A very soft neutral tone for a wrong tap. Must not sound like a buzzer. */
  neutral: { file: 'sfx-neutral.m4a', durationMs: 350 },
} as const;

export type SoundEffectId = keyof typeof soundEffects;

/** Look up a cue. Exported so components can show its `text` as a caption. */
export function getCue(id: AudioCueId): AudioCue {
  return audioCues[id];
}

/** Total time a sequence of cues takes, including the beat between them. */
export function sequenceDuration(ids: AudioCueId[], beatMs: number): number {
  if (ids.length === 0) {
    return 0;
  }
  const spoken = ids.reduce((total, id) => total + audioCues[id].durationMs, 0);
  return spoken + beatMs * (ids.length - 1);
}
