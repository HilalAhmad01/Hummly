'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Copy,
  Check,
  Crown,
  Users,
  Play,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Share2,
  CheckCircle2,
  Clock,
  Radio,
} from 'lucide-react';
import { MultiplayerRoom, BollywoodEra } from '@/types/game';
import { soundFX } from '@/lib/sound-effects';

interface MultiplayerLobbyProps {
  room: MultiplayerRoom;
  currentUserId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

const ERA_LABELS: Record<BollywoodEra, string> = {
  all: 'All Bollywood Hits',
  punjabi: 'Punjabi Songs',
  '2020s': '2020s Chartbusters',
  '2010s': 'Golden 2010s',
  '2000s': 'Nostalgic 2000s',
  '90s': '90s Retro Classics',
  retro: '70s & 80s Golden Era',
  party: 'Party & Dance Bangers',
  romance: 'Romantic Melodies',
};

export default function MultiplayerLobby({
  room,
  currentUserId,
  onToggleReady,
  onStartGame,
  onLeaveRoom,
}: MultiplayerLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);

  const isHost = room.hostId === currentUserId;
  const currentPlayer = room.players.find((p) => p.userId === currentUserId);
  const allNonHostReady = room.players
    .filter((p) => !p.isHost)
    .every((p) => p.isReady);
  const canStart = isHost && room.players.length >= 1 && (room.players.length === 1 || allNonHostReady);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      soundFX.playCorrect();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleShareLink = async () => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/multiplayer?room=${room.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareUrlCopied(true);
      soundFX.playCorrect();
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col items-center gap-6">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Leave Room</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00E575] animate-pulse" />
          <span className="text-xs font-bold text-[#00E575] uppercase tracking-wider">
            Lobby Active
          </span>
        </div>
      </div>

      {/* Room Code Showcase Card */}
      <div className="w-full bg-[#111714] border border-[#00E575]/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-[0_0_35px_rgba(0,229,117,0.12)] relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-[#00E575]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-[#00E575]/10 rounded-full blur-3xl pointer-events-none" />

        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          Room Invite Code
        </span>

        <div className="flex items-center gap-3 my-2">
          <span className="font-mono text-4xl sm:text-5xl font-black text-white tracking-widest px-4 py-2 rounded-2xl bg-[#060A08] border border-white/10 shadow-inner">
            {room.code}
          </span>
          <button
            onClick={handleCopyCode}
            aria-label="Copy Room Code"
            className="p-3.5 rounded-2xl bg-[#00E575]/10 border border-[#00E575]/30 hover:bg-[#00E575]/20 text-[#00E575] transition-all cursor-pointer hover:scale-105 active:scale-95"
            title="Copy Code"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={handleShareLink}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{shareUrlCopied ? 'Link Copied!' : 'Copy Share Link'}</span>
          </button>

          <span className="text-xs text-slate-500">•</span>

          <span className="text-xs font-medium text-slate-400">
            Era: <strong className="text-white">{ERA_LABELS[room.eraFilter]}</strong>
          </span>
        </div>
      </div>

      {/* Players List Grid (Up to 5 Players) */}
      <div className="w-full bg-[#111714] border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#00E575]" />
            <span className="text-sm font-bold text-white">Connected Players</span>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
            {room.players.length} / 5
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {room.players.map((player, idx) => {
            const isYou = player.userId === currentUserId;
            return (
              <div
                key={player.id || idx}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isYou
                    ? 'bg-[#18231E] border-[#00E575]/40 shadow-[0_0_15px_rgba(0,229,117,0.1)]'
                    : 'bg-[#131B17] border-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-gradient-to-tr from-emerald-950 to-slate-900 flex items-center justify-center font-black text-sm text-[#00E575] shrink-0">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
                    ) : (
                      <span>{player.username.charAt(0).toUpperCase()}</span>
                    )}

                    {player.isHost && (
                      <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-400 text-black shadow">
                        <Crown className="w-2.5 h-2.5 fill-current" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white truncate max-w-[120px]">
                        {player.username}
                      </span>
                      {isYou && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00E575]/20 text-[#00E575]">
                          You
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {player.isHost ? 'Room Host' : 'Player'}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {player.isHost ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                      <Crown className="w-3 h-3 fill-current" />
                      <span>Host</span>
                    </span>
                  ) : player.isReady ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00E575] bg-[#00E575]/10 px-2.5 py-1 rounded-full border border-[#00E575]/20">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Ready</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                      <Clock className="w-3 h-3" />
                      <span>Waiting</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty Slot Placeholders */}
          {Array.from({ length: Math.max(0, 5 - room.players.length) }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="p-3.5 rounded-2xl border border-dashed border-white/10 bg-transparent flex items-center justify-center text-slate-600 text-xs font-medium"
            >
              <span>Empty Slot ({room.players.length + idx + 1}/5)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Controls */}
      <div className="w-full flex flex-col items-center gap-3">
        {isHost ? (
          <button
            onClick={() => {
              soundFX.playCorrect();
              onStartGame();
            }}
            disabled={!canStart}
            className={`w-full h-14 rounded-full font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer ${
              canStart
                ? 'bg-[#00E575] hover:bg-[#00F77F] active:scale-[0.98] text-[#060A08] shadow-[0_0_30px_rgba(0,229,117,0.4)]'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current ml-0.5" />
            <span>{room.players.length === 1 ? 'Start Match (Solo/Testing)' : 'Start 10-Round Match'}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              soundFX.playCorrect();
              onToggleReady();
            }}
            className={`w-full h-14 rounded-full font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
              currentPlayer?.isReady
                ? 'bg-[#18231E] border border-[#00E575] text-[#00E575] shadow-[0_0_20px_rgba(0,229,117,0.2)]'
                : 'bg-[#00E575] hover:bg-[#00F77F] text-[#060A08] shadow-[0_0_30px_rgba(0,229,117,0.35)]'
            }`}
          >
            {currentPlayer?.isReady ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Ready! (Click to Unready)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Click When Ready</span>
              </>
            )}
          </button>
        )}

        {isHost && !canStart && (
          <p className="text-xs text-amber-400 font-medium">
            Waiting for all friends to click &ldquo;Ready&rdquo; before starting.
          </p>
        )}
      </div>
    </div>
  );
}
