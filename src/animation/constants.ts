import { Easing } from 'react-native-reanimated';

/**
 * Every timing value in the app lives here.
 *
 * The reason for centralising them is not tidiness — it is that "calm" is a
 * property of the *whole* app, not of any one screen. If durations are
 * scattered across components they drift, and the app starts to feel jumpy in
 * places. Change the feel of the entire app from this one file.
 */

/** How long a single animation takes. */
export const duration = {
  /** Small state changes, e.g. a press highlight. */
  quick: 220,
  /** The default. Entrances, fades, gentle scaling. */
  calm: 420,
  /** Screen transitions and larger movements. */
  slow: 700,
} as const;

/**
 * Deliberate *silence*. This is the most important part of the animation
 * system and the easiest to leave out.
 *
 * A child needs time to look at something before anything else happens. These
 * are the pauses where nothing moves and nothing plays — they are a feature,
 * not dead time.
 */
export const pause = {
  /** Gap between two spoken lines, e.g. "This is red." ... "Red." */
  beat: 550,
  /** Silence after narration so the child can simply look. */
  observe: 1500,
  /** Silence after feedback, before moving to the next step. */
  settle: 1100,
} as const;

/**
 * Easing curves. Both are "ease-out" shaped: they start with a little energy
 * and slow into place, which reads as gentle. We never use easings that
 * overshoot or bounce.
 */
export const easing = {
  /** Default for entrances and exits. Decelerates smoothly. */
  gentle: Easing.bezier(0.22, 1, 0.36, 1),
  /** For things that move and come back, like a pulse. */
  gentleInOut: Easing.inOut(Easing.quad),
} as const;

/**
 * A spring with enough damping that it does NOT bounce.
 *
 * Springs are used instead of timed animations when something responds to a
 * touch, because a spring feels physical. The high damping is what keeps it
 * from feeling like a game.
 */
export const gentleSpring = {
  damping: 22,
  stiffness: 130,
  mass: 0.9,
} as const;

/**
 * How much things scale. All small on purpose — an object growing by 7% is
 * noticeable without being a celebration.
 */
export const scaleTo = {
  /** While a finger is held down. */
  pressed: 0.96,
  /** The resting "you can touch me" pulse. */
  pulse: 1.035,
  /** Acknowledging a correct answer. */
  confirmed: 1.07,
  /** Starting scale for an entrance, before settling to 1. */
  entranceFrom: 0.92,
  /** An unchosen option quietly stepping back. */
  receded: 0.95,
} as const;

/** Opacity values used for fading and de-emphasis. */
export const opacityTo = {
  hidden: 0,
  /** A wrong choice settling back: dimmed, never crossed out. */
  dimmed: 0.45,
  /** De-emphasised but still clearly present. */
  quiet: 0.7,
  visible: 1,
} as const;
