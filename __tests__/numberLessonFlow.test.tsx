import React from 'react';
import { act, create } from 'react-test-renderer';
import App from '../App';
import {
  letTimePass,
  namedNode,
  pressableNamed,
  rawTree,
  shapeCountWithin,
  tap,
  textWithin,
  visibleText,
} from '../testing/lessonFlow';

/**
 * Walks the THREE lesson through the real app, the way a child would.
 *
 * `redLessonFlow.test.tsx` already proves the four-step flow works. This test
 * exists for the part that is genuinely different about a counting lesson: the
 * answer is a *quantity*, which means the test has to count what was actually
 * drawn on screen.
 *
 * That is not something the content test can check. `content.test.ts` proves
 * the lesson *data* says three; only rendering it proves three circles came out
 * the other end. A group that drew the right number of rows but dropped the
 * last item would pass every data check and quietly teach a child the wrong
 * amount.
 */

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the THREE lesson, tapped through end to end', () => {
  it('draws the right number of objects at every step', async () => {
    let tree!: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<App />);
    });
    const root = tree.root;

    // ---- HOME -> PICKER --------------------------------------------------
    await tap(pressableNamed(root, 'Numbers'));
    await letTimePass(500);

    // All ten are open from the start. Nothing is locked behind anything else:
    // a child who wants to do "two" nine times is doing the right thing.
    for (const numeral of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) {
      pressableNamed(root, numeral);
    }

    // The tiles show the quantity too, not just the numeral.
    expect(shapeCountWithin(pressableNamed(root, '7'))).toBe(7);
    expect(shapeCountWithin(pressableNamed(root, '10'))).toBe(10);

    await tap(pressableNamed(root, '3'));

    // ---- STEP 1: INTRODUCTION -------------------------------------------
    await letTimePass(500);
    expect(visibleText(tree)).toContain('This is three.');

    // THE ASSERTION THIS WHOLE FILE EXISTS FOR. Three dots, on screen, drawn.
    expect(shapeCountWithin(namedNode(root, '3'))).toBe(3);

    // The numeral is shown alongside them the entire time — exposure to the
    // symbol without ever being asked to decode it.
    expect(visibleText(tree)).toContain('3');

    // Nothing is tappable while the child is just watching.
    expect(() => pressableNamed(root, '3')).toThrow();

    await letTimePass(7000);

    // ---- STEP 2: GUIDED -------------------------------------------------
    expect(visibleText(tree)).toContain('Can you touch three?');
    expect(pressableNamed(root, '3').props.disabled).toBe(true);

    await letTimePass(2500);
    const threeObject = pressableNamed(root, '3');
    expect(threeObject.props.disabled).toBe(false);
    expect(shapeCountWithin(threeObject)).toBe(3);

    // And the numeral is still there while the child is being asked to touch.
    // Nothing else on this step writes a "3" — the narration says "three" — so
    // this fails the moment the numeral is dropped from the guided step.
    expect(visibleText(tree)).toContain('3');

    // The confirmation tone plays first and the words follow it, never layered,
    // so the response takes a beat to appear.
    await tap(threeObject);
    await letTimePass(900);
    expect(visibleText(tree)).toContain('Yes. Three.');

    await letTimePass(4500);

    // ---- STEP 3: QUESTION -----------------------------------------------
    expect(visibleText(tree)).toContain('Can you find three?');
    await letTimePass(2000);

    // Five, one, three — stacked, so each group gets the full width. The answer
    // is last here; in other lessons it is first or in the middle, so "it's the
    // middle one" never becomes the thing being learned.
    for (const label of ['Five', 'One', 'Three']) {
      expect(pressableNamed(root, label).props.disabled).toBe(false);
    }

    // Each choice draws exactly the amount it claims. If these ever disagreed,
    // a child could be marked wrong for counting correctly.
    expect(shapeCountWithin(pressableNamed(root, 'Five'))).toBe(5);
    expect(shapeCountWithin(pressableNamed(root, 'One'))).toBe(1);
    expect(shapeCountWithin(pressableNamed(root, 'Three'))).toBe(3);

    // And each one writes its own numeral beside its own dots. Checked per
    // choice rather than over the whole screen, because "the screen contains a
    // 3" would pass even if all three trays were labelled "3".
    expect(textWithin(pressableNamed(root, 'Five'))).toBe('5');
    expect(textWithin(pressableNamed(root, 'One'))).toBe('1');
    expect(textWithin(pressableNamed(root, 'Three'))).toBe('3');

    // A WRONG ANSWER, on purpose.
    await tap(pressableNamed(root, 'Five'));
    await letTimePass(600);
    expect(visibleText(tree)).toContain('Try again.');

    await letTimePass(1500);

    // Back to the question with nothing taken away: the original prompt
    // returns rather than an error, and every choice is still tappable.
    expect(visibleText(tree)).toContain('Can you find three?');
    expect(visibleText(tree)).not.toContain('Try again.');
    for (const label of ['Five', 'One', 'Three']) {
      expect(pressableNamed(root, label).props.disabled).toBe(false);
    }

    // The right answer on the second try, treated exactly as on the first.
    await tap(pressableNamed(root, 'Three'));
    await letTimePass(700);
    expect(visibleText(tree)).toContain("Yes. That's three.");

    // Just far enough to land early in the completion step's narration. Waiting
    // longer would walk past the moment this next assertion is about.
    await letTimePass(3200);

    // ---- STEP 4: COMPLETION ---------------------------------------------
    expect(visibleText(tree)).toContain('You found three.');
    // The way out appears only once the last line has been spoken, and then the
    // screen waits for an adult indefinitely.
    expect(() => pressableNamed(root, 'Finish')).toThrow();

    await letTimePass(2500);
    await tap(pressableNamed(root, 'Finish'));
    await letTimePass(500);

    // ---- RESULTS ---------------------------------------------------------
    // No count of tries, and the wrong answer above leaves no trace.
    expect(visibleText(tree)).toContain('We looked at 3.');
    expect(rawTree(tree)).not.toMatch(/score|stars?|attempts|tries/i);
    pressableNamed(root, 'Again');

    // ---- NEXT ------------------------------------------------------------
    // Three of ten, so there is somewhere to go. "Next" is the quiet button;
    // "Again" is the primary one, because repeating is the point.
    await tap(pressableNamed(root, 'Next'));
    await letTimePass(500);
    expect(visibleText(tree)).toContain('This is four.');
    expect(shapeCountWithin(namedNode(root, '4'))).toBe(4);

    await act(async () => {
      tree.unmount();
    });
  });

  it('offers no Next on the last lesson of a subject', async () => {
    let tree!: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<App />);
    });
    const root = tree.root;

    await tap(pressableNamed(root, 'Numbers'));
    await letTimePass(500);
    await tap(pressableNamed(root, '10'));

    // Walk it. Ten is the last number, so the results screen at the end is the
    // one place `getNextLesson` returns nothing.
    await letTimePass(7500);
    expect(visibleText(tree)).toContain('Can you touch ten?');
    expect(shapeCountWithin(pressableNamed(root, '10'))).toBe(10);

    await letTimePass(2500);
    await tap(pressableNamed(root, '10'));
    await letTimePass(5500);

    expect(visibleText(tree)).toContain('Can you find ten?');
    await letTimePass(2000);
    await tap(pressableNamed(root, 'Ten'));
    await letTimePass(5500);

    expect(visibleText(tree)).toContain('You found ten.');
    await letTimePass(2500);
    await tap(pressableNamed(root, 'Finish'));
    await letTimePass(500);

    // ---- RESULTS, AT THE END OF THE SUBJECT ------------------------------
    expect(visibleText(tree)).toContain('We looked at 10.');
    // "Again" and "Home" are always there. "Next" is not, because there is no
    // next — better than a button that does nothing, or one that loops silently
    // back to "one" and leaves a parent wondering what happened.
    pressableNamed(root, 'Again');
    pressableNamed(root, 'Home');
    expect(() => pressableNamed(root, 'Next')).toThrow();

    await act(async () => {
      tree.unmount();
    });
  });
});
