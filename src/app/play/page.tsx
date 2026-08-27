'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Flame, Trophy, HelpCircle } from 'lucide-react';
import {
  Song,
  SearchableSong,
  BollywoodEra,
  GameRoundState,
  GameSessionSummary,
  RoundAttempt,
  SNIPPET_STAGES,
} from '@/types/game';
import { CURATED_BOLLYWOOD_SONGS } from '@/lib/mock-data';
import { isGuessCorrect } from '@/lib/search-engine';
import { calculateStageScore, getStreakMultiplierText } from '@/lib/scoring';
import { soundFX } from '@/lib/sound-effects';
import { preloadImage } from '@/lib/image-utils';

import AudioPlayer, { AudioPlayerHandle } from '@/components/game/AudioPlayer';
import SnippetProgressTrack from '@/components/game/SnippetProgressTrack';
import SongSearchBar from '@/components/game/SongSearchBar';
import RoundReveal from '@/components/game/RoundReveal';
import SessionSummary from '@/components/game/SessionSummary';
import StreakBadge from '@/components/game/StreakBadge';

const TOTAL_ROUNDS = 10;

// Unbiased Fisher-Yates (Knuth) Shuffle Algorithm for true uniform random song selection
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Stage Pill Config matching Reference UI Colors & Durations
const STAGE_PILLS = [
  { id: 4, name: 'Easy', duration: '10.0s', color: 'text-[#34D399]', borderColor: 'border-[#34D399]/20' },
  { id: 3, name: 'Medium', duration: '5.0s', color: 'text-[#FBBF24]', borderColor: 'border-[#FBBF24]/20' },
  { id: 2, name: 'Hard', duration: '2.5s', color: 'text-[#F87171]', borderColor: 'border-[#F87171]/20' },
  { id: 1, name: 'Expert', duration: '0.8s', color: 'text-[#FB7185]', borderColor: 'border-[#FB7185]/20' },
  { id: 0, name: 'Impossible', duration: '0.2s', color: 'text-[#C084FC]', borderColor: 'border-[#C084FC]/20' },
];

