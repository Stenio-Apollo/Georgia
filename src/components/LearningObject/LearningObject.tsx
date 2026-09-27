import React, { useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';
import { duration, easing, opacityTo, scaleTo } from '../../animation/constants';
import {
  gentleTiming,
  heldScale,
  usePressFeel,
} from '../../animation/transitions';
import type { Visual } from '../../lesson/types';
import { fontSize, spacing, textStyles, touchTarget, ui } from '../../theme';
import { getVisualColor } from '../../utils/visual';
import { illustrations } from './illustrations';

/**
 * Draws the thing being taught, and animates it.
 *
 * This is the only component that knows how to turn a `Visual` (data) into
 * something on screen. Adding a new kind of visual later — a Rive character,
 * say — means adding a case to `Shape` below. No lesson data and no screen has
 * to change: the animals arrived that way, as one case here plus a file of
 * drawings, and every screen showed them without being touched.
 *
 * It is also the only place that animates a learning object, which is how the
 * rule "no simultaneous unrelated animations" gets enforced: there is exactly
 * one opacity value and one scale value here, and everything multiplies into
 * them.
 */

export type LearningObjectState =
  /** Resting. Present, not asking for anything. */
  | 'idle'
  /** Inviting a touch: a few slow pulses, then it settles and stays still. */
  | 'interactive'
  /** Acknowledging a correct touch: one gentle swell. */
  | 'confirmed'
  /** Quietly stepped back — a choice already tried. Dimmed, never crossed out. */
  | 'receded';

/**
 * How many there-and-back pulses before the object rests.
 *
 * Deliberately finite. An endlessly pulsing object is exactly the kind of
 * background motion this app is trying to avoid, and a child who is thinking
 * does not need to be nudged. Three pulses say "you can touch me", then the
 * screen goes still and waits for as long as it takes.
 */
const PULSE_CYCLES = 3;

/** Default items per row in a group. See the note on `Visual`'s group kind. */
const DEFAULT_PER_ROW = 5;

/** Gap between items in a group, as a fraction of one item's size. */
const GROUP_GAP_RATIO = 0.3;

/**
 * Width the numeral column takes, for `name`. Two digits at display size.
 *
 * 1.4 em covers "10" with a little air; the box is a fixed width rather than
 * hugging its text so that stacked choices line their numerals up in a column
 * and start their dots at the same place. Ragged numerals would read as three
 * unrelated cards instead of three amounts of the same thing.
 */
const NAME_WIDTH = Math.round(fontSize.display * 1.4);

/**
 * Total horizontal room a `name` costs, including the gap to the drawing.
 *
 * Exported because a screen that sizes a drawing has to subtract this first —
 * otherwise the numeral and the dots together are wider than the tray they sit
 * in, and the last dot falls off the edge.
 */
export const NAME_GUTTER = NAME_WIDTH + spacing.md;

interface ShapeProps {
  visual: Visual;
  size: number;
}

/**
 * The static drawing. We use SVG rather than a plain View with `borderRadius`
 * because SVG scales to any size without artefacts and is the same tool we
 * will use for the animal illustrations later.
 *
 * The viewBox is a 100x100 square, so shape coordinates below are effectively
 * percentages and stay correct at any `size`.
 */
function Shape({ visual, size }: ShapeProps) {
  switch (visual.kind) {
    case 'circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx={50} cy={50} r={48} fill={visual.color} />
        </Svg>
      );
    case 'rounded-square':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect
            x={3}
            y={3}
            width={94}
            height={94}
            rx={20}
            fill={visual.color}
          />
        </Svg>
      );
    case 'illustration': {
      // The lesson says "dog"; this is where that becomes a drawing. Looking
      // the component up in a registry rather than switching on the name means
      // a new animal touches `illustrations.tsx` and nothing else.
      const Illustration = illustrations[visual.name];
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Illustration />
        </Svg>
      );
    }
    case 'group':
      return <Group visual={visual} size={size} />;
  }
}

