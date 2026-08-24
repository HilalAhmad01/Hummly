'use client';

import React, { useEffect, useState } from 'react';
import { Film, User, Music, ArrowRight } from 'lucide-react';
import { GameRoundState } from '@/types/game';
import { getOptimizedCoverUrl } from '@/lib/image-utils';

interface RoundRevealProps {
  roundState: GameRoundState;
  onNextRound: () => void;
  isLastRound?: boolean;
}

function RoundReveal({
  roundState,
  onNextRound,
  isLastRound = false,
}: RoundRevealProps) {
  const [countdown, setCountdown] = useState<number>(3);
  const [imgError, setImgError] = useState(false);
  const song = roundState.song;
  const isCorrect = roundState.isCorrect;
  const optimizedCover = getOptimizedCoverUrl(song.cover_url);

  // Reset img error on round change
  useEffect(() => {
    setImgError(false);
  }, [song.id]);

  // Auto-advance after 3.5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      onNextRound();
    }, 3500);

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [onNextRound]);

  return (
    <div className="w-full bg-[#111714] border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200">
      {/* Result Status Banner */}
      <div className="mb-4">
        {isCorrect ? (
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#00E575]/20 border border-[#00E575]/40 text-[#00E575] font-black text-sm">
            <span>Correct! +{roundState.scoreAwarded} pts</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-sm">
            <span>
              {roundState.status === 'skipped' ? 'Skipped Round' : 'Out of Attempts'} (+0 pts)
            </span>
          </div>
        )}
      </div>

      {/* Album Artwork & Movie Details */}
      <div className="flex flex-col sm:flex-row items-center gap-4 my-2 max-w-sm w-full text-left">
        {/* Cover Art */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-xl border border-white/10 flex-shrink-0 bg-[#080D0A] flex items-center justify-center">
          {optimizedCover && !imgError ? (
            <img
              src={optimizedCover}
              alt={song.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              onError={() => setImgError(true)}
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#00E575] p-2 text-center">
              <Music className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {song.era}
              </span>
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex flex-col justify-center min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug truncate">
            {song.title}
          </h3>

          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-semibold mt-1">
            <Film className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">{song.movie_or_album || 'Single'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
            <User className="w-3 h-3 text-teal-400 flex-shrink-0" />
            <span className="truncate">{song.artist}</span>
          </div>
        </div>
      </div>

      {/* Advance Next Button */}
      <div className="mt-5 w-full">
        <button
          onClick={onNextRound}
          className="w-full h-12 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:bg-[#00D06A] text-[#060A08] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,117,0.3)] transition-all cursor-pointer"
        >
          <span>{isLastRound ? 'View Final Results' : 'Next Song'}</span>
          <span className="text-xs opacity-75">({countdown}s)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default React.memo(RoundReveal);
