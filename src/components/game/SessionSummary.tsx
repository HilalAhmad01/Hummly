'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Home } from 'lucide-react';
import { GameSessionSummary, BollywoodEra } from '@/types/game';
import { soundFX } from '@/lib/sound-effects';
import { createClient } from '@/lib/supabase/client';

interface SessionSummaryProps {
  summary: GameSessionSummary;
  onPlayAgain: () => void;
  onSelectEra: (era: BollywoodEra) => void;
}

export default function SessionSummary({
  summary,
  onPlayAgain,
  onSelectEra,
}: SessionSummaryProps) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00E575', '#34D399', '#FBBF24', '#C084FC'],
      });
      soundFX.playCorrect();
    } catch {}

    // Save session
    const saveSession = async () => {
      const supabase = createClient();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          try {
            await (supabase.from('game_sessions') as any).insert({
              user_id: user.id,
              mode: summary.mode,
              era_filter: summary.eraFilter,
              score: summary.totalScore,
              correct_count: summary.correctCount,
              total_rounds: summary.totalRounds,
            });

            await (supabase as any).rpc('increment_profile_score', {
              row_id: user.id,
              score_to_add: summary.totalScore,
            });
          } catch {}
        }
      }

      try {
        const historyStr = localStorage.getItem('swaraguess_history') || '[]';
        const parsed = JSON.parse(historyStr);
        const history = Array.isArray(parsed) ? parsed : [];
        history.unshift(summary);
        localStorage.setItem('swaraguess_history', JSON.stringify(history.slice(0, 20)));
      } catch {}

      setIsSaved(true);
    };

    saveSession();
  }, [summary]);

  const accuracyPct = Math.round((summary.correctCount / summary.totalRounds) * 100);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Score Card */}
      <div className="w-full bg-[#111714] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-[#00E575]">
          Session Complete
        </span>

        <div className="my-4 flex flex-col items-center">
          <div className="text-5xl font-black text-white font-mono tracking-tight">
            {summary.totalScore.toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Total Score
          </span>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2.5 w-full mt-2">
          <div className="bg-[#16201B] border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[#00E575] font-black text-lg">
              {summary.correctCount}/{summary.totalRounds}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {accuracyPct}% Correct
            </span>
          </div>

          <div className="bg-[#16201B] border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-amber-400 font-black text-lg">
              {summary.maxStreak}x
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Best Streak
            </span>
          </div>

          <div className="bg-[#16201B] border border-white/5 rounded-2xl p-3 flex flex-col items-center">
            <span className="text-[#C084FC] font-black text-lg">
              {summary.rounds.filter((r) => r.isCorrect && r.currentStageIndex === 0).length}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              0.2s Solves
            </span>
          </div>
        </div>
      </div>

      {/* Round Breakdown List */}
      <div className="w-full bg-[#111714] border border-white/10 rounded-3xl p-4 flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
          Rounds Recap
        </div>

        <div className="divide-y divide-white/5 max-h-52 overflow-y-auto pr-1">
          {summary.rounds.map((round) => {
            const stageNames = ['Impossible (0.2s)', 'Expert (0.8s)', 'Hard (2.5s)', 'Medium (5.0s)', 'Easy (10.0s)'];
            const stageLabel = stageNames[round.currentStageIndex] || 'Easy (10.0s)';

            return (
              <div
                key={round.roundNumber}
                className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white truncate">{round.song.title}</div>
                  <div className="text-slate-400 truncate text-[11px]">
                    {round.song.movie_or_album} &bull; {round.song.artist}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div
                    className={`font-mono font-bold ${
                      round.isCorrect ? 'text-[#00E575]' : 'text-slate-400'
                    }`}
                  >
                    +{round.scoreAwarded}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {round.isCorrect ? stageLabel : 'Missed'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons (Full Pill) */}
      <div className="flex flex-col gap-2.5">
        <button
          onClick={onPlayAgain}
          className="w-full h-14 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:bg-[#00D06A] text-[#060A08] font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,117,0.3)] transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Again</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            href="/leaderboard"
            className="flex-1 h-12 rounded-full bg-[#16201B] hover:bg-[#1C2923] border border-white/10 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-[#00E575]" />
            <span>Leaderboard</span>
          </Link>

          <Link
            href="/"
            className="h-12 px-6 rounded-full bg-[#16201B] hover:bg-[#1C2923] border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
