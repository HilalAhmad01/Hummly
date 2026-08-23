'use client';

import React, { useEffect, useRef } from 'react';
import { Timer, Zap } from 'lucide-react';
import { soundFX } from '@/lib/sound-effects';

interface TimerBarProps {
  timeRemainingSec: number;
  totalTimeSec?: number;
  isActive: boolean;
  onTimeExpire?: () => void;
  potentialPoints?: number;
}

export default function TimerBar({
  timeRemainingSec,
  totalTimeSec = 15,
  isActive,
  potentialPoints = 1000,
}: TimerBarProps) {
  const lastSecondRef = useRef<number>(Math.ceil(timeRemainingSec));

  // Play countdown ticks when time is under 4 seconds
  useEffect(() => {
    if (!isActive) return;
    const currentSec = Math.ceil(timeRemainingSec);
    if (currentSec !== lastSecondRef.current) {
      if (currentSec <= 3 && currentSec > 0) {
        soundFX.playTick();
      }
      lastSecondRef.current = currentSec;
    }
  }, [timeRemainingSec, isActive]);

  const percentage = Math.max(0, Math.min(100, (timeRemainingSec / totalTimeSec) * 100));

  // Determine urgency color
  const getColorClass = () => {
    if (timeRemainingSec > 7) {
      return {
        bar: 'from-emerald-500 to-teal-400',
        glow: 'shadow-emerald-500/30',
        text: 'text-emerald-400',
        badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      };
    }
    if (timeRemainingSec > 3) {
      return {
        bar: 'from-amber-500 to-yellow-400',
        glow: 'shadow-amber-500/30',
        text: 'text-amber-400',
        badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      };
    }
    return {
      bar: 'from-rose-500 to-red-600 animate-pulse',
      glow: 'shadow-rose-500/50',
      text: 'text-rose-400 animate-pulse',
      badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    };
  };

  const colors = getColorClass();

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-semibold px-1">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Timer className={`w-4 h-4 ${colors.text}`} />
          <span>Time Remaining</span>
          <span className={`font-mono text-sm font-bold ${colors.text}`}>
            {timeRemainingSec.toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] ${colors.badge}`}>
            <Zap className="w-3 h-3 fill-current" />
            <span>+{potentialPoints} max pts</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2.5 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-white/5 relative">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors.bar} shadow-lg ${colors.glow} transition-all duration-100 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
