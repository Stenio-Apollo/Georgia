# Audio files

This folder is where recorded audio goes. **It is currently empty**, and the app
runs fine without it — `src/audio/player.ts` ships a stub that simulates
playback using the `durationMs` value of each cue, so the pacing of a lesson is
already correct before any recording exists.

## Where files go

One file per entry in `src/audio/cues.ts`, named exactly as the `file` field
says. There are 134 spoken cues plus two sound effects — 136 files — so rather
than list every one here, the naming is mechanical: **take the cue id and
replace the dots with dashes.**

    color.red.this-is      ->  color-red-this-is.m4a
    number.seven.complete  ->  number-seven-complete.m4a
    animal.dog.find-prompt ->  animal-dog-find-prompt.m4a

### The seven lines every concept needs

Each of the nineteen concepts — six colours, ten numbers, three animals — has
the same seven slots. Substitute the concept's spoken name into each:

| Slot | Words spoken |
|---|---|
| `this-is` | "This is **red**." |
| `name` | "**Red**." |
| `touch-prompt` | "Can you touch **red**?" |
| `touch-success` | "Yes. **Red**." |
| `find-prompt` | "Can you find **red**?" |
| `find-success` | "Yes. That's **red**." |
| `complete` | "You found **red**." |

### Animals are worded differently

An animal needs an article, so the three animal concepts use a second set of
templates. **Read these exactly as written** — "Can you find dog?" is not
English, and a child hearing the app speak is hearing language whether or not
that is the lesson.

| Slot | Words spoken |
|---|---|
| `this-is` | "This is **a dog**." |
| `name` | "**Dog**." |
| `touch-prompt` | "Can you touch **the dog**?" |
| `touch-success` | "Yes. **A dog**." |
| `find-prompt` | "Can you find **the dog**?" |
| `find-success` | "Yes. That's **the dog**." |
| `complete` | "You found **the dog**." |

Note "a" when the animal is being introduced and "the" once it is on screen and
being pointed at. That is how a person would say it.

The concept prefixes are `color.` + `red` / `blue` / `yellow` / `green` /
`orange` / `purple`, `number.` + `one` … `ten`, and `animal.` + `dog` / `cat` /
`bird`. The exact text and filename for any cue is in `src/audio/cues.ts`; the
quickest way to see the whole list is to log it:

```sh
npx tsx -e "import {audioCues} from './src/audio/cues'; \
  Object.values(audioCues).forEach(c => console.log(c.file, '|', c.text))"
```

Numbers use the same seven templates as colours — "This is three.", "Can you
touch three?", "You found three." all read correctly, which is why colours and
numbers share one set and only the animals needed their own.

### Plus three shared files

| File | Words spoken |
|---|---|
| `shared-try-again.m4a` | "Try again." |
| `sfx-confirm.m4a` | soft single tone, correct touch |
| `sfx-neutral.m4a` | very soft neutral tone, wrong tap |

Only these three are shared. Everything else is per concept, deliberately: a
single recording of "Yes. That's…" reused with the colour spliced on would have
an audible seam, and a child hears that long before an adult does.

## Recording notes

- **Warm, slow, quiet.** Read as if the child is sitting next to you, not as a
  presenter. Leave the excitement out — the app's whole premise is calm.
- **Leading/trailing silence trimmed to near zero.** The app inserts its own
  pauses (`pause.beat`, `pause.observe` in `src/animation/constants.ts`).
  Silence baked into a file fights those values and makes pacing unpredictable.
- **Consistent loudness** across files, around -16 LUFS. A line that jumps in
  volume is startling.
- **`sfx-neutral` must not sound like a buzzer or an error.** A wrong answer is
  emotionally neutral in this app. If the sound implies "wrong", cut it
  entirely — silence is better than a negative signal.
- Format: `.m4a` (AAC), mono, 44.1kHz is plenty.

## After adding files: update `durationMs`

The stub's timings are estimates. Once you have real files, set each cue's
`durationMs` in `src/audio/cues.ts` to the real length. Even with a real player
these values stay useful — the engine uses them to decide how long to hold a
visual before advancing.

Most cues get their duration from `estimateDuration()`, a straight line fitted
to the seven RED values that were set by hand and checked on a device. RED
itself passes those measured values in as overrides, so it is the reference the
others are guessed from. As you record each concept, pass its real durations the
same way RED does — `durationMs` in the `conceptCues(...)` call — and the
estimate stops being used for that concept.

## Swapping in a real player

Change **one function**, `createAudioPlayer()` at the bottom of
`src/audio/player.ts`:

```ts
export function createAudioPlayer(): AudioPlayer {
  return createRealAudioPlayer(); // your implementation
}
```

Your implementation must satisfy the `AudioPlayer` interface in
`src/audio/types.ts`. Two rules that matter:

1. `speak()` must resolve **when the line finishes**, not when it starts. The
   lesson engine awaits it to decide when to continue.
2. `stopAll()` must **resolve** any promise currently being awaited, not leave
   it hanging — otherwise an `await` in the engine never continues. The stub
   shows the pattern.

Library options when you get there (none are installed yet):

- `react-native-audio-api` — Software Mansion, Web Audio-style, precise timing.
- `expo-audio` — good API, but pulls `expo-modules-core` into this bare app.
- `react-native-sound` — simplest, but poorly maintained; check its New
  Architecture support first, since this app has the New Architecture enabled.

## Text-to-speech as a stepping stone

If you want to hear *something* before recording a real voice, a TTS library is
a reasonable intermediate step — every cue already carries its `text`, so a TTS
player can read that field directly. Recorded human narration is the goal
though; synthetic voices are noticeably worse at sounding warm.
