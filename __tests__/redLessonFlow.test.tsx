import React from 'react';
import { act, create } from 'react-test-renderer';
import App from '../App';
import {
  letTimePass,
  pressableNamed,
  rawTree,
  tap,
  visibleText,
} from '../testing/lessonFlow';

/**
 * Walks the whole RED lesson the way a child would, through the real app.
 *
 * `src/lesson/reducer.test.ts` tests the rules in isolation. This is the other
 * half: it renders the actual App — router, audio player, animations, SVG
 * drawings, every screen — and taps through it, so it catches the things a pure
 * reducer test cannot. A component reading the wrong field, a caption wired to
 * the wrong cue, a screen that never advances, the "Finish" button appearing at
 * the wrong moment.
 *
 * Timers are faked, so the lesson's real pauses (which add up to about fifteen
 * seconds of deliberate silence) cost nothing to sit through here.
 */

// The audio stub paces itself with setTimeout, and so does the engine. Faking
// timers lets us skip those waits instantly instead of really sleeping.
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the RED lesson, tapped through end to end', () => {
  it('goes home -> introduction -> guided -> question -> completion -> results', async () => {
    let tree!: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<App />);
    });
    const root = tree.root;

    // ---- HOME ------------------------------------------------------------
    // All three subjects have lessons in them now, so all three are doors. The
    // "visible but not openable" case this line used to check — a card for a
    // subject with nothing written yet — is no longer reachable from the
    // content, so it is checked directly against `SubjectCard` instead of
    // through a subject that happens to be empty today.
    expect(visibleText(tree)).toContain('Colors');
    for (const subject of ['Colors', 'Numbers', 'Animals']) {
      pressableNamed(root, subject);
    }

    await tap(pressableNamed(root, 'Colors'));

    // ---- PICKER ----------------------------------------------------------
    // Opening a subject lands on its lessons, not straight into the first one.
    // All six are open from the start; none is locked behind another.
    await letTimePass(500);
    for (const name of ['Red', 'Blue', 'Yellow', 'Green', 'Orange', 'Purple']) {
      pressableNamed(root, name);
    }
    // Nothing is being narrated yet, so no lesson has begun.
    expect(visibleText(tree)).not.toContain('This is red.');

    await tap(pressableNamed(root, 'Red'));

    // ---- STEP 1: INTRODUCTION -------------------------------------------
    // "This is red." then "Red." Nothing to touch — the child just watches.
    await letTimePass(500);
    expect(visibleText(tree)).toContain('This is red.');
    // The object is on screen but deliberately not tappable here.
    expect(() => pressableNamed(root, 'Red')).toThrow();

    // Narration, then the silent observing pause, then it moves itself on.
    await letTimePass(7000);

    // ---- STEP 2: GUIDED -------------------------------------------------
    // "Can you touch red?" and now exactly one thing responds to a touch.
    expect(visibleText(tree)).toContain('Can you touch red?');
    const redObject = pressableNamed(root, 'Red');

    // Taps land only once narration has finished. This one is ignored.
    expect(redObject.props.disabled).toBe(true);

    await letTimePass(2500);
    expect(pressableNamed(root, 'Red').props.disabled).toBe(false);

    // The soft confirmation tone comes first and the words follow it — they are
    // never layered on top of each other — so the response takes a beat to
    // appear. Anything less than the tone's own length and we look too early.
    await tap(pressableNamed(root, 'Red'));
    await letTimePass(800);
    expect(visibleText(tree)).toContain('Yes. Red.');

    await letTimePass(4000);

    // ---- STEP 3: QUESTION -----------------------------------------------
    // Three choices. Red sits in the middle so it cannot be found by always
    // picking an edge.
    expect(visibleText(tree)).toContain('Can you find red?');
    await letTimePass(2000);

    for (const label of ['Blue', 'Red', 'Yellow']) {
      expect(pressableNamed(root, label).props.disabled).toBe(false);
    }

    // A WRONG ANSWER. This is the important part of the whole test.
    await tap(pressableNamed(root, 'Blue'));
    await letTimePass(500);
    expect(visibleText(tree)).toContain('Try again.');

    await letTimePass(1500);

    // Back to the question, with nothing taken away: the caption returns to
    // the original prompt rather than an error, every choice is still
    // tappable, and the lesson has not moved on or locked anything out.
    expect(visibleText(tree)).toContain('Can you find red?');
    expect(visibleText(tree)).not.toContain('Try again.');
    for (const label of ['Blue', 'Red', 'Yellow']) {
      expect(pressableNamed(root, label).props.disabled).toBe(false);
    }

    // The right answer, on the second try, treated exactly as it would be on
    // the first.
    await tap(pressableNamed(root, 'Red'));
    await letTimePass(600);
    expect(visibleText(tree)).toContain("Yes. That's red.");

    await letTimePass(4000);

    // ---- STEP 4: COMPLETION ---------------------------------------------
    expect(visibleText(tree)).toContain('You found red.');
    // Nothing auto-advances here: the way out appears only after the last line
    // has been spoken, and then the screen waits for an adult indefinitely.
    expect(() => pressableNamed(root, 'Finish')).toThrow();

    await letTimePass(2500);
    const finish = pressableNamed(root, 'Finish');

    // Confirm it really does wait rather than ending on a timer.
    await letTimePass(10000);
    expect(visibleText(tree)).toContain('You found red.');

    await tap(finish);
    await letTimePass(500);

    // ---- RESULTS ---------------------------------------------------------
    // No score, no stars, no number of tries. The wrong answer above leaves
    // no trace, which is the whole point.
    expect(visibleText(tree)).toContain('We looked at red.');
    // Checked against the whole tree, props included, so a score could not
    // sneak in as an accessibility label either.
    expect(rawTree(tree)).not.toMatch(/\b[0-9]+ of [0-9]+\b/);
    expect(rawTree(tree)).not.toMatch(/score|stars?|attempts|tries/i);
    pressableNamed(root, 'Again');
    pressableNamed(root, 'Home');
    // Red is the first of six colours, so there is somewhere to go next.
    pressableNamed(root, 'Next');

    // ---- AGAIN -----------------------------------------------------------
    // Unmounting the lesson screen is what resets it — a fresh screen means a
    // fresh engine, back at step one with no state to clear by hand.
    await tap(pressableNamed(root, 'Again'));
    await letTimePass(500);
    expect(visibleText(tree)).toContain('This is red.');

    await act(async () => {
      tree.unmount();
    });
  });

  it('lets a child leave a lesson part-way without anything hanging', async () => {
    let tree!: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<App />);
    });
    const root = tree.root;

    await tap(pressableNamed(root, 'Colors'));
    await letTimePass(500);
    await tap(pressableNamed(root, 'Red'));

    // Leave mid-narration, while audio and a timer are both still in flight.
    // The engine's cleanup has to cancel them; if a late-resolving promise
    // dispatched into the unmounted lesson, React would warn here and the
    // picker would not be what is rendered.
    await letTimePass(600);
    await tap(pressableNamed(root, 'Close lesson'));
    await letTimePass(4000);

    // Closing a lesson goes back to the picker it was chosen from, so the next
    // one is a single tap away rather than two.
    expect(visibleText(tree)).toContain('Colors');
    pressableNamed(root, 'Blue');
    expect(visibleText(tree)).not.toContain('This is red.');

    await act(async () => {
      tree.unmount();
    });
  });
});
