'use client';

import React from 'react';
import { Flame, Sparkles } from 'lucide-react';
import { getStreakMultiplier } from '@/lib/scoring';

interface StreakBadgeProps {
  streak: number;
}

export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak <= 0) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-semibold">
        <Flame className="w-3.5 h-3.5 text-slate-400" />
        <span>Streak: 0</span>
      </div>
    );
  }

  const multiplier = getStreakMultiplier(streak);

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-md transition-all duration-300 ${
          streak >= 3
            ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/20 animate-pulse'
            : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 shadow-emerald-500/10'
        }`}
      >
        <Flame
          className={`w-4 h-4 ${
            streak >= 3 ? 'text-amber-400 fill-amber-400 animate-bounce' : 'text-emerald-400 fill-emerald-400'
          }`}
        />
        <span className="text-xs font-extrabold tracking-wide">
          {streak} {streak === 1 ? 'Correct' : 'Streak'}
        </span>

        {multiplier > 1.0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-black text-amber-400 border border-amber-400/30">
            {multiplier.toFixed(1)}x
          </span>
        )}
      </div>
    </div>
  );
}