/**
 * A quantity, drawn as `count` copies laid out in rows.
 *
 * Plain Views rather than one big SVG, because each item is just `Shape` again
 * at a smaller size — which means a group of squares, or later a group of
 * illustrated apples, needs no extra code here.
 *
 * The whole group is sized to fit the same square footprint a single object
 * would occupy, so a number lesson and a colour lesson put the same amount of
 * ink on screen and the layout around them never has to change.
 */
type GroupVisual = Extract<Visual, { kind: 'group' }>;

/**
 * Item size, gap and row count for a group drawn at `size`.
 *
 * The one place this arithmetic lives, so that anything needing to know how big
 * a group comes out — `visualHeight` below, for instance — cannot drift from
 * what is actually drawn.
 */
function groupMetrics(visual: GroupVisual, size: number) {
  const perRow = visual.perRow ?? DEFAULT_PER_ROW;
  const rows = Math.ceil(visual.count / perRow);

  /*
   * The width calculation uses `perRow` and NOT the actual count, even when the
   * group has fewer items than that. This is the important line in this file.
   *
   * If each group sized its items to fill the space it was given, a choice
   * showing three dots would draw them far larger than a choice showing ten,
   * both groups would cover about the same area, and a child could answer "how
   * many?" by comparing blobs of ink instead of counting. Fixing the grid at
   * `perRow` means every group drawn at the same `size` uses the same item
   * size, so the only thing that differs between choices is how many there are.
   *
   * The height term is a safety net for unusual `perRow` values — a tall narrow
   * group still has to fit — and never binds at the default of five.
   */
  const widthLimited = size / (perRow + (perRow - 1) * GROUP_GAP_RATIO);
  const heightLimited = size / (rows + (rows - 1) * GROUP_GAP_RATIO);
  const itemSize = Math.floor(Math.min(widthLimited, heightLimited));
  const gap = Math.max(2, Math.round(itemSize * GROUP_GAP_RATIO));

  return { perRow, rows, itemSize, gap };
}

/**
 * How tall a visual actually draws when given `size` to work with.
 *
 * A single object fills its square, so the answer is just `size`. A group does
 * not: ten dots five to a row are two rows tall and five wide, which is much
 * shorter than it is broad. A screen laying visuals out in a grid needs this,
 * because reserving a square for each one leaves most of every cell empty and
 * pushes the rest of the grid off the bottom of the screen.
 */
export function visualHeight(visual: Visual, size: number): number {
  if (visual.kind !== 'group') {
    return size;
  }
  const { rows, itemSize, gap } = groupMetrics(visual, size);
  return rows * itemSize + (rows - 1) * gap;
}

