import React from 'react';
import { act, create } from 'react-test-renderer';
import { pressableNamed, visibleText } from '../../../testing/lessonFlow';
import { ui } from '../../theme';
import { SubjectCard } from './SubjectCard';

/**
 * The "not written yet" state of a subject card.
 *
 * This used to be covered incidentally by the RED flow test, which tapped
 * around the home screen and checked that Animals — empty at the time — was not
 * openable. Now that all three subjects have lessons, nothing in the app
 * renders an unavailable card, and that behaviour would have quietly lost its
 * only test.
 *
 * It is still worth keeping, for two reasons. The rule is a real product
 * decision (an empty subject is shown, dimmed and marked "Soon", rather than
 * hidden — so a child sees the same three doors every time). And the next
 * subject added to this app will be empty on the day it is added, which is
 * exactly when a regression here would appear.
 *
 * So the test moved to the component that owns the rule instead of a screen
 * that happened to demonstrate it.
 */

function renderCard(isAvailable: boolean) {
  let tree!: ReturnType<typeof create>;
  const onPress = jest.fn();
  act(() => {
    tree = create(
      <SubjectCard
        title="Shapes"
        description="Circle, square, triangle"
        accentColor={ui.terracotta}
        isAvailable={isAvailable}
        onPress={onPress}
      />,
    );
  });
  return { tree, root: tree.root, onPress };
}

describe('a subject with lessons in it', () => {
  it('is a door: tappable, and says what is inside', () => {
    const { tree, root, onPress } = renderCard(true);

    const card = pressableNamed(root, 'Shapes');
    expect(card.props.disabled).toBe(false);

    act(() => {
      card.props.onPress();
    });
    expect(onPress).toHaveBeenCalled();

    expect(visibleText(tree)).toContain('Circle, square, triangle');
  });
});

describe('a subject with nothing written yet', () => {
  it('is shown rather than hidden, so the home screen keeps its shape', () => {
    const { tree } = renderCard(false);

    // Still there, still named. A child should find the same doors in the same
    // places every time they open the app.
    expect(visibleText(tree)).toContain('Shapes');
    expect(visibleText(tree)).toContain('Soon');
  });

  it('cannot be opened, and says so to a screen reader', () => {
    const { root } = renderCard(false);

    // Tapping it must do nothing — opening an empty subject would land on a
    // picker with no tiles in it, which reads as a broken app rather than as an
    // unfinished one.
    const card = root.findByProps({
      accessibilityLabel: 'Shapes, not available yet',
    });
    expect(card.props.disabled).toBe(true);
    expect(card.props.accessibilityState).toEqual({ disabled: true });

    // And it is not reachable as a plain "Shapes" button, which is what the
    // flow tests look for.
    expect(() => pressableNamed(root, 'Shapes')).toThrow();
  });
});
