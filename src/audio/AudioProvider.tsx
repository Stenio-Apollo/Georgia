import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { createAudioPlayer } from './player';
import type { AudioPlayer } from './types';

/**
 * Makes one shared audio player available to the whole app.
 *
 * This uses React Context. If context is new to you: it is a way to hand a
 * value to every component underneath without passing it through each one as a
 * prop. We want exactly one player for the app — two players could talk over
 * each other — so we create it here at the top and let screens reach for it.
 */

const AudioPlayerContext = createContext<AudioPlayer | null>(null);

interface AudioProviderProps {
  children: React.ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  // `useMemo` with an empty dependency array means "build this once and keep
  // it". Without it we would create a brand new player on every re-render.
  const player = useMemo(() => createAudioPlayer(), []);

  // Stop any audio if the whole app unmounts.
  useEffect(() => {
    return () => player.stopAll();
  }, [player]);

  return (
    <AudioPlayerContext.Provider value={player}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

/**
 * How components get the player: `const audio = useAudioPlayer();`
 *
 * The thrown error is a deliberate developer safety net. If you ever forget to
 * wrap the app in <AudioProvider>, you get a clear message instead of a
 * confusing "cannot read property speak of null" later on.
 */
export function useAudioPlayer(): AudioPlayer {
  const player = useContext(AudioPlayerContext);
  if (!player) {
    throw new Error('useAudioPlayer() must be called inside <AudioProvider>.');
  }
  return player;
}
