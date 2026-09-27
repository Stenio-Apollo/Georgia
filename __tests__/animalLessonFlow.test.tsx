import React from 'react';
import { act, create } from 'react-test-renderer';
import App from '../App';
import {
  letTimePass,
  namedNode,
  pressableNamed,
  shapeSignatureWithin,
  tap,
  visibleText,
} from '../testing/lessonFlow';

/**
 * Walks the DOG lesson through the real app, the way a child would.
 *
 * The two existing flow tests already prove the four-step flow and the counting
 * rendering, so this file only covers what is genuinely new about animals:
 *
 *  1. THE DRAWINGS ARE ACTUALLY DIFFERENT. An animal is a name in the lesson
 *     data and a component in a registry, and `cat: Dog` is a copy-paste that
 *     compiles and passes every content check. Nothing but rendering all three
 *     and comparing them can catch it, and getting it wrong means showing a
 *     child a dog and calling it a cat.
 *
 *  2. THE APP SPEAKS PROPER ENGLISH. "Can you find dog?" would be an animals-
 *     only bug: the wording comes from a second template set that colours and
 *     numbers do not use, so no existing test would notice it was missing.
 */

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the DOG lesson, tapped through end to end', () => {
  it('draws each animal differently and names it with an article', async () => {
    let tree!: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<App />);
    });
    const root = tree.root;

    // ---- HOME -> PICKER --------------------------------------------------
    // Animals was a dimmed card until this step, because the subject had no
    // lessons in it. Three lessons is what opens the door.
    await tap(pressableNamed(root, 'Animals'));
    await letTimePass(500);

    for (const name of ['Dog', 'Cat', 'Bird']) {
      pressableNamed(root, name);
    }

    // THE ASSERTION THIS FILE MOSTLY EXISTS FOR. Three drawings, three
    // different sets of shapes. All three share one fur colour on purpose, so
    // shape is the only thing telling them apart — which makes "are they really
    // different shapes?" a question about whether the subject works at all.
    const signatures = ['Dog', 'Cat', 'Bird'].map(name =>
      shapeSignatureWithin(pressableNamed(root, name)),
    );
    expect(new Set(signatures).size).toBe(3);
    // And each is a drawing with parts, not a placeholder circle.
    for (const signature of signatures) {
      expect(signature.split(',').length).toBeGreaterThan(5);
    }

    await tap(pressableNamed(root, 'Dog'));

    // ---- STEP 1: INTRODUCTION -------------------------------------------
    await letTimePass(500);
    // "a dog", not "dog". The article is the whole point of the second
    // template set in `cues.ts`.
    expect(visibleText(tree)).toContain('This is a dog.');
    expect(visibleText(tree)).toContain('Dog');

    // Nothing is tappable while the child is just watching.
    expect(() => pressableNamed(root, 'Dog')).toThrow();
    namedNode(root, 'Dog');

    await letTimePass(7000);

    // ---- STEP 2: GUIDED -------------------------------------------------
    // "the dog" now that it is on screen and being pointed at, which is how a
    // person would say it.
    expect(visibleText(tree)).toContain('Can you touch the dog?');
    expect(pressableNamed(root, 'Dog').props.disabled).toBe(true);

    await letTimePass(2500);
    const dog = pressableNamed(root, 'Dog');
    expect(dog.props.disabled).toBe(false);

    await tap(dog);
    await letTimePass(900);
    expect(visibleText(tree)).toContain('Yes. A dog.');

    await letTimePass(4500);

    // ---- STEP 3: QUESTION -----------------------------------------------
    expect(visibleText(tree)).toContain('Can you find the dog?');
    await letTimePass(2000);

    for (const name of ['Dog', 'Cat', 'Bird']) {
      expect(pressableNamed(root, name).props.disabled).toBe(false);
    }

    // The three choices are the three animals, still drawn differently now
    // that they are side by side and smaller.
    const choiceSignatures = ['Dog', 'Cat', 'Bird'].map(name =>
      shapeSignatureWithin(pressableNamed(root, name)),
    );
    expect(new Set(choiceSignatures).size).toBe(3);

    // A WRONG ANSWER, on purpose. Nothing is taken away and nothing scolds.
    await tap(pressableNamed(root, 'Cat'));
    await letTimePass(600);
    expect(visibleText(tree)).toContain('Try again.');

    await letTimePass(1500);
    expect(visibleText(tree)).toContain('Can you find the dog?');
    for (const name of ['Dog', 'Cat', 'Bird']) {
      expect(pressableNamed(root, name).props.disabled).toBe(false);
    }

    // The right answer on the second try, treated exactly as on the first.
    await tap(pressableNamed(root, 'Dog'));
    await letTimePass(700);
    expect(visibleText(tree)).toContain("Yes. That's the dog.");

    await letTimePass(3200);

    // ---- STEP 4: COMPLETION ---------------------------------------------
    expect(visibleText(tree)).toContain('You found the dog.');
    expect(() => pressableNamed(root, 'Finish')).toThrow();

    await letTimePass(2500);
    await tap(pressableNamed(root, 'Finish'));
    await letTimePass(500);

    // ---- RESULTS ---------------------------------------------------------
    // "the dog", not "dog": the one full sentence the app writes, and the
    // reason `Concept.inSentence` exists. Lower-casing the name would have
    // produced "We looked at dog."
    expect(visibleText(tree)).toContain('We looked at the dog.');
    pressableNamed(root, 'Again');

    // Dog is first of three, so there is somewhere to go.
    await tap(pressableNamed(root, 'Next'));
    await letTimePass(500);
    expect(visibleText(tree)).toContain('This is a cat.');

    await act(async () => {
      tree.unmount();
    });
  });
});
