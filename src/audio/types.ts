import type { AudioCueId, SoundEffectId } from './cues';

/**
 * The audio contract for the whole app.
 *
 * Nothing outside `src/audio/` knows how audio is actually produced. Lessons
 * and components only know they can call `speak()` and await it. That is what
 * lets us ship today with a stub and drop in a real audio library later
 * without touching the lesson engine.
 */
export interface AudioPlayer {
  /** Play a single voice cue. Resolves when the line has finished. */
  speak(id: AudioCueId): Promise<void>;

  /**
   * Play several cues back to back with a pause between them, e.g.
   * "This is red." (beat) "Red."
   * Resolves when the last line has finished.
   *
   * `onCueStart` fires as each line begins. The lesson uses it to keep the
   * on-screen caption in step with the voice, so a parent reading along is
   * never ahead of or behind the narration.
   *
   * Implementations MUST abandon the remaining lines if `stopAll()` is called
   * part-way through. Because `stopAll()` resolves the line in flight rather
   * than leaving it hanging, a naive loop mistakes that for "line finished"
   * and keeps talking after the child has left the screen.
   */
  speakSequence(
    ids: AudioCueId[],
    beatMs: number,
    onCueStart?: (id: AudioCueId, index: number) => void,
  ): Promise<void>;

  /** Play a short non-verbal sound. Resolves when it has finished. */
  playSound(id: SoundEffectId): Promise<void>;

  /**
   * Stop everything immediately.
   *
   * Any promise currently being awaited will resolve rather than hang, so
   * `await`ing code unwinds cleanly. Callers must therefore check whether they
   * were cancelled before acting on a completed await — see the `cancelled`
   * flag pattern in `useLessonEngine`.
   */
  stopAll(): void;
}
