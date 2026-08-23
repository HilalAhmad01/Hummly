'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, LogOut, User } from 'lucide-react';
import { GameSessionSummary } from '@/types/game';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [history, setHistory] = useState<GameSessionSummary[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);

  useEffect(() => {
    // Check Supabase Auth
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user || null);
      });
    }

    // Load Local History with Defensive Validation
    try {
      const stored = localStorage.getItem('swaraguess_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validHistory = parsed.filter(
            (item) => item && typeof item === 'object' && typeof item.totalScore === 'number'
          ) as GameSessionSummary[];

          setHistory(validHistory);

          const sumScore = validHistory.reduce((acc, curr) => acc + (Number(curr.totalScore) || 0), 0);
          const bestStreak = validHistory.reduce((acc, curr) => Math.max(acc, Number(curr.maxStreak) || 0), 0);

          setTotalScore(sumScore);
          setTotalGames(validHistory.length);
          setMaxStreak(bestStreak);
        }
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
    }
  };

  const username = user?.email ? user.email.split('@')[0] : 'HummlyGuest';

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        {user ? (
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#16201B] text-rose-400 hover:text-rose-300 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full bg-[#00E575] text-[#060A08] font-bold text-xs shadow-sm"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* User Card */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-3xl p-5 flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[#18231E] border border-[#00E575]/30 flex items-center justify-center text-lg font-black text-[#00E575]">
          {username.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black text-white truncate">
            {username}
          </h2>
          <span className="text-xs text-slate-400">
            {user?.email || 'Guest Player (Stats saved on device)'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-full mb-6">
        <div className="bg-[#111714] border border-white/5 rounded-2xl p-4 flex flex-col items-center">
          <span className="text-xl font-mono font-black text-white">
            {totalScore.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Total Score
          </span>
        </div>

        <div className="bg-[#111714] border border-white/5 rounded-2xl p-4 flex flex-col items-center">
          <span className="text-xl font-mono font-black text-[#00E575]">
            {totalGames}
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Games Played
          </span>
        </div>

        <div className="bg-[#111714] border border-white/5 rounded-2xl p-4 flex flex-col items-center">
          <span className="text-xl font-mono font-black text-amber-400">
            {maxStreak}x
          </span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
            Best Streak
          </span>
        </div>
      </div>

      {/* Quick Play CTA (Full Pill) */}
      <Link
        href="/play"
        className="w-full h-14 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:bg-[#00D06A] text-[#060A08] font-bold text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,117,0.3)] transition-all cursor-pointer mb-6"
      >
        <Play className="w-4 h-4 fill-current ml-0.5" />
        <span>Play Next Game</span>
      </Link>

      {/* Recent Sessions */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
          Recent Sessions
        </div>

        {history.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No games played yet. Tap &ldquo;Play Next Game&rdquo; to start!
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-56 overflow-y-auto pr-1">
            {history.slice(0, 10).map((session, idx) => (
              <div
                key={idx}
                className="py-2.5 px-2 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white uppercase text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/5 mr-2">
                    {session.eraFilter}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {session.correctCount}/{session.totalRounds} correct
                  </span>
                </div>

                <span className="font-mono font-bold text-[#00E575]">
                  +{session.totalScore.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
