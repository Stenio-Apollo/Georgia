/**
 * Two palettes live in this file, and keeping them apart is deliberate.
 *
 * `ui` — the calm, warm, muted colours the app is *built* from: backgrounds,
 *   text, borders, cards. These should never compete with the lesson.
 *
 * `learning` — the colours a child is being *taught*. These must be honest,
 *   recognisable examples of the concept. If we muted `learning.red` into a
 *   dusty pink so it matched the interface, we would be teaching the wrong
 *   thing. Learning colours are allowed to be the brightest thing on screen,
 *   because they are the point.
 *
 * Rule of thumb:
 *   decoration  -> take it from `ui`
 *   the lesson   -> take it from `learning`
 */

export const ui = {
  /** Warm off-white. The default background for every screen. */
  background: '#fdeee1',
  /** Slightly deeper cream, for cards and tappable areas on the home screen. */
  surface: '#b3e8ed',
  /** Hairline borders. Barely visible on purpose. */
  border: '#89b6fd',

  /** Primary text. A warm dark brown reads softer than pure black. */
  ink: '#453c2e',
  /** Secondary text: captions, hints, parent-facing labels. */
  inkSoft: '#8A7C6C',

  /** Muted supporting colours, used sparingly to give each area identity. */
  terracotta: '#C97B5A',
  dustyPink: '#D3A19B',
  warmBrown: '#8B6F52',
  softGreen: '#8CA886',
  mutedBlue: '#7B95AE',
  warmYellow: '#DCB877',
} as const;

/**
 * True, recognisable colours for the colour lessons.
 * Warmed very slightly away from pure screen RGB so they feel printed rather
 * than neon, but still unmistakably the colour they claim to be.
 */
export const learning = {
  red: '#D2453A',
  blue: '#3B6EA5',
  yellow: '#E9B02E',
  green: '#4F8A52',
  orange: '#D2793A',
  purple: '#7B5EA7',
} as const;

/**
 * The colour of the objects being counted in a number lesson.
 *
 * This comes from `ui`, not `learning`, and that is the palette rule doing real
 * work rather than being decorative. In a counting lesson the colour is not the
 * lesson — seven things are seven things whatever colour they are — so it must
 * not compete. Every dot is the same warm brown so that colour cannot become a
 * distractor from the quantity, which is the thing actually being taught.
 */
export const countingObject = ui.warmBrown;

/**
 * The animal illustrations.
 *
 * THE IMPORTANT DECISION HERE: every animal is drawn in the same brown. A dog
 * is not brown and a cat grey and a bird blue, even though real ones often are.
 *
 * The reason is the same one that makes every counting dot identical. If the
 * dog were the brown one and the bird the blue one, then "can you find the
 * dog?" could be answered correctly, every single time, without ever looking at
 * its shape — and a child who learned that shortcut would have learned colours
 * again rather than animals. Sharing one fur colour means the only thing that
 * tells the three apart is the thing being taught: the shape.
 *
 * Small features are allowed their own colour — a pink nose, a yellow beak —
 * because those are *parts of the animal's shape*, which is exactly what a child
 * should be reading. A beak is a bird whatever colour it is painted.
 *
 * Together they read like a set of wooden animal toys, which is about right for
 * this app.
 */
export const animal = {
  /** Body and head, for all of them. Warm and flat, like painted wood. */
  fur: ui.warmBrown,
  /** The same brown deepened: ears, a folded wing, a tail. */
  furDeep: '#6F5840',
  /** Eyes and noses. The one place the drawings use the text colour. */
  feature: ui.ink,
  /** Muzzles and cheeks — a pale patch that makes a face read as a face. */
  muzzle: ui.surface,
  /** A nose, an inner ear. One soft warm accent. */
  accent: ui.dustyPink,
  /** A beak. Yellow because a beak is yellow. */
  beak: ui.warmYellow,
} as const;

export type LearningColorName = keyof typeof learning;

/**
 * Per-subject accent colours for the home screen, so each learning area feels
 * like a distinct place without shouting. These come from `ui` on purpose.
 */
export const subjectAccent = {
  colors: ui.terracotta,
  numbers: ui.mutedBlue,
  animals: ui.softGreen,
  planets: ui.warmYellow,
} as const;

export const colors = { ui, learning, subjectAccent, animal };
