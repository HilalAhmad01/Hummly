'use client';

import React from 'react';
import { X, Check, Disc3 } from 'lucide-react';
import { RoundAttempt } from '@/types/game';

interface AttemptsBadgeProps {
  attempts: RoundAttempt[];
  maxAttempts?: number;
}

export default function AttemptsBadge({ attempts, maxAttempts = 3 }: AttemptsBadgeProps) {
  const remainingTries = Math.max(0, maxAttempts - attempts.length);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: maxAttempts }).map((_, index) => {
          const attempt = attempts[index];
          if (!attempt) {
            // Unused attempt
            return (
              <div
                key={index}
                className="w-5 h-5 rounded-full border border-slate-700 bg-slate-900/60 flex items-center justify-center text-slate-400"
                title={`Attempt ${index + 1} (Available)`}
              >
                <Disc3 className="w-3 h-3 opacity-40" />
              </div>
            );
          }

          if (attempt.isCorrect) {
            // Correct attempt
            return (
              <div
                key={index}
                className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-emerald-500/30 animate-bounce"
                title="Correct Guess!"
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            );
          }

          // Wrong attempt
          return (
            <div
              key={index}
              className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-sm"
              title={`Attempt ${index + 1}: Wrong (${attempt.guessTitle})`}
            >
              <X className="w-3 h-3 stroke-[3]" />
            </div>
          );
        })}
      </div>
      <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
        {remainingTries > 0 ? `${remainingTries} tries left` : 'Last attempt!'}
      </span>
    </div>
  );
}
