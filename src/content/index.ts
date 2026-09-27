import type { Lesson, Subject, SubjectId } from '../lesson/types';
import { animalsSubject } from './animals';
import { colorsSubject } from './colors';
import { numbersSubject } from './numbers';

/**
 * The content registry: every subject and lesson in the app.
 *
 * Screens read from here rather than importing individual lesson files, so
 * content can be reorganised without touching UI code.
 */
export const subjects: Subject[] = [
  colorsSubject,
  numbersSubject,
  animalsSubject,
];

export function getSubject(id: SubjectId): Subject | undefined {
  return subjects.find(subject => subject.id === id);
}

/** Find a lesson by id, across all subjects. */
export function getLesson(lessonId: string): Lesson | undefined {
  for (const subject of subjects) {
    const found = subject.lessons.find(lesson => lesson.id === lessonId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * The lesson a subject should open with.
 *
 * Today this is simply the first one. When there are several lessons per
 * subject this is where "continue where we left off" or "review what needs
 * practice" will be decided, using the data in `src/storage/progress.ts`.
 */
export function getFirstLesson(subjectId: SubjectId): Lesson | undefined {
  return getSubject(subjectId)?.lessons[0];
}

/**
 * Every lesson in a subject, in teaching order.
 *
 * Returns an empty array for a subject with nothing written yet, rather than
 * undefined, so the picker screen can map over it without a guard.
 */
export function getLessonsForSubject(subjectId: SubjectId): Lesson[] {
  return getSubject(subjectId)?.lessons ?? [];
}

/**
 * The lesson after this one, within the same subject.
 *
 * Returns undefined at the end of a subject, which is what the results screen
 * uses to decide whether to offer "Next" at all — rather than showing a button
 * that does nothing, or looping back to the beginning.
 *
 * Note it finds the subject from the lesson itself (`concept.subject`), so a
 * caller only needs the lesson id.
 */
export function getNextLesson(lessonId: string): Lesson | undefined {
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return undefined;
  }
  const siblings = getLessonsForSubject(lesson.concept.subject);
  const index = siblings.findIndex(candidate => candidate.id === lessonId);
  return index === -1 ? undefined : siblings[index + 1];
}

export { animalsSubject, colorsSubject, numbersSubject };
export { animalLessons } from './animals';
export { colorLessons, redLesson } from './colors';
export { numberLessons } from './numbers';
