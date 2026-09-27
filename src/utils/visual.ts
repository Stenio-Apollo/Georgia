import type { Visual } from '../lesson/types';

/**
 * The dominant colour of a visual, if it has one.
 *
 * Used to print a concept's name in its own colour on the introduction step —
 * the word "Red" written in red, like a flash card.
 *
 * Returns null when the idea does not apply. An illustrated dog has no single
 * colour, so animal lessons will fall back to the normal ink colour rather
 * than picking something arbitrary.
 *
 * There is deliberately no `default` branch. Every kind is listed, so adding a
 * new one to `Visual` makes TypeScript stop here and ask what its colour is —
 * which is the point of the union. A `default: return null` would compile
 * forever and silently answer "no colour" for things that have one.
 */
export function getVisualColor(visual: Visual): string | null {
  switch (visual.kind) {
    case 'circle':
    case 'rounded-square':
      return visual.color;
    // An illustrated animal has no single colour — a dog is brown fur, a pale
    // muzzle and a dark nose, and picking one of those would be arbitrary. So
    // "Dog" is written in the normal ink colour, which is what the `?? ui.ink`
    // at every call site is for.
    case 'illustration':
      return null;
    // A group takes its colour from the thing being repeated, so the numeral
    // "3" is written in the same colour as the three dots above it.
    case 'group':
      return getVisualColor(visual.item);
  }
}
