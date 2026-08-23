'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Volume2, VolumeX, User, Trophy, Play } from 'lucide-react';
import { soundFX } from '@/lib/sound-effects';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const pathname = usePathname();
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [user, setUser] = useState<{ email?: string; id?: string; user_metadata?: { avatar_url?: string } } | null>(null);

  useEffect(() => {
    setIsMuted(soundFX.getIsMuted());

    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user || null);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
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
      <div className="max-w-md sm:max-w-lg md:max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo (Matching Reference UI: Music Note + Hummly) */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center text-[#00E575] group-hover:scale-110 transition-transform">
            <svg
              className="w-7 h-7 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="font-black text-2xl tracking-tight text-[#00E575]">
            Hummly
          </span>
        </Link>

        {/* Action Controls & Profile Avatar */}
        <div className="flex items-center gap-3">
          {/* Navigation Links */}
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

          {/* User Profile Avatar (Matching Reference UI Top-Right Avatar) */}
          <Link
            href="/profile"
            className="relative w-9 h-9 rounded-full overflow-hidden border border-[#00E575]/30 hover:border-[#00E575] transition-all flex items-center justify-center bg-gradient-to-tr from-emerald-950 to-slate-900 shadow-md shadow-emerald-500/20"
            title="Profile"
            aria-label="Profile"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-emerald-600 via-teal-700 to-indigo-900 flex items-center justify-center text-slate-950 font-black text-xs">
                <User className="w-4 h-4 text-emerald-100" />
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