function PlayGameContent() {
  const searchParams = useSearchParams();
  const eraParam = (searchParams.get('era') as BollywoodEra) || 'all';

  const audioPlayerRef = useRef<AudioPlayerHandle | null>(null);

  const [era, setEra] = useState<BollywoodEra>(eraParam);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [roundState, setRoundState] = useState<GameRoundState | null>(null);
  const [roundsHistory, setRoundsHistory] = useState<GameRoundState[]>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [summary, setSummary] = useState<GameSessionSummary | null>(null);

  const [currentAudioProgressTime, setCurrentAudioProgressTime] = useState<number>(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isWrongAttemptFlash, setIsWrongAttemptFlash] = useState<boolean>(false);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Global Keyboard Shortcuts (Space for Play/Pause, Esc for Blur)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.getAttribute('contenteditable') === 'true');

      if (e.code === 'Space') {
        if (!isTyping) {
          e.preventDefault();
          audioPlayerRef.current?.togglePlay();
        }
      } else if (e.code === 'Escape') {
        if (isTyping) {
          (activeEl as HTMLElement).blur();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  // Filter songs based on Era
  const getFilteredSongs = useCallback((targetEra: BollywoodEra): Song[] => {
    let pool = CURATED_BOLLYWOOD_SONGS.filter(
      (s) => s.is_active !== false && !!s.deezer_preview_url && s.deezer_preview_url.startsWith('http')
    );

    if (targetEra === '2020s') {
      pool = pool.filter((s) => s.era === '2020s');
    } else if (targetEra === '2010s') {
      pool = pool.filter((s) => s.era === '2010s');
    } else if (targetEra === '2000s') {
      pool = pool.filter((s) => s.era === '2000s');
    } else if (targetEra === '90s') {
      pool = pool.filter((s) => s.era === '90s');
    } else if (targetEra === 'party') {
      pool = pool.filter((s) => s.theme === 'party');
    } else if (targetEra === 'romance') {
      pool = pool.filter((s) => s.theme === 'romantic');
    }

    const shuffled = fisherYatesShuffle(pool);
    return shuffled.slice(0, TOTAL_ROUNDS);
  }, []);

  // Initialize or restart game
  const initGame = useCallback(
    (chosenEra: BollywoodEra) => {
      const songs = getFilteredSongs(chosenEra);
      setEra(chosenEra);
      setPlaylist(songs);
      setCurrentRoundIndex(0);
      setRoundsHistory([]);
      setCurrentStreak(0);
      setMaxStreak(0);
      setTotalScore(0);
      setIsGameOver(false);
      setSummary(null);
      setCurrentAudioProgressTime(0);

      if (songs.length > 0) {
        const initialRound: GameRoundState = {
          roundNumber: 1,
          song: songs[0],
          status: 'playing',
          currentStageIndex: 0,
          attempts: [],
          selectedSong: null,
          isCorrect: false,
          scoreAwarded: 0,
          streakAtRound: 0,
        };
        setRoundState(initialRound);
        setIsPlayingAudio(true);
      }
    },
    [getFilteredSongs]
  );

  useEffect(() => {
    initGame(eraParam);
  }, [eraParam, initGame]);

  // Preload album artwork in the background while player is listening
  useEffect(() => {
    if (playlist.length === 0) return;
    const currentSong = playlist[currentRoundIndex];
    if (currentSong?.cover_url) {
      preloadImage(currentSong.cover_url);
    }
    const nextSong = playlist[currentRoundIndex + 1];
    if (nextSong?.cover_url) {
      preloadImage(nextSong.cover_url);
    }
  }, [currentRoundIndex, playlist]);

  // Handle Switching / Unlocking Stage Directly via Pill or Timeline Click
  const handleSelectStage = useCallback((targetStageIndex: number) => {
    if (!roundState || roundState.status !== 'playing') return;
    // Anti-exploit check: Cannot go back to previous/shorter difficulty once a longer snippet is unlocked
    if (targetStageIndex <= roundState.currentStageIndex) return;

    soundFX.playSkip();
    setRoundState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        currentStageIndex: targetStageIndex,
      };
    });
  }, [roundState]);

  // Handle User Guess Submission
  const handleSelectGuess = (guessedSong: SearchableSong) => {
    if (!roundState || roundState.status !== 'playing') return;

    const isCorrect = isGuessCorrect(guessedSong, roundState.song.id, roundState.song.title);
    const stageIdx = roundState.currentStageIndex;

    const newAttempt: RoundAttempt = {
      stageNumber: stageIdx + 1,
      guessTitle: guessedSong.title,
      guessArtist: guessedSong.artist,
      guessMovie: guessedSong.movie_or_album,
      isCorrect,
    };

    const updatedAttempts = [...roundState.attempts, newAttempt];

    if (isCorrect) {
      // Correct Guess!
      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setMaxStreak((prev) => Math.max(prev, newStreak));

      const scoreCalc = calculateStageScore(stageIdx, newStreak);
      const roundScore = scoreCalc.finalScore;

      setTotalScore((prev) => prev + roundScore);

      if (newStreak >= 3) {
        soundFX.playStreak(newStreak);
      } else {
        soundFX.playCorrect();
      }

      const updatedRound: GameRoundState = {
        ...roundState,
        status: 'revealed',
        attempts: updatedAttempts,
        selectedSong: guessedSong,
        isCorrect: true,
        scoreAwarded: roundScore,
        streakAtRound: newStreak,
      };

      setRoundState(updatedRound);
    } else {
      // Wrong Guess!
      soundFX.playWrong();
      setIsWrongAttemptFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setIsWrongAttemptFlash(false), 500);

      if (stageIdx < 4) {
        const nextStage = stageIdx + 1;
        setRoundState({
          ...roundState,
          currentStageIndex: nextStage,
          attempts: updatedAttempts,
        });
      } else {
        setCurrentStreak(0);

        const updatedRound: GameRoundState = {
          ...roundState,
          status: 'revealed',
          attempts: updatedAttempts,
          selectedSong: guessedSong,
          isCorrect: false,
          scoreAwarded: 0,
          streakAtRound: 0,
        };

        setRoundState(updatedRound);
      }
    }
  };

  // Handle Skip / Unlock Next Stage
  const handleSkipOrUnlockNext = useCallback(() => {
    if (!roundState || roundState.status !== 'playing') return;

    soundFX.playSkip();
    const stageIdx = roundState.currentStageIndex;

    if (stageIdx < 4) {
      const nextStage = stageIdx + 1;
      setRoundState({
        ...roundState,
        currentStageIndex: nextStage,
      });
    } else {
      setCurrentStreak(0);
      setRoundState({
        ...roundState,
        status: 'skipped',
        isCorrect: false,
        scoreAwarded: 0,
        streakAtRound: 0,
      });
    }
  }, [roundState]);

  // Compute Skip Button Label dynamically based on current unlocked stage
  const getSkipButtonLabel = () => {
    if (!roundState) return 'Skip';
    const stageIdx = roundState.currentStageIndex;
    if (stageIdx === 0) return 'Skip & Unlock 0.8s (Expert)';
    if (stageIdx === 1) return 'Skip & Unlock 2.5s (Hard)';
    if (stageIdx === 2) return 'Skip & Unlock 5.0s (Medium)';
    if (stageIdx === 3) return 'Skip & Unlock 10.0s (Easy)';
    return 'Give Up & Reveal Song (+0 pts)';
  };

  // Advance to next round or finish session
  const handleNextRound = useCallback(() => {
    if (!roundState) return;

    const nextHistory = [...roundsHistory, roundState];
    setRoundsHistory(nextHistory);

    const nextIndex = currentRoundIndex + 1;

    if (nextIndex >= playlist.length || nextIndex >= TOTAL_ROUNDS) {
      const correctCount = nextHistory.filter((r) => r.isCorrect).length;

      const sessionSummary: GameSessionSummary = {
        mode: 'quick_play',
        eraFilter: era,
        totalScore,
        correctCount,
        totalRounds: nextHistory.length,
        maxStreak,
        rounds: nextHistory,
        completedAt: new Date().toISOString(),
      };

      setSummary(sessionSummary);
      setIsGameOver(true);
      setIsPlayingAudio(false);
    } else {
      const nextSong = playlist[nextIndex];
      setCurrentRoundIndex(nextIndex);
      setCurrentAudioProgressTime(0);
      setRoundState({
        roundNumber: nextIndex + 1,
        song: nextSong,
        status: 'playing',
        currentStageIndex: 0,
        attempts: [],
        selectedSong: null,
        isCorrect: false,
        scoreAwarded: 0,
        streakAtRound: currentStreak,
      });
      setIsPlayingAudio(false);
    }
  }, [roundState, roundsHistory, currentRoundIndex, playlist, era, totalScore, maxStreak, currentStreak]);

  // Fail-safe skip
  const handleAudioError = useCallback(() => {
    console.warn('Audio stream error, advancing stage.');
    handleSkipOrUnlockNext();
  }, [handleSkipOrUnlockNext]);

  // Active duration snippet limit
  const activeDurationSec =
    roundState?.status === 'revealed'
      ? 30.0
      : SNIPPET_STAGES[roundState?.currentStageIndex ?? 0]?.durationSec ?? 0.2;

  return (
    <div className="w-full flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-between">
      {/* Top Mobile/Tablet Bar */}
      <div className="w-full flex items-center justify-between mb-4 lg:hidden">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </Link>

        {!isGameOver && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Round
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#00E575]/10 text-[#00E575] border border-[#00E575]/20 font-mono font-bold text-xs">
              {currentRoundIndex + 1} / {TOTAL_ROUNDS}
            </span>
          </div>
        )}

        {!isGameOver && (
          <div className="flex items-center gap-2">
            <StreakBadge streak={currentStreak} />
            <div className="text-sm font-black font-mono text-[#00E575]">
              {totalScore} <span className="text-[10px] text-slate-400 font-sans">pts</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Responsive Grid Layout */}
      {!isGameOver && roundState && (
        <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start my-auto">
          {/* Left Desktop Sidebar */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
            {/* Category & Round Card */}
            <div className="bg-[#111714] border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Current Session
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E575]/10 text-[#00E575] uppercase border border-[#00E575]/20">
                  {era}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-sm font-bold text-white">Round Progress</span>
                <span className="font-mono font-black text-base text-[#00E575]">
                  {currentRoundIndex + 1} <span className="text-slate-500 text-xs">/ {TOTAL_ROUNDS}</span>
                </span>
              </div>

              <div className="w-full h-1.5 bg-[#18231E] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00E575] transition-all duration-300"
                  style={{ width: `${((currentRoundIndex + 1) / TOTAL_ROUNDS) * 100}%` }}
                />
              </div>
            </div>

            {/* Score & Streak Card */}
            <div className="bg-[#111714] border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Score
                </span>
                <span className="font-mono font-black text-2xl text-white">
                  {totalScore.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400 fill-current" />
                  <span className="text-xs font-bold text-slate-300">Streak Multiplier</span>
                </div>
                <span className="font-mono font-black text-sm text-amber-400">
                  {getStreakMultiplierText(currentStreak)}
                </span>
              </div>
            </div>

            {/* Pro Tip Card */}
            <div className="bg-[#111714] border border-white/5 rounded-3xl p-5 flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#00E575] font-bold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Snippet Length Tip:</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Click any unlocked difficulty pill (<strong className="text-[#C084FC]">0.2s</strong>, <strong className="text-[#FB7185]">0.8s</strong>, <strong className="text-[#F87171]">2.5s</strong>, <strong className="text-[#FBBF24]">5.0s</strong>, <strong className="text-[#34D399]">10.0s</strong>) to jump forward to that duration. Shorter difficulties are locked once a longer snippet is unlocked.
              </p>
            </div>
          </div>

          {/* Center Main Arena */}
          <div className="lg:col-span-6 flex flex-col justify-between items-center w-full max-w-md sm:max-w-lg mx-auto py-2">
            {/* Top Difficulty Pills (Interactive with Direct Duration Switching) */}
            <div className="w-full flex flex-col items-center gap-2 mb-2">
              <div className="flex items-center justify-center gap-2 w-full">
                {[STAGE_PILLS[0], STAGE_PILLS[1], STAGE_PILLS[2]].map((pill) => {
                  const isActive = roundState.currentStageIndex === pill.id;
                  const isPast = pill.id < roundState.currentStageIndex;
                  return (
                    <button
                      key={pill.name}
                      type="button"
                      onClick={() => handleSelectStage(pill.id)}
                      disabled={isPast || isActive}
                      className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all select-none border ${
                        isActive
                          ? 'bg-[#00E575] text-[#060A08] shadow-[0_0_20px_rgba(0,229,117,0.45)] border-[#00E575] cursor-default'
                          : isPast
                          ? 'bg-[#0A0E0C] text-slate-600 border-white/5 opacity-40 cursor-not-allowed'
                          : `bg-[#131B17] ${pill.color} hover:bg-[#1C2721] border-white/5 cursor-pointer hover:scale-105 active:scale-95`
                      }`}
                      title={
                        isPast
                          ? `Locked: Already unlocked longer snippet`
                          : isActive
                          ? `Current: ${pill.name} (${pill.duration})`
                          : `Switch snippet to ${pill.name} (${pill.duration})`
                      }
                    >
                      <span>{pill.name}</span>
                      <span className="text-[10px] opacity-75 ml-1">({pill.duration})</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-2 w-full">
                {[STAGE_PILLS[3], STAGE_PILLS[4]].map((pill) => {
                  const isActive = roundState.currentStageIndex === pill.id;
                  const isPast = pill.id < roundState.currentStageIndex;
                  return (
                    <button
                      key={pill.name}
                      type="button"
                      onClick={() => handleSelectStage(pill.id)}
                      disabled={isPast || isActive}
                      className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm transition-all select-none border ${
                        isActive
                          ? 'bg-[#00E575] text-[#060A08] shadow-[0_0_20px_rgba(0,229,117,0.45)] border-[#00E575] cursor-default'
                          : isPast
                          ? 'bg-[#0A0E0C] text-slate-600 border-white/5 opacity-40 cursor-not-allowed'
                          : `bg-[#131B17] ${pill.color} hover:bg-[#1C2721] border-white/5 cursor-pointer hover:scale-105 active:scale-95`
                      }`}
                      title={
                        isPast
                          ? `Locked: Already unlocked longer snippet`
                          : isActive
                          ? `Current: ${pill.name} (${pill.duration})`
                          : `Switch snippet to ${pill.name} (${pill.duration})`
                      }
                    >
                      <span>{pill.name}</span>
                      <span className="text-[10px] opacity-75 ml-1">({pill.duration})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Segmented Timeline Progress Bar (Clickable) */}
            <SnippetProgressTrack
              currentStageIndex={roundState.currentStageIndex}
              currentTimeSec={currentAudioProgressTime}
              isPlaying={isPlayingAudio}
              onSelectStage={handleSelectStage}
            />

            {/* Center Giant Play Button & Equalizer */}
            {roundState.status === 'playing' ? (
              <div className="my-auto w-full flex flex-col items-center justify-center">
                <AudioPlayer
                  ref={audioPlayerRef}
                  song={roundState.song}
                  maxPlayTimeSec={activeDurationSec}
                  onPlayStateChange={setIsPlayingAudio}
                  onAudioProgress={setCurrentAudioProgressTime}
                  onError={handleAudioError}
                  autoPlay={false}
                  disabled={roundState.status !== 'playing'}
                />
              </div>
            ) : (
              /* Round Revealed State */
              <div className="my-auto w-full">
                <RoundReveal
                  roundState={roundState}
                  onNextRound={handleNextRound}
                  isLastRound={currentRoundIndex + 1 >= TOTAL_ROUNDS}
                />
              </div>
            )}

            {/* Bottom Controls: Search & Skip */}
            {roundState.status === 'playing' && (
              <div className="w-full mt-auto pt-4">
                <SongSearchBar
                  onSelectGuess={handleSelectGuess}
                  onSkipRound={handleSkipOrUnlockNext}
                  skipButtonLabel={getSkipButtonLabel()}
                  isWrongAttemptFlash={isWrongAttemptFlash}
                  roundNumber={roundState.roundNumber}
                />
              </div>
            )}
          </div>

          {/* Right Desktop Sidebar */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4">
            {/* Live Rounds Tracker */}
            <div className="bg-[#111714] border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rounds History
                </span>
                <span className="text-xs font-mono font-bold text-[#00E575]">
                  {roundsHistory.filter((r) => r.isCorrect).length} Won
                </span>
              </div>

              <div className="divide-y divide-white/5 max-h-52 overflow-y-auto pr-1">
                {Array.from({ length: TOTAL_ROUNDS }).map((_, idx) => {
                  const pastRound = roundsHistory[idx];
                  const isCurrent = idx === currentRoundIndex && roundState.status === 'playing';

                  return (
                    <div
                      key={idx}
                      className={`py-2 px-2 flex items-center justify-between text-xs rounded-xl transition-all ${
                        isCurrent ? 'bg-[#18231E] border border-[#00E575]/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          isCurrent
                            ? 'bg-[#00E575] text-[#060A08]'
                            : pastRound?.isCorrect
                            ? 'bg-[#00E575]/20 text-[#00E575]'
                            : pastRound
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-[#18231E] text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>

                        <span className="truncate max-w-[120px] font-medium text-slate-300">
                          {pastRound ? pastRound.song.title : isCurrent ? 'Playing Now...' : `Round ${idx + 1}`}
                        </span>
                      </div>

                      {pastRound && (
                        <span className={`font-mono font-bold text-[11px] ${
                          pastRound.isCorrect ? 'text-[#00E575]' : 'text-slate-500'
                        }`}>
                          +{pastRound.scoreAwarded}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keyboard Controls Cheatsheet */}
            <div className="bg-[#111714] border border-white/5 rounded-3xl p-5 flex flex-col gap-2.5 text-xs text-slate-400">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Keyboard Shortcuts
              </span>

              <div className="flex items-center justify-between">
                <span>Play / Pause Snippet</span>
                <kbd className="px-2 py-0.5 rounded bg-[#18231E] border border-white/10 text-white font-mono text-[10px]">
                  Space
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <span>Navigate Suggestions</span>
                <kbd className="px-2 py-0.5 rounded bg-[#18231E] border border-white/10 text-white font-mono text-[10px]">
                  &uarr; &darr;
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <span>Select & Guess</span>
                <kbd className="px-2 py-0.5 rounded bg-[#18231E] border border-white/10 text-white font-mono text-[10px]">
                  Enter
                </kbd>
              </div>

              <div className="flex items-center justify-between">
                <span>Close / Unfocus</span>
                <kbd className="px-2 py-0.5 rounded bg-[#18231E] border border-white/10 text-white font-mono text-[10px]">
                  Esc
                </kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary View (10 Rounds Finished) */}
      {isGameOver && summary && (
        <SessionSummary
          summary={summary}
          onPlayAgain={() => initGame(era)}
          onSelectEra={(newEra) => initGame(newEra)}
        />
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center">
          <div className="p-6 rounded-3xl flex flex-col items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-[#00E575]/20 text-[#00E575] flex items-center justify-center animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-400">Loading Hummly...</span>
          </div>
        </div>
      }
    >
      <PlayGameContent />
    </Suspense>
  );
}
