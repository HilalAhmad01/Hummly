'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Song,
  SearchableSong,
  MultiplayerRoom,
  SNIPPET_STAGES,
} from '@/types/game';
import { isGuessCorrect } from '@/lib/search-engine';
import { calculateStageScore, getStreakMultiplierText } from '@/lib/scoring';
import { soundFX } from '@/lib/sound-effects';
import { getOptimizedCoverUrl, preloadImage } from '@/lib/image-utils';
import AudioPlayer, { AudioPlayerHandle } from '@/components/game/AudioPlayer';
import SongSearchBar from '@/components/game/SongSearchBar';
import SnippetProgressTrack from '@/components/game/SnippetProgressTrack';
import {
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  Sparkles,
  Crown,
  Users,
  Trophy,
  Radio,
} from 'lucide-react';

interface MultiplayerArenaProps {
  room: MultiplayerRoom;
  currentUserId: string;
  onSubmitGuess: (stageIndex: number, isCorrect: boolean, scoreAwarded: number, guessTitle: string) => void;
  onAdvanceRound: () => void;
}

const STAGE_PILLS = [
  { id: 4, name: 'Easy', duration: '10.0s', color: 'text-[#34D399]', borderColor: 'border-[#34D399]/20' },
  { id: 3, name: 'Medium', duration: '5.0s', color: 'text-[#FBBF24]', borderColor: 'border-[#FBBF24]/20' },
  { id: 2, name: 'Hard', duration: '2.5s', color: 'text-[#F87171]', borderColor: 'border-[#F87171]/20' },
  { id: 1, name: 'Expert', duration: '0.8s', color: 'text-[#FB7185]', borderColor: 'border-[#FB7185]/20' },
  { id: 0, name: 'Impossible', duration: '0.2s', color: 'text-[#C084FC]', borderColor: 'border-[#C084FC]/20' },
];

