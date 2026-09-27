import { audioCues, type AudioCueId } from './cues';
import { createStubAudioPlayer } from './player';

/**
 * Tests for the stub player's cancellation behaviour.
 *
 * This looks like testing a placeholder, and in a sense it is — but these two
 * rules are the *contract* that any real audio implementation must also honour,
 * and both are easy to get wrong in a way that only shows up as a strange bug
 * on a real device. Keeping them here means the contract is written down as
 * something executable rather than a comment someone might not read.
 */

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Let fake time run, flushing promises in between. */
async function letTimePass(totalMs: number): Promise<void> {
  const sliceMs = 50;
  for (let elapsed = 0; elapsed < totalMs; elapsed += sliceMs) {
    jest.advanceTimersByTime(sliceMs);
    await Promise.resolve();
  }
}

const INTRO: AudioCueId[] = ['color.red.this-is', 'color.red.name'];

describe('the stub audio player', () => {
  it('speaks a sequence in order, one line at a time', async () => {
    const player = createStubAudioPlayer();
    const started: AudioCueId[] = [];

    const done = player.speakSequence(INTRO, 550, id => started.push(id));

    // The first line begins immediately; the second must wait for it.
    await letTimePass(100);
    expect(started).toEqual(['color.red.this-is']);

    await letTimePass(5000);
    await done;
    expect(started).toEqual(INTRO);
  });

  it('abandons the rest of a sequence when stopped part-way', async () => {
    const player = createStubAudioPlayer();
    const started: AudioCueId[] = [];

    const done = player.speakSequence(INTRO, 550, id => started.push(id));

    // Interrupt during the first line, as leaving the screen mid-sentence
    // would. This is the regression this test exists for: `stopAll()` has to
    // resolve the line in flight, and a sequence that treats that as "line
    // finished" happily carries on into the next one — so the narration
    // follows the child out of the lesson.
    await letTimePass(300);
    player.stopAll();
    await letTimePass(5000);
    await done;

    expect(started).toEqual(['color.red.this-is']);
  });

  it('resolves a stopped line instead of leaving it hanging', async () => {
    const player = createStubAudioPlayer();

    // A cue long enough that it cannot have finished on its own.
    const longCue: AudioCueId = 'color.red.find-success';
    expect(audioCues[longCue].durationMs).toBeGreaterThan(1000);

    let resolved = false;
    const done = player.speak(longCue).then(() => {
      resolved = true;
    });

    await letTimePass(100);
    expect(resolved).toBe(false);

    // No time passes after this. If `stopAll()` merely cleared the timer, the
    // await would never continue and every caller up the stack — including the
    // lesson engine — would be stuck waiting forever.
    player.stopAll();
    await done;
    expect(resolved).toBe(true);
  });

  it('can start a fresh sequence after being stopped', async () => {
    const player = createStubAudioPlayer();
    const started: AudioCueId[] = [];

    const interrupted = player.speakSequence(INTRO, 550, id =>
      started.push(id),
    );
    await letTimePass(300);
    player.stopAll();
    await interrupted;

    // Stopping must not leave the player permanently muted — the next lesson
    // starts a moment later and has to narrate normally.
    const next = player.speakSequence(['shared.try-again'], 550, id =>
      started.push(id),
    );
    await letTimePass(2000);
    await next;

    expect(started).toEqual(['color.red.this-is', 'shared.try-again']);
  });
});
