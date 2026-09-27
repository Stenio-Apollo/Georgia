/**
 * Entry point.
 *
 * The native side (`index.js` -> `AppRegistry`) expects to find the app at
 * `./App`, so this file stays where the React Native template put it. The
 * actual implementation lives in `src/app/App.tsx` alongside the router, so
 * that everything we write is under `src/`.
 *
 * This replaced the template's `NewAppScreen` welcome page, which was the only
 * thing the project rendered before.
 */
export { App as default } from './src/app/App';
