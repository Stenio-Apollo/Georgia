import { Platform, type TextStyle } from 'react-native';

/**
 * Typography for a young child and a nearby adult.
 *
 * Everything is larger than a typical app. There is very little text on any
 * screen, so it can afford to be big, and big type is easier for a parent to
 * read aloud at arm's length.
 *
 * We use the system font for now. If you later add a custom rounded typeface
 * (something like Quicksand or Nunito would suit this app), this is the only
 * file that needs to change.
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const fontSize = {
  caption: 18,
  body: 22,
  title: 32,
  display: 48,
} as const;

/**
 * Pre-built text styles. Components should use these rather than setting
 * fontSize/fontWeight by hand, so the app stays typographically consistent.
 */
export const textStyles = {
  /** The name of the thing being taught, e.g. "Red". The largest text we use. */
  display: {
    fontFamily,
    fontSize: fontSize.display,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: undefined, // caller sets the colour; often a learning colour
  } as TextStyle,

  /** Screen and section titles, e.g. "Colors". */
  title: {
    fontFamily,
    fontSize: fontSize.title,
    fontWeight: '600',
    letterSpacing: 0.3,
  } as TextStyle,

  /** Spoken narration shown as on-screen text, e.g. "Can you find red?" */
  body: {
    fontFamily,
    fontSize: fontSize.body,
    fontWeight: '500',
    lineHeight: fontSize.body * 1.45,
  } as TextStyle,

  /** Quiet supporting text, mostly parent-facing. */
  caption: {
    fontFamily,
    fontSize: fontSize.caption,
    fontWeight: '500',
    lineHeight: fontSize.caption * 1.4,
  } as TextStyle,
} as const;

export const typography = { fontFamily, fontSize, textStyles };
