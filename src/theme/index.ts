/**
 * Single entry point for the design system.
 *
 * Import from here (`import { ui, spacing } from '../../theme'`) rather than
 * from the individual files, so that reorganising the theme later does not
 * mean touching every component.
 */
export {
  colors,
  ui,
  learning,
  subjectAccent,
  countingObject,
  animal,
} from './colors';
export type { LearningColorName } from './colors';
export { frost, elevation, cardSurface } from './elevation';
export { spacing, touchTarget, radius } from './spacing';
export { typography, fontSize, textStyles } from './typography';
