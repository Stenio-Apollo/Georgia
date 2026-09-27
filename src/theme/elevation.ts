import { StyleSheet } from 'react-native';

/**
 * Depth: how this app says "you can touch this".
 *
 * A child using this cannot read, so the shape of a thing is the only
 * instruction they get. That makes a raised card load-bearing rather than
 * decorative — it is the app's single word for *touchable*, and everything flat
 * is, by contrast, something you only look at. Nothing in here should be
 * sprinkled onto a panel just because the panel looks bare; a card on something
 * untappable is a lie a two-year-old will believe.
 *
 * THE FROST IS NOT A BLUR, and that is on purpose rather than a shortcut.
 * A real blur view samples what is behind it, and behind every card in this app
 * is one flat background colour — so blurring would produce exactly the fill it
 * started with, in exchange for a native dependency and a rebuild. What actually
 * makes frosted glass read as glass from the front is that it is translucent and
 * lit from above, and both of those are plain style props.
 *
 * Because the face is translucent rather than an opaque fill, these tokens stay
 * correct whatever `ui.background` becomes later: the card is a pale wash *of*
 * the page rather than a different colour sitting on it.
 */

export const frost = {
  /**
   * The card face. Pale and warm, and deliberately see-through: at 62% the
   * background tints it, which is what stops a screen of cards looking like
   * white paper cut-outs dropped on a tan page.
   */
  face: 'rgb(248 226 204 / 0.39)',
  /**
   * The lit top edge — one bright hairline along the top of the card.
   *
   * This single line is what does the "3D" work. A shadow alone reads as a flat
   * shape floating above the page; a highlight on top and a shadow below reads
   * as a shape with *thickness*, because that is what a real lip catching the
   * light looks like.
   */
  highlight: 'rgba(255, 255, 255, 0.85)',
  /** The other three edges, where the card turns away from the light. */
  hairline: 'rgba(120, 96, 68, 0.14)',
} as const;

/**
 * The two heights a card sits at: resting, and pressed toward the page.
 *
 * `shadowColor` is a warm brown, never black. Black shadow under this palette's
 * `#edd1b3` background does not read as shade, it reads as grey dirt — the
 * shadow has to be a darker version of the surface it falls on.
 *
 * The iOS and Android props both have to be here. `shadowOffset`/`Opacity`/
 * `Radius` are ignored on Android, which draws shadows only from `elevation`,
 * and `elevation` is ignored on iOS. Setting one and not the other means the
 * whole effect silently vanishes on half the devices.
 */
export const elevation = {
  resting: {
    shadowColor: '#5C4632',
    // Straight down. A card lit from directly above has no sideways offset, and
    // an angled shadow would need every card on screen to agree about where the
    // light is coming from.
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  /**
   * Held down. Not zero — a pressed card is still slightly above the page, and
   * dropping the shadow entirely makes it look like it fell off rather than
   * like it was pushed.
   */
  pressed: {
    shadowOpacity: 0.07,
    elevation: 2,
  },
} as const;

/**
 * Spread this into a `StyleSheet` entry to make it a frosted card.
 *
 * A spreadable style object rather than a `<FrostedCard>` component, because the
 * four things that need it are shaped differently — a wide row card, a grid
 * tile, a pill-shaped button, and a style *handed to* `LearningObject` so it
 * lands inside that component's Pressable. Three of those four could not use a
 * wrapper without an extra layer of nesting, and the theme already works by
 * handing out tokens.
 *
 * It does not set a `borderRadius`: the caller's own corner is part of its
 * identity, and a button is a pill while a tile is a rounded square.
 *
 * One trap worth knowing about: never put `overflow: 'hidden'` on a view
 * carrying this. It clips the view's own shadow away on iOS, and the card goes
 * flat for reasons that are very hard to see in a diff.
 */
export const cardSurface = {
  backgroundColor: frost.face,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: frost.hairline,
  // Overrides the hairline above for the top edge only. A full point rather
  // than a hairline, because a highlight thinner than the shadow it is
  // balancing does not register.
  borderTopWidth: 1,
  borderTopColor: frost.highlight,
  ...elevation.resting,
} as const;
