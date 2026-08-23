'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // 1-Click Google OAuth Sign-in
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setErrorMsg('Database connection is not configured yet. Play as Guest or configure Supabase keys!');
      setIsGoogleLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=/play`,
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to initialize Google login.');
      }
      setIsGoogleLoading(false);
    }
  };

  // Standard Email & Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    if (!supabase) {
      setErrorMsg('Database connection is not configured yet. Play as Guest!');
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              username: cleanUsername || cleanEmail.split('@')[0],
            },
          },
        });

        if (error) throw error;
        setSuccessMsg('Account created! Please check your email to confirm.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;
        router.push('/play');
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-[#111714] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col items-center">
      {/* Brand Icon */}
      <div className="text-[#00E575] mb-2">
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight">
        {mode === 'login' ? 'Sign In to Hummly' : 'Join Hummly'}
      </h2>
      <p className="text-slate-400 text-xs mt-1 text-center">
        Save high scores, maintain streaks, and climb the leaderboard
      </p>

      {/* Alerts */}
      {errorMsg && (
        <div className="w-full mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="w-full mt-4 p-3 rounded-2xl bg-[#00E575]/10 border border-[#00E575]/20 text-[#00E575] text-xs flex items-center gap-2">
          <UserCheck className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1-Tap Google Sign In */}
      <div className="w-full mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full h-12 rounded-full bg-[#18231E] hover:bg-[#202E28] active:bg-[#141C18] border border-white/10 hover:border-white/20 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <span className="text-xs text-slate-300">Connecting to Google...</span>
          ) : (
            <>
              {/* Official Multi-color Google 'G' SVG */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-[#111714] px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            or with email
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3 mt-2">
        {mode === 'signup' && (
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. BollywoodBuff"
              className="w-full h-12 px-4 rounded-full bg-[#16201B] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00E575]/50"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full h-12 px-4 rounded-full bg-[#16201B] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00E575]/50"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-12 px-4 rounded-full bg-[#16201B] border border-white/10 text-white text-sm focus:outline-none focus:border-[#00E575]/50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-2 rounded-full bg-[#00E575] hover:bg-[#00F77F] text-[#060A08] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,117,0.3)] transition-all disabled:opacity-50 cursor-pointer"
        >
          <span>{isLoading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
        </button>
      </form>

      {/* Guest Link */}
      <Link
        href="/play"
        className="w-full text-center py-3 text-xs font-bold text-[#00E575] hover:underline mt-2"
      >
        Skip and Play as Guest &rarr;
      </Link>

      {/* Mode Switch */}
      <div className="mt-4 pt-3 border-t border-white/5 text-center text-xs text-slate-400">
        {mode === 'login' ? (
          <p>
            No account?{' '}
            <Link href="/signup" className="text-[#00E575] font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        ) : (
          <p>
            Have an account?{' '}
            <Link href="/login" className="text-[#00E575] font-bold hover:underline">
              Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
