/**
 * A spacing scale based on multiples of 4.
 *
 * Using a fixed scale instead of arbitrary numbers is what makes a layout feel
 * calm and intentional. Reach for the next step up when in doubt — this app
 * wants generous whitespace, not tight packing.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * Minimum size for anything a child taps.
 *
 * Apple's guideline for adults is 44pt. Small children have poor fine motor
 * control and aim badly, so we set a much larger floor and never go below it.
 */
export const touchTarget = {
  minimum: 72,
  comfortable: 120,
  /** Size of the main object being taught, e.g. the red circle. */
  learningObject: 200,
} as const;

/** Corner rounding. Soft, like a sanded wooden toy. */
export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  /** For pills and circles. */
  full: 999,
} as const;
