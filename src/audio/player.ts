import { audioCues, soundEffects, type AudioCueId, type SoundEffectId } from './cues';
import type { AudioPlayer } from './types';

/**
 * THE ONE FILE TO REPLACE WHEN YOU ADD REAL AUDIO.
 *
 * React Native has no built-in audio playback, and rather than pick a library
 * before we need one, we ship a stub that *simulates* playback using each
 * cue's known duration.
 *
 * This is not a throwaway. The lesson engine paces itself by awaiting audio,
 * so simulating realistic durations means the timing of the RED lesson is
 * already correct today. When real recordings arrive, the lesson does not
 * change — only `createAudioPlayer` below.
 *
 * See `src/audio/files/README.md` for how to swap in a real implementation.
 */

/**
 * React Native provides `process.env.NODE_ENV` at runtime, but the types for
 * it live in `@types/node`, which this project deliberately does not install —
 * pulling in Node's globals would also change what `setTimeout` resolves to
 * across the whole app. Declaring just the one field we read keeps that
 * contained to this file.
 */
declare const process: { env: { NODE_ENV?: string } };

/**
 * Logs every cue to the Metro console, so you can see and read the narration
 * while there are no recordings yet. Set to false once real audio lands.
 *
 * Off during tests: the flow test plays the whole lesson, and forty lines of
 * audio log would bury the actual test results.
 */
const LOG_AUDIO = process.env.NODE_ENV !== 'test';

function log(message: string): void {
  if (LOG_AUDIO) {
    console.log(`[audio] ${message}`);
  }
}

/**
 * A pending simulated sound: the timer that will finish it, plus the function
 * that resolves the promise the caller is awaiting.
 */
interface PendingSound {
  timer: ReturnType<typeof setTimeout>;
  resolve: () => void;
}

export function createStubAudioPlayer(): AudioPlayer {
  const pending = new Set<PendingSound>();

  /**
   * Incremented by `stopAll()`. A multi-line sequence captures this before it
   * starts and re-checks it after every line, which is how it knows to give up
   * rather than carry on talking to an empty room.
   */
  let stopToken = 0;

  /**
   * Wait `ms`, but in a way that `stopAll()` can interrupt.
   *
   * Note that interrupting *resolves* the promise instead of leaving it
   * hanging. If we simply cleared the timer, any `await` further up the call
   * stack would never continue and that async function would be stuck forever.
   */
  function wait(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      const entry: PendingSound = {
        timer: setTimeout(() => {
          pending.delete(entry);
          resolve();
        }, ms),
        resolve,
      };
      pending.add(entry);
    });
  }

  async function speak(id: AudioCueId): Promise<void> {
    const cue = audioCues[id];
    log(`🔊 "${cue.text}"  (${cue.file}, ${cue.durationMs}ms)`);
    await wait(cue.durationMs);
  }

  async function speakSequence(
    ids: AudioCueId[],
    beatMs: number,
    onCueStart?: (id: AudioCueId, index: number) => void,
  ): Promise<void> {
    // Remember which "era" we started in. If `stopAll()` runs while we are
    // part-way through, this no longer matches and we stop.
    //
    // Without this check the sequence would keep going after being stopped:
    // `stopAll()` resolves the line currently playing (it has to — see `wait`
    // above), and a plain loop reads that as "line finished, on to the next
    // one". A child who left the screen mid-sentence would hear the rest of
    // the narration follow them out.
    const token = stopToken;
    const stopped = () => token !== stopToken;

    for (let index = 0; index < ids.length; index += 1) {
      // A pause *between* lines, but not before the first or after the last.
      if (index > 0) {
        await wait(beatMs);
        if (stopped()) {
          return;
        }
      }
      onCueStart?.(ids[index], index);
      await speak(ids[index]);
      if (stopped()) {
        return;
      }
    }
  }

  async function playSound(id: SoundEffectId): Promise<void> {
    const sound = soundEffects[id];
    log(`🔔 ${id} (${sound.file}, ${sound.durationMs}ms)`);
    await wait(sound.durationMs);
  }

  function stopAll(): void {
    stopToken += 1;
    pending.forEach(entry => {
      clearTimeout(entry.timer);
      entry.resolve();
    });
    pending.clear();
  }

  return { speak, speakSequence, playSound, stopAll };
}

/**
 * The app calls this exactly once, from `AudioProvider`.
 *
 * To move to real audio, change this function body to return your real
 * implementation. Nothing else in the codebase needs to change.
 */
export function createAudioPlayer(): AudioPlayer {
  return createStubAudioPlayer();
}
