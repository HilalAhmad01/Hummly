'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Plus,
  LogIn,
  Radio,
  ArrowLeft,
  Sparkles,
  Flame,
  Music2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { BollywoodEra, MultiplayerGameMode, MultiplayerRoom } from '@/types/game';
import {
  createMultiplayerRoom,
  joinMultiplayerRoom,
  fetchRoomByCode,
  subscribeToMultiplayerRoom,
  togglePlayerReadyState,
  startMultiplayerGame,
  submitMultiplayerGuess,
  advanceToNextMultiplayerRound,
  resetMultiplayerGameToLobby,
} from '@/lib/multiplayer-service';
import { createClient } from '@/lib/supabase/client';
import { soundFX } from '@/lib/sound-effects';

import MultiplayerLobby from '@/components/multiplayer/MultiplayerLobby';
import MultiplayerArena from '@/components/multiplayer/MultiplayerArena';
import MultiplayerPodium from '@/components/multiplayer/MultiplayerPodium';

const ERA_OPTIONS: { id: BollywoodEra; label: string; icon: string; desc: string }[] = [
  { id: 'all', label: 'All Bollywood Hits', icon: '🌟', desc: '500+ tracks spanning all golden eras' },
  { id: 'punjabi', label: 'Punjabi Songs', icon: '🔥', desc: 'Sidhu Moose Wala, Karan Aujla, Shubh & AP Dhillon' },
  { id: '2020s', label: '2020s Chartbusters', icon: '⚡', desc: 'Animal, Jawan, Stree 2 & modern hits' },
  { id: '2010s', label: 'Golden 2010s', icon: '🎸', desc: 'Arijit Singh, Pritam & YJHD melodies' },
  { id: '2000s', label: 'Nostalgic 2000s', icon: '🎧', desc: 'KK, Sonu Nigam & Y2K evergreen gold' },
  { id: '90s', label: '90s Retro Classics', icon: '📻', desc: 'DDLJ, Kumar Sanu & Alka Yagnik classics' },
  { id: 'retro', label: '70s & 80s Golden Era', icon: '🎙️', desc: 'Kishore Kumar, R.D. Burman, Rafi & Lata timeless hits' },
  { id: 'party', label: 'Party & Dance', icon: '💃', desc: 'Club bangers, sangeet & celebration anthems' },
  { id: 'romance', label: 'Romantic Melodies', icon: '💖', desc: 'Soulful love ballads & acoustic tunes' },
];

