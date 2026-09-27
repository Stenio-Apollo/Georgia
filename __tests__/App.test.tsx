/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

/**
 * A smoke test for the whole app.
 *
 * The template's version only checked that rendering did not throw. This one
 * also checks the home screen actually shows the three learning areas, which
 * is enough to catch a broken import, a missing provider, or a theme value
 * that does not exist — the mistakes most likely to happen while building out
 * the rest of the app.
 *
 * The detailed behaviour of a lesson is tested in `src/lesson/reducer.test.ts`,
 * where it needs no rendering at all.
 */
test('renders the home screen with all three learning areas', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });

  const rendered = JSON.stringify(tree?.toJSON());
  expect(rendered).toContain('Colors');
  expect(rendered).toContain('Numbers');
  expect(rendered).toContain('Animals');
});
