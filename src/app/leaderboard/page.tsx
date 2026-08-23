'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play } from 'lucide-react';
import { LeaderboardEntry } from '@/types/game';
import { createClient } from '@/lib/supabase/client';

const INITIAL_MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { userId: 'u1', username: 'ArijitFan99', totalScore: 28450, gamesPlayed: 32, highScore: 9850, rank: 1 },
  { userId: 'u2', username: 'BollywoodBuff', totalScore: 24120, gamesPlayed: 28, highScore: 9400, rank: 2 },
  { userId: 'u3', username: 'RetroKing_Sanu', totalScore: 21900, gamesPlayed: 25, highScore: 9150, rank: 3 },
  { userId: 'u4', username: 'PritamMagic', totalScore: 18700, gamesPlayed: 22, highScore: 8900, rank: 4 },
  { userId: 'u5', username: 'ShreyaMelody', totalScore: 16400, gamesPlayed: 19, highScore: 8750, rank: 5 },
  { userId: 'u6', username: 'YJHD_Lover', totalScore: 14200, gamesPlayed: 16, highScore: 8500, rank: 6 },
  { userId: 'u7', username: 'KK_Forever', totalScore: 12800, gamesPlayed: 15, highScore: 8300, rank: 7 },
  { userId: 'u8', username: 'DesiBeatRider', totalScore: 10500, gamesPlayed: 12, highScore: 7900, rank: 8 },
];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'all_time' | 'weekly'>('all_time');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_MOCK_LEADERBOARD);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true);
      const supabase = createClient();

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leaderboard_view')
            .select('*')
            .limit(20);

          if (data && Array.isArray(data) && data.length > 0 && !error) {
            const mapped: LeaderboardEntry[] = (data as any[]).map((row, index) => ({
              userId: row.user_id || `u-${index}`,
              username: row.username || `Player ${index + 1}`,
              avatarUrl: row.avatar_url || undefined,
              totalScore: Number(row.total_score) || 0,
              gamesPlayed: Number(row.games_played) || 0,
              highScore: Number(row.high_score) || 0,
              rank: index + 1,
            }));
            setLeaderboard(mapped);
          }
        } catch {}
      }
      setIsLoading(false);
    }

    fetchLeaderboard();
  }, [tab]);

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/play"
          className="px-4 py-1.5 rounded-full bg-[#00E575] text-[#060A08] font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,229,117,0.3)] transition-all"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Play Hummly</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="flex flex-col items-center text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Leaderboard
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Top Hummly players ranked by score and speed
        </p>

        {/* Tab Toggle (Full Pill) */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[#121915] border border-white/5 mt-4">
          <button
            onClick={() => setTab('all_time')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === 'all_time'
                ? 'bg-[#00E575] text-[#060A08] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTab('weekly')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              tab === 'weekly'
                ? 'bg-[#00E575] text-[#060A08] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Top 3 Podium (Sleek Clean Minimal) */}
      <div className="grid grid-cols-3 gap-2 w-full mb-6 items-end">
        {/* 2nd */}
        {leaderboard[1] && (
          <div className="bg-[#111714] border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="w-7 h-7 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs mb-1.5">
              #2
            </span>
            <span className="font-bold text-white text-xs truncate max-w-[80px]">
              {leaderboard[1].username}
            </span>
            <span className="text-[#00E575] font-mono text-[11px] font-bold mt-0.5">
              {leaderboard[1].totalScore.toLocaleString()}
            </span>
          </div>
        )}

        {/* 1st */}
        {leaderboard[0] && (
          <div className="bg-[#16201B] border border-[#00E575]/30 rounded-2xl p-4 flex flex-col items-center text-center shadow-[0_0_20px_rgba(0,229,117,0.15)] scale-105 z-10">
            <span className="w-8 h-8 rounded-full bg-[#00E575] text-[#060A08] flex items-center justify-center font-black text-xs mb-1.5">
              #1
            </span>
            <span className="font-black text-white text-sm truncate max-w-[90px]">
              {leaderboard[0].username}
            </span>
            <span className="text-[#00E575] font-mono font-black text-xs mt-0.5">
              {leaderboard[0].totalScore.toLocaleString()}
            </span>
          </div>
        )}

        {/* 3rd */}
        {leaderboard[2] && (
          <div className="bg-[#111714] border border-white/5 rounded-2xl p-3 flex flex-col items-center text-center">
            <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs mb-1.5">
              #3
            </span>
            <span className="font-bold text-white text-xs truncate max-w-[80px]">
              {leaderboard[2].username}
            </span>
            <span className="text-[#00E575] font-mono text-[11px] font-bold mt-0.5">
              {leaderboard[2].totalScore.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Table List */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-2xl p-3 overflow-hidden">
        <div className="divide-y divide-white/5">
          {leaderboard.map((player, idx) => (
            <div
              key={player.userId}
              className="py-3 px-2 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 text-slate-400 font-bold font-mono">
                  #{idx + 1}
                </span>
                <span className="font-bold text-white truncate">
                  {player.username}
                </span>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-slate-400 text-[11px]">
                  {player.gamesPlayed} games
                </span>
                <span className="font-mono font-bold text-[#00E575] min-w-[50px] text-right">
                  {player.totalScore.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
