import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Music } from "./supabase";

export type PlayerTrack = Pick<
  Music,
  | "id"
  | "title"
  | "artist"
  | "cover_image"
  | "audio_url"
  | "album"
  | "spotify_url"
  | "soundcloud_url"
  | "youtube_url"
>;

type PlayerState = {
  queue: PlayerTrack[];
  currentIndex: number;
  playing: boolean;
  progress: number;   // 0-1
  duration: number;   // seconds
  volume: number;     // 0-1
  loading: boolean;
};

type PlayerContext = PlayerState & {
  play: (track: PlayerTrack, queue?: PlayerTrack[]) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  stop: () => void;
  currentTrack: PlayerTrack | null;
  isTrackPlaying: (id: string) => boolean;
};

const PlayerCtx = createContext<PlayerContext | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<PlayerState>(() => {
    const savedVol = typeof window !== "undefined"
      ? parseFloat(localStorage.getItem("player_volume") ?? "0.8")
      : 0.8;
    return {
      queue: [],
      currentIndex: -1,
      playing: false,
      progress: 0,
      duration: 0,
      volume: isNaN(savedVol) ? 0.8 : Math.min(1, Math.max(0, savedVol)),
      loading: false,
    };
  });

  // Keep a ref to current state so callbacks don't go stale
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // Init audio element once
  useEffect(() => {
    const audio = new Audio();
    const savedVol = parseFloat(localStorage.getItem("player_volume") ?? "0.8");
    audio.volume = isNaN(savedVol) ? 0.8 : Math.min(1, Math.max(0, savedVol));
    audio.preload = "metadata";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setState((s) => ({
        ...s,
        progress: audio.duration ? audio.currentTime / audio.duration : 0,
        duration: audio.duration || 0,
      }));
    };
    const onEnded = () => {
      setState((s) => {
        if (s.currentIndex < s.queue.length - 1) {
          const next = s.currentIndex + 1;
          audio.src = s.queue[next].audio_url ?? "";
          audio.play().catch(() => {});
          return { ...s, currentIndex: next, playing: true, loading: true };
        }
        return { ...s, playing: false, progress: 0 };
      });
    };
    const onCanPlay = () => setState((s) => ({ ...s, loading: false }));
    const onWaiting = () => setState((s) => ({ ...s, loading: true }));
    const onError = () => setState((s) => ({ ...s, loading: false, playing: false }));

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("error", onError);
      audio.pause();
    };
  }, []);

  const play = useCallback((track: PlayerTrack, queue?: PlayerTrack[]) => {
    const audio = audioRef.current;
    if (!audio || !track.audio_url) return;

    const newQueue = queue ?? [track];
    const idx = newQueue.findIndex((t) => t.id === track.id);
    const resolvedIdx = idx >= 0 ? idx : 0;

    const current = stateRef.current;
    const isSameTrack = current.queue[current.currentIndex]?.id === track.id;

    if (isSameTrack) {
      // Same track — just resume from where it was, don't restart
      audio.play().catch(() => {});
      setState((s) => ({ ...s, playing: true }));
      return;
    }

    // Different track — load and play from start
    audio.src = track.audio_url;
    audio.play().catch(() => {});

    setState((s) => ({
      ...s,
      queue: newQueue,
      currentIndex: resolvedIdx,
      playing: true,
      loading: true,
      progress: 0,
    }));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setState((s) => ({ ...s, playing: false }));
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setState((s) => ({ ...s, playing: true }));
  }, []);

  const togglePlay = useCallback(() => {
    if (stateRef.current.playing) pause();
    else resume();
  }, [pause, resume]);

  const next = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setState((s) => {
      if (s.currentIndex >= s.queue.length - 1) return s;
      const idx = s.currentIndex + 1;
      const track = s.queue[idx];
      if (!track.audio_url) return s;
      audio.src = track.audio_url;
      audio.play().catch(() => {});
      return { ...s, currentIndex: idx, playing: true, loading: true, progress: 0 };
    });
  }, []);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // If > 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setState((s) => {
      if (s.currentIndex <= 0) return s;
      const idx = s.currentIndex - 1;
      const track = s.queue[idx];
      if (!track.audio_url) return s;
      audio.src = track.audio_url;
      audio.play().catch(() => {});
      return { ...s, currentIndex: idx, playing: true, loading: true, progress: 0 };
    });
  }, []);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = pct * audio.duration;
    setState((s) => ({ ...s, progress: pct }));
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    if (audioRef.current) audioRef.current.volume = clamped;
    try { localStorage.setItem("player_volume", String(clamped)); } catch {}
    setState((s) => ({ ...s, volume: clamped }));
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    setState((s) => ({
      queue: [],
      currentIndex: -1,
      playing: false,
      progress: 0,
      duration: 0,
      volume: s.volume,
      loading: false,
    }));
  }, []);

  const currentTrack =
    state.currentIndex >= 0 ? state.queue[state.currentIndex] ?? null : null;

  const isTrackPlaying = useCallback(
    (id: string) => state.playing && currentTrack?.id === id,
    [state.playing, currentTrack]
  );

  return (
    <PlayerCtx.Provider
      value={{
        ...state,
        play,
        pause,
        resume,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        stop,
        currentTrack,
        isTrackPlaying,
      }}
    >
      {children}
    </PlayerCtx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
