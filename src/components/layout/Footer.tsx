import React from 'react';
import Link from 'next/link';
import { Heart, Music2, ShieldCheck, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 bg-[#05080F]/90 mt-auto py-8 px-4 sm:px-6 pb-20 md:pb-8 text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        {/* Brand & Mission */}
        <div className="flex flex-col gap-1.5 items-center md:items-start">
          <div className="flex items-center gap-2">
            <Music2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200 text-sm">SwaraGuess</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Bollywood Edition
            </span>
          </div>
          <p className="max-w-md text-slate-400 text-xs">
            A free, non-commercial trivia game testing your knowledge of iconic Hindi cinema songs across all eras.
          </p>
        </div>

        {/* Compliant Attributions */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Official 30s previews via Apple Music & Deezer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Video clips via YouTube IFrame</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        <p className="text-slate-400">
          &copy; {new Date().getFullYear()} SwaraGuess. Created for Bollywood music lovers everywhere.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/play" className="text-emerald-400 hover:text-emerald-300 transition-colors">
            Quick Play
          </Link>
          <Link href="/leaderboard" className="text-slate-400 hover:text-slate-300 transition-colors">
            Leaderboards
          </Link>
          <Link href="/profile" className="text-slate-400 hover:text-slate-300 transition-colors">
            Stats
          </Link>
        </div>
      </div>
    </footer>
  );
}