const GAME_MODE_OPTIONS: { id: MultiplayerGameMode; title: string; subtitle: string; icon: string; badge: string; badgeColor: string }[] = [
  {
    id: 'classic',
    title: 'Classic Stages',
    subtitle: '5 progressive snippet lengths (0.2s → 10s). Play at your own pace.',
    icon: '🎯',
    badge: 'Relaxed & Tactical',
    badgeColor: 'bg-emerald-500/10 text-[#00E575] border-[#00E575]/20',
  },
  {
    id: 'fastest_finger',
    title: 'Fastest Finger First',
    subtitle: '10s live race! First correct guess wins the round & takes all the points.',
    icon: '⚡',
    badge: 'High Stakes & Speed',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
];

function MultiplayerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomQueryCode = searchParams.get('room');

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    username: string;
    avatarUrl?: string;
  } | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // View state
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [selectedEra, setSelectedEra] = useState<BollywoodEra>('all');
  const [selectedGameMode, setSelectedGameMode] = useState<MultiplayerGameMode>('fastest_finger');
  const [inputCode, setInputCode] = useState<string>(roomQueryCode || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Active room state
  const [activeRoom, setActiveRoom] = useState<MultiplayerRoom | null>(null);

  // 1. Check Authentication on Mount
  useEffect(() => {
    const supabase = createClient();
    if (supabase) {
      supabase.auth.getUser().then(async ({ data }) => {
        if (data.user) {
          // Fetch profile username if available
          let profileUsername = data.user.email?.split('@')[0] || 'Player';
          let avatarUrl = data.user.user_metadata?.avatar_url || undefined;

          try {
            const { data: profile } = await (supabase.from('profiles') as any)
              .select('username, avatar_url')
              .eq('id', data.user.id)
              .single();

            if (profile?.username) profileUsername = profile.username;
            if (profile?.avatar_url) avatarUrl = profile.avatar_url;
          } catch {
            // Use defaults
          }

          setCurrentUser({
            id: data.user.id,
            email: data.user.email,
            username: profileUsername,
            avatarUrl,
          });
        }
        setAuthChecking(false);
      });
    } else {
      // In local offline mode without Supabase
      const localGuestId = 'local_user_' + (typeof window !== 'undefined' ? localStorage.getItem('hummly_local_id') || Math.floor(Math.random() * 10000) : '1');
      if (typeof window !== 'undefined') localStorage.setItem('hummly_local_id', localGuestId);

      const localUsername = typeof window !== 'undefined' ? localStorage.getItem('hummly_guest_name') || `Player_${localGuestId.slice(-4)}` : 'Player';

      setCurrentUser({
        id: localGuestId,
        username: localUsername,
      });
      setAuthChecking(false);
    }
  }, []);

  // 2. Realtime Room Subscription & Cross-Device Sync
  useEffect(() => {
    if (!activeRoom?.code) return;
    const roomCode = activeRoom.code;

    const unsubscribe = subscribeToMultiplayerRoom(roomCode, (updatedRoom) => {
      setActiveRoom(updatedRoom);
    });

    // Cross-device backup poller every 2s to guarantee instant sync
    const syncInterval = setInterval(async () => {
      const fresh = await fetchRoomByCode(roomCode);
      if (fresh) {
        setActiveRoom((prev) => {
          if (!prev) return fresh;
          if (
            prev.players.length !== fresh.players.length ||
            prev.status !== fresh.status ||
            prev.currentRound !== fresh.currentRound ||
            Object.keys(prev.currentRoundGuesses).length !== Object.keys(fresh.currentRoundGuesses).length ||
            prev.players.some((p, i) => p.isReady !== fresh.players[i]?.isReady) ||
            prev.players.some((p, i) => p.totalScore !== fresh.players[i]?.totalScore) ||
            prev.updatedAt !== fresh.updatedAt
          ) {
            return fresh;
          }
          return prev;
        });
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(syncInterval);
    };
  }, [activeRoom?.code]);

  // 3. Auto-join if ?room= query param is provided and user is authenticated
  useEffect(() => {
    if (roomQueryCode && currentUser && !activeRoom && !isProcessing) {
      handleJoinRoom(roomQueryCode);
    }
  }, [roomQueryCode, currentUser]);

  // Handler: Create Room
  const handleCreateRoom = async () => {
    if (!currentUser) return;
    setIsProcessing(true);
    setErrorMessage(null);

    const { room, error } = await createMultiplayerRoom({
      hostUser: currentUser,
      era: selectedEra,
      gameMode: selectedGameMode,
    });

    if (error || !room) {
      setErrorMessage(error || 'Failed to create room.');
      setIsProcessing(false);
      return;
    }

    soundFX.playCorrect();
    setActiveRoom(room);
    setIsProcessing(false);
  };

  // Handler: Join Room
  const handleJoinRoom = async (codeToJoin?: string) => {
    if (!currentUser) return;
    const targetCode = (codeToJoin || inputCode).trim().toUpperCase();

    if (targetCode.length !== 6) {
      setErrorMessage('Room code must be exactly 6 characters.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { room, error } = await joinMultiplayerRoom(targetCode, currentUser);

    if (error || !room) {
      setErrorMessage(error || 'Failed to join room.');
      setIsProcessing(false);
      return;
    }

    soundFX.playCorrect();
    setActiveRoom(room);
    setIsProcessing(false);
  };

  // Handler: Toggle Ready
  const handleToggleReady = () => {
    if (!activeRoom || !currentUser) return;
    const updated = togglePlayerReadyState(activeRoom, currentUser.id);
    setActiveRoom(updated);
  };

  // Handler: Start Match (Host only)
  const handleStartGame = async () => {
    if (!activeRoom || isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await startMultiplayerGame(activeRoom);
      setActiveRoom(updated);
    } catch (err) {
      console.error('Error starting match:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Submit Guess
  const handleSubmitGuess = (
    stageIndex: number,
    isCorrect: boolean,
    scoreAwarded: number,
    guessTitle: string,
    guessTimeSeconds?: number
  ) => {
    if (!activeRoom || !currentUser) return;
    const updated = submitMultiplayerGuess({
      room: activeRoom,
      userId: currentUser.id,
      stageIndex,
      isCorrect,
      scoreAwarded,
      guessTitle,
      guessTimeSeconds,
    });
    setActiveRoom(updated);
  };


  // Handler: Advance Round
  const handleAdvanceRound = () => {
    if (!activeRoom) return;
    const updated = advanceToNextMultiplayerRound(activeRoom);
    setActiveRoom(updated);
  };

  // Handler: Play Again (Same Room)
  const handlePlayAgain = async () => {
    if (!activeRoom || isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await resetMultiplayerGameToLobby(activeRoom);
      setActiveRoom(updated);
      soundFX.playCorrect();
    } catch (err) {
      console.error('Error resetting multiplayer game:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Leave Room
  const handleLeaveRoom = () => {
    setActiveRoom(null);
    setInputCode('');
    router.replace('/multiplayer');
  };

  if (authChecking) {
    return (
      <div className="w-full flex-1 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#00E575] border-t-transparent animate-spin" />
          <span className="text-xs font-bold text-slate-400">Loading Multiplayer Arena...</span>
        </div>
      </div>
    );
  }

  // GUEST AUTH GATE: If user is not logged in, prompt login for multiplayer
  if (!currentUser) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#111714] border border-[#00E575]/30 flex items-center justify-center text-[#00E575] mb-6 shadow-[0_0_30px_rgba(0,229,117,0.15)]">
          <Lock className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
          Multiplayer Requires Login
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
          Log in with your account to host rooms, invite up to 5 friends, compete on synchronous rounds, and claim victory on the podium.
        </p>

        <div className="w-full flex flex-col gap-3">
          <Link
            href={`/login?next=/multiplayer${inputCode ? `?room=${inputCode}` : ''}`}
            className="w-full h-14 rounded-full bg-[#00E575] hover:bg-[#00F77F] text-[#060A08] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,117,0.3)] transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Play Multiplayer</span>
          </Link>

          <Link
            href="/play"
            className="w-full h-12 rounded-full bg-[#111714] hover:bg-[#18231E] border border-white/10 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <span>Play Single Player as Guest (No Login Required)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // If currently inside an active room:
  if (activeRoom) {
    if (activeRoom.status === 'lobby') {
      return (
        <MultiplayerLobby
          room={activeRoom}
          currentUserId={currentUser.id}
          onToggleReady={handleToggleReady}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      );
    }

    if (activeRoom.status === 'playing' || activeRoom.status === 'revealing') {
      return (
        <MultiplayerArena
          room={activeRoom}
          currentUserId={currentUser.id}
          onSubmitGuess={handleSubmitGuess}
          onAdvanceRound={handleAdvanceRound}
        />
      );
    }

    if (activeRoom.status === 'finished') {
      return (
        <MultiplayerPodium
          room={activeRoom}
          currentUserId={currentUser.id}
          onPlayAgain={handlePlayAgain}
          onLeaveRoom={handleLeaveRoom}
          isProcessing={isProcessing}
        />
      );
    }
  }

  // MULTIPLAYER HUB (Create Room / Join Room)
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-8 flex flex-col items-center gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00E575]/10 border border-[#00E575]/30 text-[#00E575] font-bold text-xs uppercase tracking-widest mb-3">
          <Users className="w-4 h-4" />
          <span>Real-time Multiplayer</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Play With Friends
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
          Host a 10-round synchronized match or enter a 6-character room code to join up to 5 friends.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="w-full grid grid-cols-2 p-1.5 rounded-2xl bg-[#111714] border border-white/5">
        <button
          onClick={() => {
            setMode('create');
            setErrorMessage(null);
          }}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mode === 'create'
              ? 'bg-[#00E575] text-[#060A08] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Host a Room</span>
        </button>

        <button
          onClick={() => {
            setMode('join');
            setErrorMessage(null);
          }}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
            mode === 'join'
              ? 'bg-[#00E575] text-[#060A08] shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Join With Code</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="w-full p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold text-center">
          {errorMessage}
        </div>
      )}

      {/* Tab 1: Host Room */}
      {mode === 'create' ? (
        <div className="w-full bg-[#111714] border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col gap-6">
          {/* Game Mode Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
              Select Game Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GAME_MODE_OPTIONS.map((item) => {
                const isSelected = selectedGameMode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedGameMode(item.id)}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? item.id === 'fastest_finger'
                          ? 'bg-[#18231E] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.18)]'
                          : 'bg-[#18231E] border-[#00E575] shadow-[0_0_20px_rgba(0,229,117,0.18)]'
                        : 'bg-[#131B17] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.icon}</span>
                        <span
                          className={`text-sm font-black ${
                            isSelected
                              ? item.id === 'fastest_finger'
                                ? 'text-amber-400'
                                : 'text-[#00E575]'
                              : 'text-white'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Era Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Select Bollywood Era / Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ERA_OPTIONS.map((item) => {
                const isSelected = selectedEra === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedEra(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#18231E] border-[#00E575] shadow-[0_0_15px_rgba(0,229,117,0.15)]'
                        : 'bg-[#131B17] border-white/5 hover:border-white/15'
                    }`}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <span className={`text-xs font-bold block ${isSelected ? 'text-[#00E575]' : 'text-white'}`}>
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isProcessing}
            className="w-full h-14 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:scale-[0.98] text-[#060A08] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,117,0.3)] transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create & Host Room</span>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Tab 2: Join Room */
        <div className="w-full bg-[#111714] border border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col items-center gap-5 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Enter 6-Character Room Code
          </span>

          <input
            type="text"
            maxLength={6}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            placeholder="e.g. BOLL92"
            className="w-full max-w-xs h-16 rounded-2xl bg-[#060A08] border border-white/15 text-center font-mono text-3xl font-black text-white tracking-widest placeholder:text-slate-700 focus:outline-none focus:border-[#00E575] uppercase transition-all shadow-inner"
          />

          <button
            onClick={() => handleJoinRoom()}
            disabled={isProcessing || inputCode.trim().length !== 6}
            className="w-full max-w-xs h-14 rounded-full bg-[#00E575] hover:bg-[#00F77F] active:scale-[0.98] text-[#060A08] font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,229,117,0.3)] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Join Room</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function MultiplayerPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full flex-1 flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[#00E575] border-t-transparent animate-spin" />
        </div>
      }
    >
      <MultiplayerContent />
    </Suspense>
  );
}
