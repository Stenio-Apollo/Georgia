import { act, create, type ReactTestInstance } from 'react-test-renderer';

/**
 * Shared helpers for the end-to-end lesson tests.
 *
 * These live outside `__tests__` on purpose: Jest treats everything in that
 * folder as a test suite, and a file of helpers with no tests in it would fail
 * as "your test suite must contain at least one test".
 *
 * They are shared rather than copied because both flow tests need the same
 * three awkward things — stepping fake timers in slices, finding a tappable
 * node by its accessibility label, and reading the words off a rendered tree.
 * Each of those took a debugging session to get right, and having one copy
 * means the next flow test inherits that work instead of repeating it.
 */

/** A rendered app, as returned by react-test-renderer's `create`. */
export type Rendered = ReturnType<typeof create>;

/**
 * Push time forward, letting React settle in between.
 *
 * Advancing in small slices matters. A lesson moves forward in a chain: a timer
 * fires, that resolves a promise, the promise dispatches an event, the reducer
 * changes phase, the re-render starts a *new* timer. Promises resolve between
 * slices, so stepping through in pieces lets the whole chain unwind. One big
 * jump would fire the first timer and then find nothing else scheduled.
 */
export async function letTimePass(totalMs: number): Promise<void> {
  const sliceMs = 50;
  for (let elapsed = 0; elapsed < totalMs; elapsed += sliceMs) {
    await act(async () => {
      jest.advanceTimersByTime(sliceMs);
    });
  }
}

/** Finds something tappable by the label a screen reader would announce. */
export function pressableNamed(
  root: ReactTestInstance,
  label: string,
): ReactTestInstance {
  const matches = root.findAll(
    node =>
      node.props?.accessibilityLabel === label &&
      typeof node.props?.onPress === 'function',
    { deep: true },
  );
  if (matches.length === 0) {
    throw new Error(`Nothing tappable labelled "${label}" is on screen`);
  }
  return matches[0];
}

/**
 * Finds any node by its accessibility label, tappable or not.
 *
 * `pressableNamed` deliberately requires an `onPress`, which is what lets a
 * test assert that something is *not* touchable yet. This is the version for
 * the other case: reading what was drawn, for something a child only watches.
 */
export function namedNode(
  root: ReactTestInstance,
  label: string,
): ReactTestInstance {
  const matches = root.findAll(
    node => node.props?.accessibilityLabel === label,
    { deep: true },
  );
  if (matches.length === 0) {
    throw new Error(`Nothing labelled "${label}" is on screen`);
  }
  return matches[0];
}

/** Taps it, the way a finger would. */
export async function tap(node: ReactTestInstance): Promise<void> {
  await act(async () => {
    node.props.onPress();
  });
}

/**
 * Pulls the words out of a rendered tree.
 *
 * Searching the raw JSON does not work. React splits interpolated text into
 * separate nodes — `We looked at {name}.` becomes three of them — so the
 * finished sentence never appears as one string. This walks the tree instead,
 * joining text within a single `Text` and putting a newline between separate
 * elements so unrelated labels cannot merge into a phrase that was never
 * actually on screen.
 */
function textOf(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join('');
  }
  if (node && typeof node === 'object' && 'children' in node) {
    const element = node as { type?: unknown; children?: unknown };
    const inner = textOf(element.children);
    return element.type === 'Text' ? inner : `\n${inner}\n`;
  }
  return '';
}

/** Everything currently readable on screen. */
export function visibleText(tree: Rendered): string {
  return textOf(tree.toJSON());
}

/**
 * The words rendered inside one node.
 *
 * `visibleText` reads the whole screen, which is too blunt for "does THIS
 * choice show its numeral?" — a "3" anywhere on screen would satisfy it,
 * including the "3" belonging to a different choice.
 */
export function textWithin(node: ReactTestInstance): string {
  return node
    // `String(...)` rather than `=== 'Text'`: a node's type is a host name or a
    // component, and TypeScript will not compare those two to a bare string.
    .findAll(child => String(child.type) === 'Text', { deep: true })
    .flatMap(text => text.children)
    .filter((child): child is string => typeof child === 'string')
    .join('');
}

/** The full tree including props, for checking something is *absent*. */
export function rawTree(tree: Rendered): string {
  return JSON.stringify(tree.toJSON());
}

/** The component name of a rendered node, or '' for a host element like View. */
function elementName(node: ReactTestInstance): string {
  if (typeof node.type === 'string') {
    return '';
  }
  const type = node.type as { displayName?: string; name?: string };
  return type.displayName ?? type.name ?? '';
}

/** The SVG shapes drawn inside a node, named, in the order they are drawn. */
function svgShapesWithin(node: ReactTestInstance, allowed: string[]): string[] {
  return node
    .findAll(child => allowed.includes(elementName(child)), { deep: true })
    .map(elementName);
}

/**
 * How many individual shapes are drawn inside a node.
 *
 * A group of seven dots renders as seven `<Circle>` elements, so counting them
 * is how a test checks that "seven" actually put seven things on screen — the
 * one thing a number lesson absolutely must get right, and something no amount
 * of checking the lesson data can prove about the rendering.
 *
 * Only counts the shapes the counting lessons are built from. An animal is one
 * object made of a dozen ellipses, and counting *those* would mean nothing.
 */
export function shapeCountWithin(node: ReactTestInstance): number {
  return svgShapesWithin(node, ['Circle', 'Rect']).length;
}

/**
 * A fingerprint of how something is drawn: every SVG shape, in order.
 *
 * This is for the question no other check can answer — are two drawings
 * actually different? The animal registry maps a name to a component, and
 * `cat: Dog` is a copy-paste that compiles, passes every content check, and
 * produces an app that confidently shows a child a dog and calls it a cat.
 * Comparing fingerprints catches it.
 */
export function shapeSignatureWithin(node: ReactTestInstance): string {
  return svgShapesWithin(node, [
    'Circle',
    'Ellipse',
    'Rect',
    'Path',
    'Line',
    'Polygon',
  ]).join(',');
}
