'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  LogOut,
  User,
  Edit2,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { GameSessionSummary } from '@/types/game';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { soundFX } from '@/lib/sound-effects';

export default function ProfilePage() {
  const [user, setUser] = useState<{ email?: string; id?: string; user_metadata?: { username?: string; avatar_url?: string } } | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [editInput, setEditInput] = useState<string>('');
  const [editStatus, setEditStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message?: string }>({ type: null });

  const [history, setHistory] = useState<GameSessionSummary[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [totalGames, setTotalGames] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);

  useEffect(() => {
    // Check Supabase Auth
    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      supabase.auth.getUser().then(async ({ data }) => {
        if (data.user) {
          setUser(data.user);

          // Fetch profile from database
          try {
            const { data: profile } = await (supabase.from('profiles') as any)
              .select('username, total_score, games_played')
              .eq('id', data.user.id)
              .single();

            if (profile?.username) {
              setUsername(profile.username);
            } else {
              setUsername(data.user.email?.split('@')[0] || 'Player');
            }

            if (profile?.total_score) {
              setTotalScore(Number(profile.total_score));
            }
            if (profile?.games_played) {
              setTotalGames(Number(profile.games_played));
            }
          } catch {
            setUsername(data.user.email?.split('@')[0] || 'Player');
          }
        } else {
          const guestName = localStorage.getItem('hummly_guest_name') || 'Guest_Player';
          setUsername(guestName);
        }
      });
    } else {
      const guestName = (typeof window !== 'undefined' && localStorage.getItem('hummly_guest_name')) || 'Guest_Player';
      setUsername(guestName);
    }

    // Load Local History
    try {
      const stored = localStorage.getItem('swaraguess_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validHistory = parsed.filter(
            (item) => item && typeof item === 'object' && typeof item.totalScore === 'number'
          ) as GameSessionSummary[];

          setHistory(validHistory);

          if (!user) {
            const sumScore = validHistory.reduce((acc, curr) => acc + (Number(curr.totalScore) || 0), 0);
            const bestStreak = validHistory.reduce((acc, curr) => Math.max(acc, Number(curr.maxStreak) || 0), 0);

            setTotalScore(sumScore);
            setTotalGames(validHistory.length);
            setMaxStreak(bestStreak);
          }
        }
      }
    } catch {
      setHistory([]);
    }
  }, []);

  const handleStartEdit = () => {
    setEditInput(username);
    setEditStatus({ type: null });
    setIsEditingUsername(true);
  };

  const handleCancelEdit = () => {
    setIsEditingUsername(false);
    setEditStatus({ type: null });
  };

  const handleSaveUsername = async () => {
    const clean = editInput.trim().replace(/[^a-zA-Z0-9_]/g, '');

    if (clean.length < 3) {
      setEditStatus({ type: 'error', message: 'Username must be at least 3 characters.' });
      return;
    }

    if (clean.length > 20) {
      setEditStatus({ type: 'error', message: 'Username cannot exceed 20 characters.' });
      return;
    }

    if (clean === username) {
      setIsEditingUsername(false);
      return;
    }

    setEditStatus({ type: 'loading', message: 'Checking availability...' });

    const supabase = createClient();
    if (supabase && user && isSupabaseConfigured) {
      try {
        // Check uniqueness in profiles table
        const { data: existingUser } = await (supabase.from('profiles') as any)
          .select('id')
          .ilike('username', clean)
          .neq('id', user.id)
          .maybeSingle();

        if (existingUser) {
          setEditStatus({ type: 'error', message: `"${clean}" is already taken. Try another!` });
          return;
        }

        // Update profile in DB
        const { error: updateError } = await (supabase.from('profiles') as any)
          .update({ username: clean })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Sync metadata
        await supabase.auth.updateUser({
          data: { username: clean },
        });

        setUsername(clean);
        soundFX.playCorrect();
        setEditStatus({ type: 'success', message: 'Username updated!' });
        setTimeout(() => {
          setIsEditingUsername(false);
          setEditStatus({ type: null });
        }, 1200);
      } catch (err: unknown) {
        setEditStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to update username.',
        });
      }
    } else {
      // Offline / guest update
      localStorage.setItem('hummly_guest_name', clean);
      setUsername(clean);
      soundFX.playCorrect();
      setEditStatus({ type: 'success', message: 'Username saved!' });
      setTimeout(() => {
        setIsEditingUsername(false);
        setEditStatus({ type: null });
      }, 1200);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setUsername('Guest_Player');
    }
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto px-4 py-6 flex flex-col items-center">
      {/* Top Bar */}
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
            className="px-4 py-1.5 rounded-full bg-[#00E575] text-[#060A08] font-bold text-xs shadow-sm hover:scale-105 transition-transform"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* User Profile Card with Editable Unique Username */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#18231E] border border-[#00E575]/40 flex items-center justify-center text-xl font-black text-[#00E575] shadow-[0_0_15px_rgba(0,229,117,0.15)] overflow-hidden shrink-0">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              username.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            {isEditingUsername ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    maxLength={20}
                    placeholder="Enter unique username"
                    autoFocus
                    className="w-full px-3 py-1.5 rounded-xl bg-[#060A08] border border-[#00E575]/50 text-white font-bold text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={editStatus.type === 'loading'}
                    className="p-2 rounded-xl bg-[#00E575] text-[#060A08] font-bold cursor-pointer hover:scale-105 transition-transform"
                    title="Save Username"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {editStatus.message && (
                  <div
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      editStatus.type === 'error'
                        ? 'text-rose-400'
                        : editStatus.type === 'success'
                        ? 'text-[#00E575]'
                        : 'text-amber-400'
                    }`}
                  >
                    {editStatus.type === 'error' && <AlertCircle className="w-3 h-3" />}
                    <span>{editStatus.message}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white truncate max-w-[180px]">
                      {username}
                    </h2>
                    <button
                      onClick={handleStartEdit}
                      aria-label="Edit Username"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#00E575] hover:bg-white/5 transition-colors cursor-pointer"
                      title="Edit unique username"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 block truncate">
                    {user?.email || 'Guest Player (Stats saved on device)'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {!user && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
            <span>Log in to play 5-player multiplayer & save scores online!</span>
            <Link href="/login" className="font-bold underline text-amber-200 ml-2">
              Sign In
            </Link>
          </div>
        )}
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

      {/* Action CTA Grid */}
      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        <Link
          href="/play"
          className="h-14 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:scale-95 text-[#060A08] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(0,229,117,0.25)] transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current ml-0.5" />
          <span>Solo Play</span>
        </Link>

        <Link
          href="/multiplayer"
          className="h-14 rounded-full bg-[#18231E] hover:bg-[#202E27] border border-[#00E575]/40 text-[#00E575] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,117,0.15)] transition-all cursor-pointer"
        >
          <Users className="w-4 h-4" />
          <span>Multiplayer</span>
        </Link>
      </div>

      {/* Recent Solo Sessions */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-2xl p-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
          Recent Solo Sessions
        </div>

        {history.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No games played yet. Tap &ldquo;Solo Play&rdquo; to start!
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-56 overflow-y-auto pr-1">
            {history.slice(0, 10).map((session, idx) => (
              <div key={idx} className="py-2.5 px-2 flex items-center justify-between text-xs">
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
