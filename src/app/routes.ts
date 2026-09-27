/**
 * Every place you can be in the app.
 *
 * This is a discriminated union: each route has a `name`, and routes that need
 * extra information carry it. TypeScript then guarantees you cannot navigate
 * to 'lesson' without a lessonId, or read `lessonId` off the home route.
 */
import type { SubjectId } from '../lesson/types';

export type Route =
  | { name: 'home' }
  /** The lesson picker for one subject, e.g. all six colours. */
  | { name: 'subject'; subjectId: SubjectId }
  | { name: 'lesson'; lessonId: string }
  | { name: 'results'; lessonId: string }
  | { name: 'parent' };

/**
 * A string that changes whenever the route changes.
 *
 * The router uses this to trigger the crossfade between screens — a plain
 * string is easy to compare, where route objects are not.
 */
export function routeKey(route: Route): string {
  switch (route.name) {
    case 'lesson':
    case 'results':
      return `${route.name}:${route.lessonId}`;
    case 'subject':
      return `subject:${route.subjectId}`;
    default:
      return route.name;
  }
}
