import { useEffect } from 'react';
import {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';
import { elevation } from '../theme/elevation';
import { duration, easing, scaleTo } from './constants';

/**
 * Reusable animations.
 *
 * Components should take animations from this file rather than writing their
 * own. It is not only about repetition — it is how the animation rules stay
 * enforced. If every component hand-rolls its own timing, "calm" slowly
 * erodes one component at a time.
 */

/** The default timing config: our standard duration and easing. */
export const gentleTiming: WithTimingConfig = {
  duration: duration.calm,
  easing: easing.gentle,
};

/** A slower version, for larger movements. */
export const slowTiming: WithTimingConfig = {
  duration: duration.slow,
  easing: easing.gentle,
};

/**
 * Fade in while scaling up very slightly, once, on mount.
 *
 * This is the app's default entrance. The scale change is tiny (8%) — enough
 * to read as "arriving" rather than "popping in".
 *
 * `delayMs` lets a screen stagger a couple of elements so they do not all move
 * at once. Use it sparingly; two staggered items is calm, six is a cascade.
 */
export function useGentleEntrance(delayMs = 0) {
  // A "shared value" is Reanimated's animatable box. Reading or writing
  // `.value` does not re-render the component — the animation runs on the UI
  // thread, which is why it stays smooth even when JavaScript is busy.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delayMs, withTiming(1, gentleTiming));
  }, [progress, delayMs]);

  return useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [scaleTo.entranceFrom, 1],
        ),
      },
    ],
  }));
}

/**
 * Fade in again each time `dependency` changes.
 *
 * Used for text that gets replaced in place, such as the spoken caption. A
 * caption that simply swaps is jarring; a caption that fades in is not.
 */
export function useFadeInOnChange(dependency: unknown) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Snap to invisible, then fade in. Assigning `.value` directly is
    // instant; only `withTiming` animates.
    opacity.value = 0;
    opacity.value = withTiming(1, gentleTiming);
  }, [dependency, opacity]);

  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

/**
 * The scale of a held thing, given `held` from 0 (resting) to 1 (finger down).
 *
 * Exported for `LearningObject`, which has to fold this into a product of
 * scales rather than use the finished style below.
 */
export function heldScale(held: number): number {
  'worklet';
  return interpolate(held, [0, 1], [1, scaleTo.pressed]);
}

/**
 * What a card does while a finger is on it: shrinks slightly and sinks.
 *
 * Every tappable thing in the app shares this, which is the point — four
 * components used to carry an identical copy of the shrink, and four copies is
 * how a consistent feel quietly stops being consistent.
 *
 * The sink is the new half. The card's shadow softens and its elevation drops
 * as it is pushed toward the page, then both come back on release. That passes
 * the "animation must communicate something" rule about as directly as an
 * animation can: it is not ambience, it is the answer to "did it feel my
 * finger?", which is a real question for a child who is still learning that
 * screens respond at all.
 *
 * Pass `hasDepth: false` for something with no card under it — a quiet button,
 * or a bare learning object. There is no shadow to animate, and driving
 * `shadowOpacity` on a view with no shadow would be a lie the renderer has to
 * spend work on.
 *
 * Returns `held` alongside the style for the one caller that cannot use the
 * style directly: `LearningObject` multiplies its press scale together with an
 * entrance scale and a state scale in a single worklet, so it needs the raw
 * progress rather than a finished transform that would overwrite the others.
 */
export function usePressFeel(hasDepth = true) {
  const held = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    const transform = [{ scale: heldScale(held.value) }];
    if (!hasDepth) {
      return { transform };
    }
    return {
      transform,
      shadowOpacity: interpolate(
        held.value,
        [0, 1],
        [elevation.resting.shadowOpacity, elevation.pressed.shadowOpacity],
      ),
      elevation: interpolate(
        held.value,
        [0, 1],
        [elevation.resting.elevation, elevation.pressed.elevation],
      ),
    };
  });

  return {
    held,
    style,
    // Down quickly, because the feedback has to feel attached to the touch.
    onPressIn: () => {
      held.value = withTiming(1, {
        duration: duration.quick,
        easing: easing.gentle,
      });
    },
    // Back up at the app's normal pace. Slower coming up than going down is
    // what makes it read as a thing settling rather than a thing snapping.
    onPressOut: () => {
      held.value = withTiming(0, gentleTiming);
    },
  };
}
