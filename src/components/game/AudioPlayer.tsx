'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  memo,
} from 'react';
import { Play, AlertCircle } from 'lucide-react';
import { Song } from '@/types/game';

export interface AudioPlayerHandle {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  seekToStart: () => void;
}

interface AudioPlayerProps {
  song: Song;
  maxPlayTimeSec: number;
  autoPlay?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onAudioProgress?: (currentTimeSec: number) => void;
  onError?: (err: Error) => void;
  disabled?: boolean;
}

const AudioPlayerComponent = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  (
    {
      song,
      maxPlayTimeSec,
      autoPlay = false,
      onPlayStateChange,
      onAudioProgress,
      onError,
      disabled = false,
    },
    ref
  ) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [loadError, setLoadError] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);

    const animFrameRef = useRef<number | null>(null);
    const maxPlayTimeSecRef = useRef<number>(maxPlayTimeSec);
    maxPlayTimeSecRef.current = maxPlayTimeSec;

    const disabledRef = useRef(disabled);
    disabledRef.current = disabled;

    const onPlayStateChangeRef = useRef(onPlayStateChange);
    onPlayStateChangeRef.current = onPlayStateChange;
    const onAudioProgressRef = useRef(onAudioProgress);
    onAudioProgressRef.current = onAudioProgress;
    const onErrorRef = useRef(onError);
    onErrorRef.current = onError;

    const previewUrl = song.deezer_preview_url;

    // Stop tracking animation loop
    const stopTrackingLoop = useCallback(() => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }, []);

    // Precision tracking loop using requestAnimationFrame
    const startTrackingLoop = useCallback(() => {
      stopTrackingLoop();

      const updateProgress = () => {
        const audio = audioRef.current;
        if (!audio) return;

        const limit = maxPlayTimeSecRef.current;
        const currentAudioTime = audio.currentTime;

        setCurrentTime(currentAudioTime);
        onAudioProgressRef.current?.(currentAudioTime);

        // Cutoff precisely when snippet limit is reached
        if (currentAudioTime >= limit) {
          audio.pause();
          try {
            audio.currentTime = 0;
          } catch {}
          setIsPlaying(false);
          setCurrentTime(0);
          onPlayStateChangeRef.current?.(false);
          onAudioProgressRef.current?.(0);
          stopTrackingLoop();
          return;
        }

        if (!audio.paused && !audio.ended) {
          animFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          setIsPlaying(false);
          onPlayStateChangeRef.current?.(false);
        }
      };

      animFrameRef.current = requestAnimationFrame(updateProgress);
    }, [stopTrackingLoop]);

    // Resilient Pause
    const safePause = useCallback(() => {
      stopTrackingLoop();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
      }
      setIsPlaying(false);
      onPlayStateChangeRef.current?.(false);
    }, [stopTrackingLoop]);

    // Resilient Play
    const safePlay = useCallback(() => {
      const audio = audioRef.current;
      if (!audio || disabledRef.current) return;

      if (!previewUrl) {
        setLoadError(true);
        console.warn('No audio preview URL for track:', song.title);
        onErrorRef.current?.(new Error('No preview URL available'));
        return;
      }

      setLoadError(false);

      const limit = maxPlayTimeSecRef.current;

      // Rewind to start if near or past snippet duration limit
      if (audio.currentTime >= limit - 0.05 || audio.ended) {
        try {
          audio.currentTime = 0;
        } catch {}
      }

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            onPlayStateChangeRef.current?.(true);
            startTrackingLoop();
          })
          .catch((err: unknown) => {
            if (err instanceof Error) {
              if (err.name === 'NotAllowedError') {
                console.warn('Browser autoplay prevented. User tap required.');
              } else if (err.name === 'AbortError') {
                // Interrupted by rapid user toggle
              } else {
                console.warn('Audio play error:', err);
              }
            }
            setIsPlaying(false);
            onPlayStateChangeRef.current?.(false);
          });
      } else {
        setIsPlaying(true);
        onPlayStateChangeRef.current?.(true);
        startTrackingLoop();
      }
    }, [previewUrl, song.title, startTrackingLoop]);

    // Toggle Play/Pause on button click or spacebar
    const togglePlay = useCallback(() => {
      if (disabledRef.current) return;
      const audio = audioRef.current;
      if (!audio) return;

      if (audio.paused || audio.ended) {
        safePlay();
      } else {
        safePause();
      }
    }, [safePlay, safePause]);

    const seekToStart = useCallback(() => {
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.currentTime = 0;
        } catch {}
        setCurrentTime(0);
        onAudioProgressRef.current?.(0);
      }
    }, []);

    // Expose handles via ref
    useImperativeHandle(
      ref,
      () => ({
        togglePlay,
        play: safePlay,
        pause: safePause,
        seekToStart,
      }),
      [togglePlay, safePlay, safePause, seekToStart]
    );

    // When song changes: load new source and reset state cleanly
    useEffect(() => {
      setIsPlaying(false);
      setLoadError(false);
      setCurrentTime(0);
      stopTrackingLoop();

      const audio = audioRef.current;
      if (audio && previewUrl) {
        try {
          audio.currentTime = 0;
        } catch {}
        audio.load();

        if (autoPlay && !disabledRef.current) {
          safePlay();
        }
      }

      return () => {
        stopTrackingLoop();
        if (audio) {
          audio.pause();
        }
      };
    }, [song.id, previewUrl, autoPlay, safePlay, stopTrackingLoop]);

    // When max duration changes (stage unlocked or switched by user):
    useEffect(() => {
      maxPlayTimeSecRef.current = maxPlayTimeSec;
      const audio = audioRef.current;
      if (audio) {
        try {
          audio.currentTime = 0;
        } catch {}
        setCurrentTime(0);
        onAudioProgressRef.current?.(0);
      }
    }, [maxPlayTimeSec]);

    return (
      <div className="w-full flex flex-col items-center justify-center my-6 relative select-none">
        {/* Native HTML5 Audio Element with Direct CDN Stream */}
        {previewUrl && (
          <audio
            ref={audioRef}
            src={previewUrl}
            preload="auto"
            playsInline
            onPlaying={() => {
              setIsPlaying(true);
              onPlayStateChangeRef.current?.(true);
              startTrackingLoop();
            }}
            onPause={() => {
              setIsPlaying(false);
              onPlayStateChangeRef.current?.(false);
              stopTrackingLoop();
            }}
            onEnded={() => {
              setIsPlaying(false);
              onPlayStateChangeRef.current?.(false);
              stopTrackingLoop();
            }}
            onError={(e) => {
              console.warn('Audio element error on track:', song.title, e);
              setLoadError(true);
              onErrorRef.current?.(new Error('Audio stream error'));
            }}
          />
        )}

        {/* Central Play/Pause Circle with Right-Side Timer */}
        <div className="relative flex items-center justify-center">
          {/* Giant Glowing Green Play/Pause Circle */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={disabled}
            aria-label={isPlaying ? 'Pause snippet' : 'Play snippet'}
            className={`relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:bg-[#00D06A] text-[#060A08] flex items-center justify-center shadow-[0_0_60px_rgba(0,229,117,0.45)] hover:shadow-[0_0_80px_rgba(0,229,117,0.65)] hover:scale-[1.03] active:scale-[0.96] transition-all cursor-pointer disabled:opacity-50 ${
              isPlaying ? 'ring-4 ring-[#00E575]/40 shadow-[0_0_90px_rgba(0,229,117,0.7)]' : ''
            }`}
          >
            {isPlaying ? (
              /* Pause Icon (Two thick vertical bars) */
              <div className="flex gap-2.5 items-center justify-center">
                <div className="w-3.5 h-10 bg-[#060A08] rounded-sm" />
                <div className="w-3.5 h-10 bg-[#060A08] rounded-sm" />
              </div>
            ) : loadError ? (
              <AlertCircle className="w-10 h-10 text-rose-950" />
            ) : (
              /* Play Icon (Right-pointing triangle) */
              <div className="w-0 h-0 border-y-[18px] border-y-transparent border-l-[30px] border-l-[#060A08] ml-2" />
            )}
          </button>

          {/* Right-Side Glowing Duration Label */}
          <div className="absolute left-[calc(100%+24px)] text-[#00E575] font-mono text-lg sm:text-xl font-bold tracking-tight select-none whitespace-nowrap">
            {maxPlayTimeSec.toFixed(1)}s
          </div>
        </div>

        {/* 5-Bar Minimal Audio Equalizer (Directly Below Circle in Reference UI) */}
        <div className="flex items-center justify-center gap-1.5 h-8 mt-6">
          {[40, 75, 100, 60, 85].map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-200 ${
                isPlaying ? 'bg-[#00E575] shadow-[0_0_8px_rgba(0,229,117,0.6)]' : 'bg-[#15221B]'
              }`}
              style={{
                height: isPlaying ? `${height}%` : '25%',
                animationName: isPlaying ? 'wave' : 'none',
                animationDuration: '0.8s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);

AudioPlayerComponent.displayName = 'AudioPlayer';

export default memo(AudioPlayerComponent);
