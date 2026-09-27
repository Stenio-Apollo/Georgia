import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import type { IllustrationName } from '../../lesson/types';
import { animal } from '../../theme';

/**
 * The animal drawings.
 *
 * Every drawing lives inside a 100x100 box, the same convention `Shape` uses
 * for circles and squares, so every coordinate below is effectively a
 * percentage and the animal is correct at any size — a 44px tile preview and a
 * 200px lesson object are the same numbers.
 *
 * WHY HEADS, NOT WHOLE ANIMALS (except the bird). A face is the most
 * recognisable view of an animal by a long way, and it survives being shrunk:
 * a full-body dog at the size of a picker tile is a brown smudge with legs,
 * whereas droopy ears and a muzzle still say "dog". The bird is drawn whole
 * because a bird's body *is* its silhouette — beak, wing, tail — and a bird's
 * face alone is mostly just a beak.
 *
 * WHY PRIMITIVES, NOT TRACED PATHS. These are built from ellipses, circles and
 * a few short curves rather than the long `d="M..."` strings an illustrator's
 * export would produce. That keeps them readable and editable: you can move a
 * dog's eye by changing a number you can see, without opening a design tool.
 * When real artwork replaces them, only this file changes — no lesson, no
 * screen, and no other component knows these exist.
 *
 * HOW LAYERING WORKS. SVG draws in document order, so later shapes cover
 * earlier ones. That does real work here: the ears are listed *before* the
 * head so they tuck behind it, and the bird's legs before its body so they
 * appear to come out from underneath. Reordering these lines changes the
 * drawing.
 *
 * On colour, see the note on `animal` in `src/theme/colors.ts` — all three
 * share one fur brown on purpose, and it is the most important decision in the
 * whole subject.
 */

/** Line weight for mouths, whiskers and legs. */
const STROKE = 2.5;

/**
 * A dog's head: droopy ears, a long pale muzzle, a big nose.
 *
 * Those three are what the drawing is *for*. The cat below is the same size and
 * the same colour, so the ears (down and rounded, not up and pointed) and the
 * muzzle pushed forward are the entire difference between them.
 */
function Dog() {
  return (
    <G>
      {/* Ears, behind the head so they hang from under it. */}
      <Ellipse cx={19} cy={56} rx={9} ry={21} fill={animal.furDeep} />
      <Ellipse cx={81} cy={56} rx={9} ry={21} fill={animal.furDeep} />

      <Ellipse cx={50} cy={54} rx={30} ry={27} fill={animal.fur} />

      {/* Muzzle, low on the face and wider than the cat's. */}
      <Ellipse cx={50} cy={72} rx={17} ry={12} fill={animal.muzzle} />
      <Path
        d="M50 72 V78"
        stroke={animal.feature}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M50 78 Q45 82 40 77"
        stroke={animal.feature}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M50 78 Q55 82 60 77"
        stroke={animal.feature}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx={50} cy={67} rx={6.5} ry={5} fill={animal.feature} />

      <Circle cx={38} cy={48} r={4} fill={animal.feature} />
      <Circle cx={62} cy={48} r={4} fill={animal.feature} />
    </G>
  );
}

/**
 * A cat's head: pointed ears, a round face, whiskers.
 *
 * Whiskers are worth the six extra lines. They are the one feature no other
 * animal in the set has, which means a child can tell this one apart by a
 * detail rather than by an overall impression — and the triangular ears do the
 * same job from across the room.
 */
function Cat() {
  return (
    <G>
      {/* Ears, behind the head. Straight-sided triangles: nothing else in the
          set has a corner in it. */}
      <Path d="M24 40 L27 9 L52 28 Z" fill={animal.fur} />
      <Path d="M76 40 L73 9 L48 28 Z" fill={animal.fur} />
      <Path d="M30 34 L32 18 L44 27 Z" fill={animal.accent} />
      <Path d="M70 34 L68 18 L56 27 Z" fill={animal.accent} />

      <Circle cx={50} cy={56} r={28} fill={animal.fur} />

      {/* Whiskers start outside the head and end under the muzzle patch, which
          is drawn next and hides their inner ends. */}
      <Path d="M14 54 L37 58" stroke={animal.feature} strokeWidth={1.5} />
      <Path d="M13 62 L37 62" stroke={animal.feature} strokeWidth={1.5} />
      <Path d="M15 70 L37 66" stroke={animal.feature} strokeWidth={1.5} />
      <Path d="M86 54 L63 58" stroke={animal.feature} strokeWidth={1.5} />
      <Path d="M87 62 L63 62" stroke={animal.feature} strokeWidth={1.5} />
      <Path d="M85 70 L63 66" stroke={animal.feature} strokeWidth={1.5} />

      <Ellipse cx={50} cy={68} rx={14} ry={9} fill={animal.muzzle} />
      <Path d="M45 61 H55 L50 67 Z" fill={animal.accent} />
      <Path
        d="M50 67 V70"
        stroke={animal.feature}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M50 70 Q45 75 41 70"
        stroke={animal.feature}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M50 70 Q55 75 59 70"
        stroke={animal.feature}
        strokeWidth={STROKE}
        strokeLinecap="round"
        fill="none"
      />

      <Circle cx={39} cy={50} r={4.5} fill={animal.feature} />
      <Circle cx={61} cy={50} r={4.5} fill={animal.feature} />
    </G>
  );
}

/**
 * A whole bird, seen from the side: beak, folded wing, fanned tail, two legs.
 *
 * Side-on rather than facing us, which is the opposite choice from the other
 * two. A bird head-on has no beak to speak of and no silhouette at all, and the
 * beak is the single feature that makes this a bird rather than a small furry
 * thing.
 */
function Bird() {
  return (
    <G>
      {/* Tail and legs first: the body is drawn over where they join it, so
          neither has a visible stump. */}
      <Path d="M22 56 L3 44 L9 72 Z" fill={animal.furDeep} />
      <Path
        d="M43 74 V91"
        stroke={animal.furDeep}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M55 74 V91"
        stroke={animal.furDeep}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* Feet. Short, with a clear gap between them: drawn any longer they
          merge into one bar and the bird appears to be standing on a shelf.
          Not something you can see in the numbers — only by looking at it. */}
      <Path
        d="M37 92 H47"
        stroke={animal.furDeep}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M51 92 H61"
        stroke={animal.furDeep}
        strokeWidth={3}
        strokeLinecap="round"
      />

      <Ellipse cx={44} cy={58} rx={27} ry={23} fill={animal.fur} />
      <Circle cx={68} cy={34} r={16} fill={animal.fur} />

      {/* Beak, its base tucked inside the head so it reads as attached. */}
      <Path d="M82 28 L97 35 L82 42 Z" fill={animal.beak} />

      {/* Folded wing: the one place a second brown separates two body parts. */}
      <Ellipse cx={42} cy={61} rx={15} ry={10} fill={animal.furDeep} />

      <Circle cx={72} cy={30} r={3.5} fill={animal.feature} />
    </G>
  );
}

/**
 * Every animal the app can draw.
 *
 * Typed as a `Record` over `IllustrationName`, which is the point: TypeScript
 * will not let this object be missing a name, so the type in `lesson/types.ts`
 * and the artwork here cannot drift apart. What it cannot catch is the same
 * drawing listed twice — `cat: Dog` compiles perfectly — so there is a test in
 * `animalLessonFlow.test.tsx` that checks the three actually render
 * differently.
 */
export const illustrations: Record<IllustrationName, () => React.ReactElement> =
  {
    dog: Dog,
    cat: Cat,
    bird: Bird,
  };