function Group({ visual, size }: { visual: GroupVisual; size: number }) {
  const { perRow, itemSize, gap } = groupMetrics(visual, size);

  // Split the items into rows. A short final row stays centred under the
  // others, which is what makes 7 read as "five, and two more".
  const rowCounts: number[] = [];
  for (let remaining = visual.count; remaining > 0; remaining -= perRow) {
    rowCounts.push(Math.min(remaining, perRow));
  }

  return (
    <View style={[styles.group, { gap }]}>
      {rowCounts.map((itemsInRow, rowIndex) => (
        <View key={rowIndex} style={[styles.groupRow, { gap }]}>
          {Array.from({ length: itemsInRow }, (_, itemIndex) => (
            <Shape key={itemIndex} visual={visual.item} size={itemSize} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    // A final short row sits centred under the full ones above it.
    justifyContent: 'center',
  },
  named: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  name: {
    ...textStyles.display,
    width: NAME_WIDTH,
    // Right-aligned so "1" and "10" both end where the dots begin.
    textAlign: 'right',
  },
});

interface LearningObjectProps {
  visual: Visual;
  /** Spoken aloud by a screen reader, e.g. "Red". */
  accessibilityLabel: string;
  /**
   * Written form drawn beside the object, e.g. "3" next to three dots.
   *
   * It lives in here rather than in the screen so that it is *inside* the touch
   * target and inside the animated view: the numeral dims when a tried choice
   * recedes, swells when a correct one is confirmed, and cannot drift away from
   * its dots. A numeral that behaved differently from the quantity it names
   * would be teaching that they are two separate things.
   */
  name?: string;
  size?: number;
  state?: LearningObjectState;
  /** Providing this makes the object tappable. */
  onPress?: () => void;
  /** Tappable but currently not accepting taps, e.g. during narration. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LearningObject({
  visual,
  accessibilityLabel,
  name,
  size = touchTarget.learningObject,
  state = 'idle',
  onPress,
  disabled = false,
  style,
}: LearningObjectProps) {
  // Three separate scale factors, multiplied together in the style below.
  // Keeping them separate means a press can never fight with a pulse — each
  // owns its own factor and they compose instead of overwriting each other.
  const entrance = useSharedValue(0);
  const stateScale = useSharedValue(1);
  const stateOpacity = useSharedValue(1);

  // `false`: the drawing itself gets no frosted card, so there is no shadow to
  // sink. The object being taught is the one thing in the app with no furniture
  // around it — a frame here would compete with the concept, and would make the
  // introduction step look tappable when it deliberately is not. Only `held` is
  // used, because the scale has to be multiplied into the two above rather than
  // applied as a transform of its own.
  const press = usePressFeel(false);

  // Fade and grow in, once, when the object first appears.
  useEffect(() => {
    entrance.value = withTiming(1, gentleTiming);
  }, [entrance]);

  // React to the state prop. One switch, one place.
  useEffect(() => {
    switch (state) {
      case 'interactive':
        stateOpacity.value = withTiming(opacityTo.visible, gentleTiming);
        stateScale.value = withRepeat(
          withTiming(scaleTo.pulse, {
            duration: duration.slow,
            easing: easing.gentleInOut,
          }),
          // `withRepeat` counts each direction separately when reversing, so
          // we double the cycle count to get PULSE_CYCLES there-and-backs.
          PULSE_CYCLES * 2,
          true,
        );
        break;

      case 'confirmed':
        stateOpacity.value = withTiming(opacityTo.visible, gentleTiming);
        // Swell slightly, then settle back. Quick out, slow back — the slow
        // return is what keeps it from feeling like a celebration.
        stateScale.value = withSequence(
          withTiming(scaleTo.confirmed, {
            duration: duration.quick,
            easing: easing.gentle,
          }),
          withTiming(1, gentleTiming),
        );
        break;

      case 'receded':
        stateOpacity.value = withTiming(opacityTo.dimmed, gentleTiming);
        stateScale.value = withTiming(scaleTo.receded, gentleTiming);
        break;

      case 'idle':
        stateOpacity.value = withTiming(opacityTo.visible, gentleTiming);
        stateScale.value = withTiming(1, gentleTiming);
        break;
    }
  }, [state, stateOpacity, stateScale]);

  const animatedStyle = useAnimatedStyle(() => {
    const entranceScale = interpolate(
      entrance.value,
      [0, 1],
      [scaleTo.entranceFrom, 1],
    );
    return {
      opacity: entrance.value * stateOpacity.value,
      transform: [
        {
          scale: entranceScale * stateScale.value * heldScale(press.held.value),
        },
      ],
    };
  });

  const shape = <Shape visual={visual} size={size} />;

  const drawing = (
    <Animated.View style={[animatedStyle, style]}>
      {name === undefined ? (
        shape
      ) : (
        // Numeral first, then the quantity — left to right, the way it will be
        // read later. In the same colour as the dots, because they are one
        // thing said two ways rather than a drawing and its caption.
        <View style={styles.named}>
          <Text
            style={[styles.name, { color: getVisualColor(visual) ?? ui.ink }]}>
            {name}
          </Text>
          {shape}
        </View>
      )}
    </Animated.View>
  );

  // Not tappable — an introduction step, for example. It still needs to be
  // announced to a screen reader, so it gets the label and an 'image' role
  // rather than being wrapped in a button that does nothing.
  if (!onPress) {
    return (
      <Animated.View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}>
        {drawing}
      </Animated.View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // Shrinks very slightly while held, like pressing a real button.
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      // Extends the tappable area beyond the drawing, since small children
      // aim badly. Generous targets are a core requirement of this app.
      hitSlop={16}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}>
      {drawing}
    </Pressable>
  );
}
