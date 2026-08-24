'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX, User, Trophy, Users, Play, LogIn } from 'lucide-react';
import { soundFX } from '@/lib/sound-effects';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [user, setUser] = useState<{ email?: string; id?: string; user_metadata?: { username?: string; avatar_url?: string; picture?: string } } | null>(null);
  const [username, setUsername] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsMuted(soundFX.getIsMuted());

    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(async ({ data }) => {
        if (data.user) {
          setUser(data.user);
          let name = data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'Player';
          let pfp = data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null;

          try {
            const { data: profile } = await (supabase.from('profiles') as any)
              .select('username, avatar_url')
              .eq('id', data.user.id)
              .single();

            if (profile?.username) name = profile.username;
            if (profile?.avatar_url) pfp = profile.avatar_url;
          } catch {}

          setUsername(name);
          setAvatarUrl(pfp);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          let name = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'Player';
          let pfp = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;

          try {
            const { data: profile } = await (supabase.from('profiles') as any)
              .select('username, avatar_url')
              .eq('id', session.user.id)
              .single();

            if (profile?.username) name = profile.username;
            if (profile?.avatar_url) pfp = profile.avatar_url;
          } catch {}

          setUsername(name);
          setAvatarUrl(pfp);
        } else {
          setUser(null);
          setUsername('');
          setAvatarUrl(null);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const toggleSound = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    soundFX.setMuted(nextState);
    if (!nextState) {
      soundFX.playCorrect();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#060A08]/90 backdrop-blur-md border-b border-white/5">
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex items-center justify-center text-[#00E575] group-hover:scale-110 transition-transform">
            <svg
              className="w-6 h-6 sm:w-7 sm:h-7 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="font-black text-xl sm:text-2xl tracking-tight text-[#00E575]">
            Hummly
          </span>
        </Link>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Solo Play Link (Desktop Only to save mobile space) */}
          <Link
            href="/play"
            className={`hidden md:flex px-3 py-1.5 rounded-full text-xs font-bold transition-all items-center gap-1.5 ${
              pathname === '/play'
                ? 'bg-[#00E575] text-[#060A08]'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Solo Quick Play"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Solo</span>
          </Link>

          {/* Multiplayer Link */}
          <Link
            href="/multiplayer"
            className={`p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              pathname?.startsWith('/multiplayer')
                ? 'bg-[#00E575] text-[#060A08] shadow-[0_0_15px_rgba(0,229,117,0.3)]'
                : 'text-[#00E575] bg-[#00E575]/10 border border-[#00E575]/20 hover:bg-[#00E575]/20'
            }`}
            title="Play With Friends (Multiplayer)"
          >
            <Users className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span className="hidden sm:inline">Multiplayer</span>
          </Link>

          {/* Leaderboard Link */}
          <Link
            href="/leaderboard"
            className={`p-2 rounded-full transition-colors ${
              pathname === '/leaderboard'
                ? 'text-[#00E575] bg-[#00E575]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Leaderboard"
            aria-label="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
          </Link>

          {/* Sound FX Toggle Button */}
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#00E575]" />
            )}
          </button>

          {/* User Profile / Auth Link */}
          {user ? (
            <Link
              href="/profile"
              className={`flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-3 sm:py-1 rounded-full border transition-all ${
                pathname === '/profile'
                  ? 'bg-[#18231E] border-[#00E575] text-[#00E575]'
                  : 'bg-[#111714] border-white/10 hover:border-[#00E575]/50 text-slate-200'
              }`}
              title={`Profile: ${username}`}
            >
              <div className="w-7 h-7 sm:w-6 sm:h-6 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center font-black text-xs text-[#00E575] border border-white/10 shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{username ? username.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold truncate max-w-[100px]">
                {username}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-[#00E575] text-[#060A08] font-bold text-xs shadow-sm hover:bg-[#00F77F] transition-all flex items-center gap-1.5 shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
