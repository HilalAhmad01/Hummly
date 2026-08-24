'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  Medal,
  RotateCcw,
  Home,
  Sparkles,
  Flame,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { MultiplayerRoom, RoomPlayer } from '@/types/game';
import { soundFX } from '@/lib/sound-effects';

interface MultiplayerPodiumProps {
  room: MultiplayerRoom;
  currentUserId: string;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export default function MultiplayerPodium({
  room,
  currentUserId,
  onPlayAgain,
  onLeaveRoom,
}: MultiplayerPodiumProps) {
  // Sort players by totalScore descending
  const sortedPlayers: RoomPlayer[] = [...room.players].sort(
    (a, b) => b.totalScore - a.totalScore
  );

  const firstPlace = sortedPlayers[0];
  const secondPlace = sortedPlayers[1];
  const thirdPlace = sortedPlayers[2];
  const fourthPlace = sortedPlayers[3];
  const fifthPlace = sortedPlayers[4];

  const isHost = room.hostId === currentUserId;

  useEffect(() => {
    soundFX.playStreak(5);

    // Fire celebratory confetti cannon
    const end = Date.now() + 3 * 1000;
    const colors = ['#00E575', '#FFD700', '#C0C0C0', '#CD7F32', '#FFFFFF'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center gap-8">
      {/* Header Banner */}
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00E575]/10 border border-[#00E575]/30 text-[#00E575] font-bold text-xs uppercase tracking-widest mb-3 shadow-[0_0_20px_rgba(0,229,117,0.2)]">
          <Trophy className="w-4 h-4" />
          <span>Match Complete • 10 Rounds</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Victory Podium
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Congratulations to the champion and all challengers!
        </p>
      </div>

      {/* 3D Olympic-Style Podium for Top 3 */}
      <div className="w-full max-w-2xl flex items-end justify-center gap-3 sm:gap-6 pt-12 pb-2">
        {/* 2nd Place (Silver) */}
        {secondPlace ? (
          <div className="flex-1 flex flex-col items-center">
            {/* Player Avatar & Info */}
            <div className="flex flex-col items-center mb-3 text-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1A2320] border-2 border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.25)] flex items-center justify-center font-black text-lg text-white mb-2 overflow-hidden">
                {secondPlace.avatarUrl ? (
                  <img src={secondPlace.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  secondPlace.username.charAt(0).toUpperCase()
                )}
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-bold text-xs shadow">
                  🥈
                </div>
              </div>

              <span className="text-sm sm:text-base font-bold text-white truncate max-w-[100px]">
                {secondPlace.username}
              </span>
              <span className="text-xs font-mono font-black text-slate-300">
                {secondPlace.totalScore.toLocaleString()} pts
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {secondPlace.correctCount}/10 correct
              </span>
            </div>

            {/* Podium Column (Silver) */}
            <div className="w-full h-36 sm:h-44 rounded-t-3xl bg-gradient-to-b from-slate-400/20 via-slate-600/10 to-transparent border-t-2 border-x-2 border-slate-400/40 flex flex-col items-center justify-start pt-4 shadow-lg">
              <span className="font-mono font-black text-3xl sm:text-4xl text-slate-300">
                2
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                Silver
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* 1st Place (Gold Champion) */}
        {firstPlace && (
          <div className="flex-1 flex flex-col items-center -mt-6">
            {/* Crown & Avatar */}
            <div className="flex flex-col items-center mb-3 text-center relative">
              <div className="text-amber-400 mb-1 animate-bounce">
                <Crown className="w-8 h-8 fill-current drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
              </div>

              <div className="relative w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-[#1F2B1F] border-3 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] flex items-center justify-center font-black text-2xl text-white mb-2 overflow-hidden">
                {firstPlace.avatarUrl ? (
                  <img src={firstPlace.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  firstPlace.username.charAt(0).toUpperCase()
                )}
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black text-sm shadow">
                  🥇
                </div>
              </div>

              <span className="text-base sm:text-lg font-black text-amber-300 truncate max-w-[120px]">
                {firstPlace.username}
              </span>
              <span className="text-sm font-mono font-black text-white">
                {firstPlace.totalScore.toLocaleString()} pts
              </span>
              <span className="text-[11px] text-amber-400/80 font-bold mt-0.5">
                👑 {firstPlace.correctCount}/10 correct
              </span>
            </div>

            {/* Podium Column (Gold) */}
            <div className="w-full h-48 sm:h-56 rounded-t-3xl bg-gradient-to-b from-amber-500/25 via-amber-700/10 to-transparent border-t-2 border-x-2 border-amber-400/60 flex flex-col items-center justify-start pt-4 shadow-[0_0_40px_rgba(251,191,36,0.15)]">
              <span className="font-mono font-black text-4xl sm:text-5xl text-amber-400">
                1
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mt-1">
                Gold Champion
              </span>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {thirdPlace ? (
          <div className="flex-1 flex flex-col items-center">
            {/* Player Avatar & Info */}
            <div className="flex flex-col items-center mb-3 text-center">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#1F1916] border-2 border-amber-700/80 shadow-[0_0_20px_rgba(180,83,9,0.25)] flex items-center justify-center font-black text-lg text-white mb-2 overflow-hidden">
                {thirdPlace.avatarUrl ? (
                  <img src={thirdPlace.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  thirdPlace.username.charAt(0).toUpperCase()
                )}
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-bold text-xs shadow">
                  🥉
                </div>
              </div>

              <span className="text-sm sm:text-base font-bold text-white truncate max-w-[100px]">
                {thirdPlace.username}
              </span>
              <span className="text-xs font-mono font-black text-amber-600">
                {thirdPlace.totalScore.toLocaleString()} pts
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {thirdPlace.correctCount}/10 correct
              </span>
            </div>

            {/* Podium Column (Bronze) */}
            <div className="w-full h-28 sm:h-36 rounded-t-3xl bg-gradient-to-b from-amber-800/25 via-amber-950/10 to-transparent border-t-2 border-x-2 border-amber-700/50 flex flex-col items-center justify-start pt-4 shadow-lg">
              <span className="font-mono font-black text-3xl sm:text-4xl text-amber-600">
                3
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mt-1">
                Bronze
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* 4th and 5th Place Cards (If applicable) */}
      {(fourthPlace || fifthPlace) && (
        <div className="w-full max-w-xl bg-[#111714] border border-white/5 rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Runners Up
          </span>

          <div className="flex flex-col gap-2">
            {fourthPlace && (
              <div className="p-3 rounded-2xl bg-[#16201B] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-500 w-5 text-center">4th</span>
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-white overflow-hidden">
                    {fourthPlace.avatarUrl ? (
                      <img src={fourthPlace.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      fourthPlace.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {fourthPlace.username}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {fourthPlace.correctCount}/10 correct
                    </span>
                  </div>
                </div>

                <span className="font-mono font-black text-white text-sm">
                  {fourthPlace.totalScore.toLocaleString()} pts
                </span>
              </div>
            )}

            {fifthPlace && (
              <div className="p-3 rounded-2xl bg-[#16201B] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-500 w-5 text-center">5th</span>
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-white overflow-hidden">
                    {fifthPlace.avatarUrl ? (
                      <img src={fifthPlace.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      fifthPlace.username.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">
                      {fifthPlace.username}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {fifthPlace.correctCount}/10 correct
                    </span>
                  </div>
                </div>

                <span className="font-mono font-black text-white text-sm">
                  {fifthPlace.totalScore.toLocaleString()} pts
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action CTA Buttons */}
      <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3">
        {isHost ? (
          <button
            onClick={onPlayAgain}
            className="w-full h-14 rounded-full bg-[#00E575] hover:bg-[#00F77F] text-[#060A08] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,117,0.35)] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Again (Same Room)</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 text-center py-2">
            Waiting for host to restart match or start a new game.
          </div>
        )}

        <button
          onClick={onLeaveRoom}
          className="w-full h-14 rounded-full bg-[#16201B] hover:bg-[#1C2721] border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Exit to Main Menu</span>
        </button>
      </div>
    </div>
  );
}
