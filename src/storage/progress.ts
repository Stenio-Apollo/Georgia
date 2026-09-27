import type { StepAttempts } from '../lesson/reducer';

/**
 * Where learning history will live.
 *
 * **This is not wired up yet.** The lesson engine already records attempts per
 * step in `LessonState.attempts`, but nothing saves them anywhere, so closing
 * the app forgets everything. That is fine for the RED lesson and is the
 * honest state of things today.
 *
 * It exists now as an interface so that the Parent screen and the "needs
 * review" logic have something to be written against, and so persistence can
 * be added without the engine or any screen knowing where data is stored.
 *
 * When you connect this up:
 *   1. `npm install @react-native-async-storage/async-storage` (+ pod install)
 *   2. Write `createAsyncStorageProgressStore()` implementing the interface
 *   3. Save from the completion step of `useLessonEngine`
 *
 * Deliberately NOT recorded: timestamps precise enough to measure speed,
 * anything resembling a score, and any streak or daily-use counter. The
 * question this data should answer is "which ideas deserve another look?",
 * not "how is my child performing?".
 */

export interface ConceptRecord {
  conceptId: string;
  /** Times the concept has been introduced. */
  introduced: number;
  /** Times a lesson containing it has been completed. */
  practised: number;
  /** Totals across all attempts, used only to suggest what to revisit. */
  attempts: StepAttempts;
  /** Epoch milliseconds of the last time it was seen, or null. */
  lastSeenAt: number | null;
}

export type ProgressData = Record<string, ConceptRecord>;

export interface ProgressStore {
  load(): Promise<ProgressData>;
  /** Merge one completed lesson into the record. */
  recordLesson(input: {
    conceptId: string;
    attempts: StepAttempts;
    completedAt: number;
  }): Promise<void>;
  /** Wipe everything. Parent mode will need this. */
  clear(): Promise<void>;
}

/**
 * An in-memory store: satisfies the interface, forgets on restart.
 *
 * Useful for trying out the Parent screen and for tests, where persisting
 * between runs would be a nuisance rather than a feature.
 */
export function createInMemoryProgressStore(): ProgressStore {
  let data: ProgressData = {};

  return {
    async load() {
      return data;
    },

    async recordLesson({ conceptId, attempts, completedAt }) {
      const existing = data[conceptId];
      data = {
        ...data,
        [conceptId]: {
          conceptId,
          introduced: (existing?.introduced ?? 0) + 1,
          practised: (existing?.practised ?? 0) + 1,
          attempts: {
            correct: (existing?.attempts.correct ?? 0) + attempts.correct,
            incorrect: (existing?.attempts.incorrect ?? 0) + attempts.incorrect,
          },
          lastSeenAt: completedAt,
        },
      };
    },

    async clear() {
      data = {};
    },
  };
}