export default function MultiplayerArena({
  room,
  currentUserId,
  onSubmitGuess,
  onAdvanceRound,
}: MultiplayerArenaProps) {
  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null);

  const currentSongIndex = room.currentRound - 1;
  const currentSong: Song | undefined = room.playlist[currentSongIndex];

  const currentPlayer = room.players.find((p) => p.userId === currentUserId);
  const isHost = room.hostId === currentUserId;

  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [currentAudioProgressTime, setCurrentAudioProgressTime] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isWrongAttemptFlash, setIsWrongAttemptFlash] = useState<boolean>(false);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current user has already guessed this round
  const myGuess = room.currentRoundGuesses[currentUserId];
  const hasUserGuessed = Boolean(myGuess);
  const isRevealing = room.status === 'revealing';

  // Count how many players finished
  const finishedCount = Object.keys(room.currentRoundGuesses).length;
  const totalPlayersCount = room.players.length;

  const onAdvanceRoundRef = useRef(onAdvanceRound);
  useEffect(() => {
    onAdvanceRoundRef.current = onAdvanceRound;
  });

  // Auto-advance countdown timer when revealing
  const [countdown, setCountdown] = useState<number>(6);
  useEffect(() => {
    if (!isRevealing) {
      setCountdown(6);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isHost) {
            onAdvanceRoundRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRevealing, isHost]);

  // Track previous round to ONLY reset stage when the round actually changes
  const prevRoundRef = useRef(room.currentRound);
  useEffect(() => {
    if (prevRoundRef.current !== room.currentRound) {
      prevRoundRef.current = room.currentRound;
      setCurrentStageIndex(0);
      setCurrentAudioProgressTime(0);
      setIsPlayingAudio(true);
    }
  }, [room.currentRound]);

  // Preload cover artwork in the background
  useEffect(() => {
    if (currentSong?.cover_url) {
      preloadImage(currentSong.cover_url);
    }
    const nextSong = room.playlist?.[room.currentRound];
    if (nextSong?.cover_url) {
      preloadImage(nextSong.cover_url);
    }
  }, [room.currentRound, currentSong?.id]);

  // Handle stage switch
  const handleSelectStage = useCallback((targetStageIndex: number) => {
    if (hasUserGuessed || isRevealing) return;
    soundFX.playSkip();
    setCurrentStageIndex(targetStageIndex);
  }, [hasUserGuessed, isRevealing]);

  // Handle User Guess Submission
  const handleSelectGuess = (guessedSong: SearchableSong) => {
    if (!currentSong || hasUserGuessed || isRevealing) return;

    const isCorrect = isGuessCorrect(guessedSong, currentSong.id, currentSong.title);
    const currentStreak = currentPlayer?.currentStreak || 0;

    if (isCorrect) {
      const newStreak = currentStreak + 1;
      const scoreCalc = calculateStageScore(currentStageIndex, newStreak);
      soundFX.playCorrect();
      onSubmitGuess(currentStageIndex, true, scoreCalc.finalScore, guessedSong.title);
    } else {
      soundFX.playWrong();
      setIsWrongAttemptFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setIsWrongAttemptFlash(false), 500);

      if (currentStageIndex < 4) {
        // Unlock next stage
        setCurrentStageIndex((prev) => prev + 1);
      } else {
        // Run out of attempts / reveal for user
        onSubmitGuess(currentStageIndex, false, 0, guessedSong.title);
      }
    }
  };

  // Handle Skip / Give up
  const handleSkip = () => {
    if (!currentSong || hasUserGuessed || isRevealing) return;
    soundFX.playSkip();

    if (currentStageIndex < 4) {
      setCurrentStageIndex((prev) => prev + 1);
    } else {
      onSubmitGuess(currentStageIndex, false, 0, 'Passed / Skipped');
    }
  };

  const getSkipButtonLabel = () => {
    if (currentStageIndex === 0) return 'Skip & Unlock 0.8s (Expert)';
    if (currentStageIndex === 1) return 'Skip & Unlock 2.5s (Hard)';
    if (currentStageIndex === 2) return 'Skip & Unlock 5.0s (Medium)';
    if (currentStageIndex === 3) return 'Skip & Unlock 10.0s (Easy)';
    return 'Give Up / Pass (+0 pts)';
  };

  const activeDurationSec = isRevealing
    ? 30.0
    : SNIPPET_STAGES[currentStageIndex]?.durationSec ?? 0.2;

  if (!currentSong) return null;

  return (
    <div className="w-full flex-1 max-w-5xl mx-auto px-4 py-4 flex flex-col items-center justify-between gap-4">
      {/* Top Header Status Bar */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-3xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-[#00E575]/10 border border-[#00E575]/20 text-[#00E575] font-mono font-bold text-xs flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>ROOM: {room.code}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span>Round</span>
            <span className="font-mono font-bold text-white">
              {room.currentRound} / {room.totalRounds}
            </span>
          </div>
        </div>

        {/* Live Leaderboard Strip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400 fill-current" />
            <span className="font-mono font-black text-xs text-amber-400">
              {getStreakMultiplierText(currentPlayer?.currentStreak || 0)}
            </span>
          </div>

          <div className="font-mono font-black text-sm text-[#00E575] bg-[#18231E] px-3 py-1 rounded-full border border-white/5">
            {(currentPlayer?.totalScore || 0).toLocaleString()}{' '}
            <span className="text-[10px] text-slate-400 font-sans">pts</span>
          </div>
        </div>
      </div>

      {/* Friends Live Round Progress Bar (Showing all 5 players) */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 px-2">
          <Users className="w-3.5 h-3.5 text-[#00E575]" />
          <span>Round Status:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {room.players.map((p) => {
            const guess = room.currentRoundGuesses[p.userId];
            const isYou = p.userId === currentUserId;

            return (
              <div
                key={p.userId}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                  guess
                    ? guess.isCorrect
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                    : isYou
                    ? 'bg-[#18231E] border-[#00E575]/40 text-slate-200'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-[10px] text-white overflow-hidden shrink-0">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    p.username.charAt(0).toUpperCase()
                  )}
                </div>

                <span className="font-bold truncate max-w-[80px]">
                  {isYou ? 'You' : p.username}
                </span>

                {guess ? (
                  guess.isCorrect ? (
                    <span className="font-mono text-[10px] text-[#00E575] font-black">
                      +{guess.scoreAwarded}
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-400 font-bold">+0</span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                    <Clock className="w-3 h-3 animate-spin" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-[11px] font-mono text-slate-400 px-2 font-bold">
          {finishedCount}/{totalPlayersCount} Locked In
        </div>
      </div>

      {/* Main Game Interface or Reveal Mode */}
      {isRevealing ? (
        /* Synchronous Round Reveal Card */
        <div className="w-full max-w-xl bg-[#111714] border border-[#00E575]/40 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_40px_rgba(0,229,117,0.15)] my-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00E575]/10 text-[#00E575] text-xs font-bold uppercase tracking-wider mb-4 border border-[#00E575]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Round {room.currentRound} Results</span>
          </div>

          {/* Song Cover & Details */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-4 bg-slate-900 flex items-center justify-center">
            {getOptimizedCoverUrl(currentSong.cover_url) ? (
              <img
                src={getOptimizedCoverUrl(currentSong.cover_url)!}
                alt={currentSong.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="font-black text-2xl text-[#00E575]">
                {currentSong.title.charAt(0)}
              </div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
            {currentSong.title}
          </h2>
          <p className="text-sm text-slate-400 font-medium mb-6">
            {currentSong.artist} • <span className="text-slate-300">{currentSong.movie_or_album}</span>
          </p>

          {/* Full Audio Playback */}
          <div className="w-full max-w-sm mb-6">
            <AudioPlayer
              ref={audioPlayerRef}
              song={currentSong}
              maxPlayTimeSec={30.0}
              autoPlay={true}
              onAudioProgress={setCurrentAudioProgressTime}
              onPlayStateChange={setIsPlayingAudio}
              onError={() => {}}
            />
          </div>

          {/* Player Round Results Table */}
          <div className="w-full bg-[#060A08] rounded-2xl p-3 sm:p-4 border border-white/5 mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 text-left">
              Player Standings
            </span>

            <div className="divide-y divide-white/5">
              {room.players
                .slice()
                .sort((a, b) => b.totalScore - a.totalScore)
                .map((p, idx) => {
                  const guess = room.currentRoundGuesses[p.userId];
                  const isYou = p.userId === currentUserId;

                  return (
                    <div key={p.userId} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-slate-500 w-4">{idx + 1}.</span>
                        <span className={`font-bold ${isYou ? 'text-[#00E575]' : 'text-white'}`}>
                          {p.username} {isYou && '(You)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        {guess?.isCorrect ? (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            +{guess.scoreAwarded}
                          </span>
                        ) : (
                          <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            +0
                          </span>
                        )}

                        <span className="font-mono font-black text-white text-sm w-16 text-right">
                          {p.totalScore.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Advance Button & Countdown */}
          <div className="w-full flex flex-col items-center gap-2">
            {isHost ? (
              <button
                onClick={onAdvanceRound}
                className="w-full h-12 rounded-full bg-[#00E575] hover:bg-[#00F77F] text-[#060A08] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,117,0.3)] transition-all cursor-pointer"
              >
                <span>{room.currentRound === room.totalRounds ? 'View Final Podium 🏆' : `Next Round (${countdown}s)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs text-slate-400 font-medium">
                Advancing in <strong className="text-white">{countdown}s</strong> or when host clicks Next...
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Active Guessing Interface */
        <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center gap-4 my-auto">
          {/* Difficulty Pills */}
          <div className="w-full flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-2 w-full">
              {[STAGE_PILLS[0], STAGE_PILLS[1], STAGE_PILLS[2]].map((pill) => {
                const isActive = currentStageIndex === pill.id;
                return (
                  <button
                    key={pill.name}
                    type="button"
                    onClick={() => handleSelectStage(pill.id)}
                    disabled={hasUserGuessed}
                    className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all select-none border cursor-pointer hover:scale-105 active:scale-95 ${
                      isActive
                        ? 'bg-[#00E575] text-[#060A08] shadow-[0_0_20px_rgba(0,229,117,0.45)] border-[#00E575]'
                        : `bg-[#131B17] ${pill.color} hover:bg-[#1C2721] border-white/5`
                    }`}
                  >
                    <span>{pill.name}</span>
                    <span className="text-[10px] opacity-75 ml-1">({pill.duration})</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-2 w-full">
              {[STAGE_PILLS[3], STAGE_PILLS[4]].map((pill) => {
                const isActive = currentStageIndex === pill.id;
                return (
                  <button
                    key={pill.name}
                    type="button"
                    onClick={() => handleSelectStage(pill.id)}
                    disabled={hasUserGuessed}
                    className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all select-none border cursor-pointer hover:scale-105 active:scale-95 ${
                      isActive
                        ? 'bg-[#00E575] text-[#060A08] shadow-[0_0_20px_rgba(0,229,117,0.45)] border-[#00E575]'
                        : `bg-[#131B17] ${pill.color} hover:bg-[#1C2721] border-white/5`
                    }`}
                  >
                    <span>{pill.name}</span>
                    <span className="text-[10px] opacity-75 ml-1">({pill.duration})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Snippet Progress Bar */}
          <div className="w-full my-1">
            <SnippetProgressTrack
              currentStageIndex={currentStageIndex}
              currentTimeSec={currentAudioProgressTime}
              isPlaying={isPlayingAudio}
              onSelectStage={handleSelectStage}
              disabled={hasUserGuessed}
            />
          </div>

          {/* Audio Player */}
          <div className="w-full flex items-center justify-center my-2">
            <AudioPlayer
              ref={audioPlayerRef}
              song={currentSong}
              maxPlayTimeSec={activeDurationSec}
              autoPlay={true}
              onAudioProgress={setCurrentAudioProgressTime}
              onPlayStateChange={setIsPlayingAudio}
              onError={handleSkip}
            />
          </div>

          {/* Waiting Locked-in Status OR Search Bar */}
          {hasUserGuessed ? (
            <div className="w-full bg-[#111714] border border-[#00E575]/30 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_0_25px_rgba(0,229,117,0.1)] animate-pulse">
              <div className="w-12 h-12 rounded-full bg-[#00E575]/10 border border-[#00E575]/30 flex items-center justify-center text-[#00E575] mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Guess Locked In!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-3">
                Waiting for remaining friends ({finishedCount}/{totalPlayersCount} finished). The round will reveal automatically once everyone has guessed!
              </p>

              {isHost && finishedCount < totalPlayersCount && (
                <button
                  type="button"
                  onClick={() => {
                    onSubmitGuess(currentStageIndex, false, 0, 'Host Forced Reveal');
                  }}
                  className="mt-2 text-[11px] font-bold text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
                >
                  Host: Skip waiting &amp; reveal answers now
                </button>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-3">
              {/* Search Bar */}
              <div className="w-full">
                <SongSearchBar
                  onSelectGuess={handleSelectGuess}
                  onSkipRound={handleSkip}
                  skipButtonLabel={getSkipButtonLabel()}
                  disabled={hasUserGuessed}
                  isWrongAttemptFlash={isWrongAttemptFlash}
                  roundNumber={room.currentRound}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
