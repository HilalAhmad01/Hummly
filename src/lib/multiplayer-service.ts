import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { CURATED_BOLLYWOOD_SONGS } from '@/lib/mock-data';
import {
  BollywoodEra,
  MultiplayerRoom,
  RoomPlayer,
  PlayerRoundGuess,
  Song,
  RoomStatus,
} from '@/types/game';

const TOTAL_ROUNDS = 10;
const MAX_PLAYERS = 5;

// Generate clean 6-character room code (e.g. "BEAT82", "BOLL91")
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Unbiased Fisher-Yates Shuffle for Playlist Selection
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickMultiplayerPlaylist(targetEra: BollywoodEra): Song[] {
  let pool = CURATED_BOLLYWOOD_SONGS.filter(
    (s) => s.is_active !== false && !!s.deezer_preview_url && s.deezer_preview_url.startsWith('http')
  );

  if (targetEra === '2020s') {
    pool = pool.filter((s) => s.era === '2020s');
  } else if (targetEra === '2010s') {
    pool = pool.filter((s) => s.era === '2010s');
  } else if (targetEra === '2000s') {
    pool = pool.filter((s) => s.era === '2000s');
  } else if (targetEra === '90s') {
    pool = pool.filter((s) => s.era === '90s');
  } else if (targetEra === 'punjabi') {
    pool = pool.filter((s) => s.era === 'punjabi' || s.language === 'punjabi');
  } else if (targetEra === 'party') {
    pool = pool.filter((s) => s.theme === 'party');
  } else if (targetEra === 'romance') {
    pool = pool.filter((s) => s.theme === 'romantic');
  }

  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, TOTAL_ROUNDS);
}

// ==============================================================================
// LOCAL / BROADCAST-CHANNEL FALLBACK ENGINE (For Offline / Local Multi-Tab Play)
// ==============================================================================
const LOCAL_STORAGE_KEY_PREFIX = 'hummly_mp_room_';

class LocalRoomHub {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(room: MultiplayerRoom) => void> = new Set();
  private activeRoomCode: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('hummly_multiplayer_hub');
      this.channel.onmessage = (event) => {
        if (event.data?.type === 'ROOM_UPDATE' && event.data?.room) {
          const updatedRoom: MultiplayerRoom = event.data.room;
          if (this.activeRoomCode === updatedRoom.code) {
            this.notify(updatedRoom);
          }
        }
      };
    }
  }

  subscribe(roomCode: string, callback: (room: MultiplayerRoom) => void): () => void {
    this.activeRoomCode = roomCode;
    this.listeners.add(callback);

    const existing = this.getRoom(roomCode);
    if (existing) {
      callback(existing);
    }

    return () => {
      this.listeners.delete(callback);
    };
  }

  getRoom(roomCode: string): MultiplayerRoom | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + roomCode);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  saveAndBroadcast(room: MultiplayerRoom) {
    if (typeof window === 'undefined') return;
    room.updatedAt = new Date().toISOString();
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + room.code, JSON.stringify(room));
    this.notify(room);
    this.channel?.postMessage({ type: 'ROOM_UPDATE', room });
  }

  private notify(room: MultiplayerRoom) {
    this.listeners.forEach((fn) => fn(room));
  }
}

const localHub = new LocalRoomHub();
const activeRealtimeChannels = new Map<string, any>();

// ==============================================================================
// FETCH ROOM STATE HELPER (Database + Local Fallback)
// ==============================================================================

export async function fetchRoomByCode(roomCode: string): Promise<MultiplayerRoom | null> {
  const cleanCode = roomCode.trim().toUpperCase();
  const supabase = createClient();

  if (supabase && isSupabaseConfigured) {
    try {
      const { data: dbRoom, error: dbRoomErr } = await (supabase.from('multiplayer_rooms') as any)
        .select('*')
        .eq('code', cleanCode)
        .single();

      if (dbRoom && !dbRoomErr) {
        const { data: dbPlayers } = await (supabase.from('multiplayer_players') as any)
          .select('*')
          .eq('room_id', dbRoom.id)
          .order('joined_at', { ascending: true });

        const isLobby = dbRoom.status === 'lobby';
        const isFinished = dbRoom.status === 'finished';

        const guessMap: Record<string, PlayerRoundGuess> = {};
        if (!isLobby && !isFinished) {
          const { data: dbGuesses } = await (supabase.from('multiplayer_guesses') as any)
            .select('*')
            .eq('room_id', dbRoom.id)
            .eq('round_number', dbRoom.current_round);

          dbGuesses?.forEach((g: any) => {
            guessMap[g.user_id] = {
              userId: g.user_id,
              username: '',
              roundNumber: g.round_number,
              stageIndex: g.stage_index,
              isCorrect: g.is_correct,
              scoreAwarded: g.score_awarded,
              guessTitle: g.guess_title || undefined,
              guessedAt: g.created_at,
            };
          });
        }

        const mappedPlayers: RoomPlayer[] = (dbPlayers || []).map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          username: p.username,
          avatarUrl: p.avatar_url || undefined,
          isHost: p.is_host,
          isReady: isLobby ? (p.is_host ? true : p.is_ready) : p.is_ready,
          totalScore: isLobby ? 0 : p.total_score,
          correctCount: isLobby ? 0 : p.correct_count,
          currentStreak: isLobby ? 0 : p.current_streak,
          maxStreak: isLobby ? 0 : p.max_streak,
          joinedAt: p.joined_at,
          roundStatus: isLobby || isFinished
            ? 'thinking'
            : guessMap[p.user_id]
            ? (guessMap[p.user_id].isCorrect ? 'guessed' : 'skipped')
            : 'thinking',
          lastGuessCorrect: isLobby || isFinished ? undefined : guessMap[p.user_id]?.isCorrect,
          lastRoundScore: isLobby || isFinished ? 0 : guessMap[p.user_id]?.scoreAwarded,
        }));

        const dbStatus = dbRoom.status as RoomStatus;
        const allPlayersGuessed =
          mappedPlayers.length > 0 &&
          mappedPlayers.every((p) => Boolean(guessMap[p.userId]));

        const computedStatus: RoomStatus =
          !isLobby && !isFinished && dbStatus === 'playing' && allPlayersGuessed ? 'revealing' : dbStatus;

        if (dbStatus === 'playing' && allPlayersGuessed) {
          // Self-heal room status in DB
          (supabase.from('multiplayer_rooms') as any)
            .update({ status: 'revealing' })
            .eq('id', dbRoom.id)
            .then();
        }

        const room: MultiplayerRoom = {
          id: dbRoom.id,
          code: dbRoom.code,
          hostId: dbRoom.host_id,
          status: computedStatus,
          eraFilter: dbRoom.era_filter as BollywoodEra,
          currentRound: dbRoom.current_round,
          totalRounds: dbRoom.total_rounds,
          playlist: (dbRoom.playlist as unknown as Song[]) || [],
          players: mappedPlayers,
          currentRoundGuesses: guessMap,
          createdAt: dbRoom.created_at,
          updatedAt: dbRoom.updated_at,
        };

        // Cache locally
        localHub.saveAndBroadcast(room);
        return room;
      }
    } catch (err) {
      console.warn('DB lookup failed, trying local hub:', err);
    }
  }

  return localHub.getRoom(cleanCode);
}

// ==============================================================================
// MULTIPLAYER SERVICE API
// ==============================================================================

export interface CreateRoomParams {
  hostUser: { id: string; email?: string; username: string; avatarUrl?: string };
  era: BollywoodEra;
}

export async function createMultiplayerRoom({
  hostUser,
  era,
}: CreateRoomParams): Promise<{ room: MultiplayerRoom | null; error: string | null }> {
  const code = generateRoomCode();
  const playlist = pickMultiplayerPlaylist(era);

  if (playlist.length < TOTAL_ROUNDS) {
    return { room: null, error: 'Not enough songs found for this era category.' };
  }

  const initialHostPlayer: RoomPlayer = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `player_${Date.now()}`,
    userId: hostUser.id,
    username: hostUser.username || hostUser.email?.split('@')[0] || 'Host',
    avatarUrl: hostUser.avatarUrl,
    isHost: true,
    isReady: true,
    totalScore: 0,
    correctCount: 0,
    currentStreak: 0,
    maxStreak: 0,
    joinedAt: new Date().toISOString(),
    roundStatus: 'thinking',
  };

  const initialRoom: MultiplayerRoom = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `room_${Date.now()}`,
    code,
    hostId: hostUser.id,
    status: 'lobby',
    eraFilter: era,
    currentRound: 1,
    totalRounds: TOTAL_ROUNDS,
    playlist,
    players: [initialHostPlayer],
    currentRoundGuesses: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    try {
      // 1. Insert room
      const { data: roomData, error: roomError } = await (supabase.from('multiplayer_rooms') as any)
        .insert({
          code,
          host_id: hostUser.id,
          status: 'lobby',
          era_filter: era,
          current_round: 1,
          total_rounds: TOTAL_ROUNDS,
          playlist: playlist as unknown as import('@/lib/supabase/database.types').Json,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // 2. Insert host player
      const { error: playerError } = await (supabase.from('multiplayer_players') as any).insert({
        room_id: roomData.id,
        user_id: hostUser.id,
        username: initialHostPlayer.username,
        avatar_url: hostUser.avatarUrl || null,
        is_host: true,
        is_ready: true,
        total_score: 0,
        correct_count: 0,
        current_streak: 0,
        max_streak: 0,
      });

      if (playerError) throw playerError;

      initialRoom.id = roomData.id;
    } catch (err: unknown) {
      console.warn('Supabase room create failed, using local room hub:', err);
    }
  }

  // Save and broadcast
  broadcastRoomState(initialRoom);
  return { room: initialRoom, error: null };
}

export async function joinMultiplayerRoom(
  roomCode: string,
  user: { id: string; email?: string; username: string; avatarUrl?: string }
): Promise<{ room: MultiplayerRoom | null; error: string | null }> {
  const cleanCode = roomCode.trim().toUpperCase();
  const room = await fetchRoomByCode(cleanCode);

  if (!room) {
    return { room: null, error: `Room "${cleanCode}" not found. Please check the code and try again.` };
  }

  if (room.status !== 'lobby') {
    // Check if player is reconnecting
    const isExisting = room.players.some((p) => p.userId === user.id);
    if (!isExisting) {
      return { room: null, error: 'This game is already in progress and cannot be joined.' };
    }
    return { room, error: null };
  }

  const existingPlayer = room.players.find((p) => p.userId === user.id);
  if (existingPlayer) {
    return { room, error: null };
  }

  if (room.players.length >= MAX_PLAYERS) {
    return { room: null, error: `This room is full (maximum ${MAX_PLAYERS} players).` };
  }

  const newPlayer: RoomPlayer = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `player_${Date.now()}`,
    userId: user.id,
    username: user.username || user.email?.split('@')[0] || `Player ${room.players.length + 1}`,
    avatarUrl: user.avatarUrl,
    isHost: false,
    isReady: false,
    totalScore: 0,
    correctCount: 0,
    currentStreak: 0,
    maxStreak: 0,
    joinedAt: new Date().toISOString(),
    roundStatus: 'thinking',
  };

  room.players.push(newPlayer);

  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    try {
      await (supabase.from('multiplayer_players') as any).insert({
        room_id: room.id,
        user_id: user.id,
        username: newPlayer.username,
        avatar_url: user.avatarUrl || null,
        is_host: false,
        is_ready: false,
      });
    } catch (err) {
      console.warn('Supabase join insert error:', err);
    }
  }

  // Broadcast to all connected devices via Supabase channel
  broadcastRoomState(room);
  return { room, error: null };
}

export function subscribeToMultiplayerRoom(
  roomCode: string,
  onUpdate: (room: MultiplayerRoom) => void
): () => void {
  const cleanCode = roomCode.trim().toUpperCase();

  // Local Hub subscription
  const unsubscribeLocal = localHub.subscribe(cleanCode, onUpdate);

  // Supabase Realtime channel subscription
  const supabase = createClient();
  let channel = activeRealtimeChannels.get(cleanCode);

  if (supabase && isSupabaseConfigured) {
    if (!channel) {
      channel = supabase.channel(`room:${cleanCode}`, {
        config: { broadcast: { self: true }, presence: { key: cleanCode } },
      });
      activeRealtimeChannels.set(cleanCode, channel);
    }

    channel
      .on('broadcast', { event: 'SYNC_STATE' }, (payload: any) => {
        if (payload.payload?.room) {
          onUpdate(payload.payload.room);
          localHub.saveAndBroadcast(payload.payload.room);
        }
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_players' },
        async () => {
          const freshRoom = await fetchRoomByCode(cleanCode);
          if (freshRoom) {
            onUpdate(freshRoom);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'multiplayer_rooms' },
        async () => {
          const freshRoom = await fetchRoomByCode(cleanCode);
          if (freshRoom) {
            onUpdate(freshRoom);
          }
        }
      )
      .subscribe();
  }

  return () => {
    unsubscribeLocal();
    if (channel && supabase) {
      supabase.removeChannel(channel);
      activeRealtimeChannels.delete(cleanCode);
    }
  };
}

export function broadcastRoomState(room: MultiplayerRoom) {
  localHub.saveAndBroadcast(room);

  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    let channel = activeRealtimeChannels.get(room.code);
    if (!channel) {
      channel = supabase.channel(`room:${room.code}`, {
        config: { broadcast: { self: true } },
      });
      activeRealtimeChannels.set(room.code, channel);
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.send({
            type: 'broadcast',
            event: 'SYNC_STATE',
            payload: { room },
          });
        }
      });
    } else {
      channel.send({
        type: 'broadcast',
        event: 'SYNC_STATE',
        payload: { room },
      });
    }
  }
}

export function togglePlayerReadyState(room: MultiplayerRoom, userId: string): MultiplayerRoom {
  const updated = { ...room };
  updated.players = updated.players.map((p) => {
    if (p.userId === userId) {
      const nextReady = !p.isReady;

      const supabase = createClient();
      if (supabase && isSupabaseConfigured) {
        (supabase.from('multiplayer_players') as any)
          .update({ is_ready: nextReady })
          .eq('room_id', room.id)
          .eq('user_id', userId)
          .then();
      }

      return { ...p, isReady: nextReady };
    }
    return p;
  });

  broadcastRoomState(updated);
  return updated;
}

export async function startMultiplayerGame(room: MultiplayerRoom): Promise<MultiplayerRoom> {
  const now = new Date().toISOString();
  const updated: MultiplayerRoom = {
    ...room,
    status: 'playing',
    currentRound: 1,
    currentRoundGuesses: {},
    players: room.players.map((p) => ({
      ...p,
      roundStatus: 'thinking',
      lastGuessCorrect: undefined,
      lastRoundScore: 0,
    })),
    updatedAt: now,
  };

  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    try {
      await (supabase.from('multiplayer_rooms') as any)
        .update({ status: 'playing', current_round: 1, updated_at: now })
        .eq('id', room.id);

      // Clean up previous guesses
      await (supabase.from('multiplayer_guesses') as any)
        .delete()
        .eq('room_id', room.id);
    } catch (err) {
      console.warn('Supabase start match update error:', err);
    }
  }

  broadcastRoomState(updated);
  return updated;
}

export interface SubmitGuessParams {
  room: MultiplayerRoom;
  userId: string;
  stageIndex: number;
  isCorrect: boolean;
  scoreAwarded: number;
  guessTitle: string;
}

export function submitMultiplayerGuess({
  room,
  userId,
  stageIndex,
  isCorrect,
  scoreAwarded,
  guessTitle,
}: SubmitGuessParams): MultiplayerRoom {
  const player = room.players.find((p) => p.userId === userId);
  if (!player) return room;

  const guess: PlayerRoundGuess = {
    userId,
    username: player.username,
    roundNumber: room.currentRound,
    stageIndex,
    isCorrect,
    scoreAwarded,
    guessTitle,
    guessedAt: new Date().toISOString(),
  };

  const newGuesses = {
    ...room.currentRoundGuesses,
    [userId]: guess,
  };

  const newStreak = isCorrect ? player.currentStreak + 1 : 0;
  const newMaxStreak = Math.max(player.maxStreak, newStreak);
  const newTotalScore = player.totalScore + scoreAwarded;
  const newCorrectCount = player.correctCount + (isCorrect ? 1 : 0);

  const updatedPlayers = room.players.map((p) => {
    if (p.userId === userId) {
      return {
        ...p,
        totalScore: newTotalScore,
        correctCount: newCorrectCount,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        roundStatus: (isCorrect ? 'guessed' : 'skipped') as 'guessed' | 'skipped',
        lastGuessCorrect: isCorrect,
        lastRoundScore: scoreAwarded,
      };
    }
    return p;
  });

  // Check if ALL active players in the room have guessed
  const allGuessed = updatedPlayers.every((p) => Boolean(newGuesses[p.userId]));

  const nextStatus: RoomStatus = allGuessed ? 'revealing' : 'playing';

  const updatedRoom: MultiplayerRoom = {
    ...room,
    status: nextStatus,
    players: updatedPlayers,
    currentRoundGuesses: newGuesses,
  };

  // Sync to database if online
  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    (supabase.from('multiplayer_guesses') as any)
      .insert({
        room_id: room.id,
        round_number: room.currentRound,
        user_id: userId,
        stage_index: stageIndex,
        is_correct: isCorrect,
        score_awarded: scoreAwarded,
        guess_title: guessTitle,
      })
      .then();

    (supabase.from('multiplayer_players') as any)
      .update({
        total_score: newTotalScore,
        correct_count: newCorrectCount,
        current_streak: newStreak,
        max_streak: newMaxStreak,
      })
      .eq('room_id', room.id)
      .eq('user_id', userId)
      .then();

    if (allGuessed) {
      (supabase.from('multiplayer_rooms') as any)
        .update({ status: 'revealing' })
        .eq('id', room.id)
        .then();
    }
  }

  broadcastRoomState(updatedRoom);
  return updatedRoom;
}

export function forceRevealMultiplayerRound(room: MultiplayerRoom): MultiplayerRoom {
  const updatedRoom: MultiplayerRoom = {
    ...room,
    status: 'revealing',
  };

  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    (supabase.from('multiplayer_rooms') as any)
      .update({ status: 'revealing' })
      .eq('id', room.id)
      .then();
  }

  broadcastRoomState(updatedRoom);
  return updatedRoom;
}

export function advanceToNextMultiplayerRound(room: MultiplayerRoom): MultiplayerRoom {
  const nextRoundNumber = room.currentRound + 1;
  const now = new Date().toISOString();

  if (nextRoundNumber > room.totalRounds || nextRoundNumber > room.playlist.length) {
    // Finish Match -> Victory Podium
    const finishedRoom: MultiplayerRoom = {
      ...room,
      status: 'finished',
      updatedAt: now,
    };

    const supabase = createClient();
    if (supabase && isSupabaseConfigured) {
      (supabase.from('multiplayer_rooms') as any)
        .update({ status: 'finished', updated_at: now })
        .eq('id', room.id)
        .then();
    }

    broadcastRoomState(finishedRoom);
    return finishedRoom;
  }

  const nextRoom: MultiplayerRoom = {
    ...room,
    status: 'playing',
    currentRound: nextRoundNumber,
    currentRoundGuesses: {},
    players: room.players.map((p) => ({
      ...p,
      roundStatus: 'thinking',
      lastGuessCorrect: undefined,
      lastRoundScore: 0,
    })),
    updatedAt: now,
  };

  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    (supabase.from('multiplayer_rooms') as any)
      .update({
        current_round: nextRoundNumber,
        status: 'playing',
        updated_at: now,
      })
      .eq('id', room.id)
      .then();
  }

  broadcastRoomState(nextRoom);
  return nextRoom;
}

export async function resetMultiplayerGameToLobby(room: MultiplayerRoom): Promise<MultiplayerRoom> {
  const newPlaylist = pickMultiplayerPlaylist(room.eraFilter);
  const now = new Date().toISOString();
  const resetRoom: MultiplayerRoom = {
    ...room,
    status: 'lobby',
    currentRound: 1,
    playlist: newPlaylist,
    currentRoundGuesses: {},
    players: room.players.map((p) => ({
      ...p,
      totalScore: 0,
      correctCount: 0,
      currentStreak: 0,
      maxStreak: 0,
      isReady: p.isHost,
      roundStatus: 'thinking',
      lastGuessCorrect: undefined,
      lastRoundScore: 0,
    })),
    updatedAt: now,
  };

  const supabase = createClient();
  if (supabase && isSupabaseConfigured) {
    try {
      // 1. Reset Room to Lobby with new playlist
      await (supabase.from('multiplayer_rooms') as any)
        .update({
          status: 'lobby',
          current_round: 1,
          playlist: newPlaylist as unknown as import('@/lib/supabase/database.types').Json,
          updated_at: now,
        })
        .eq('id', room.id);

      // 2. Clear all previous guesses from the room
      await (supabase.from('multiplayer_guesses') as any)
        .delete()
        .eq('room_id', room.id);

      // 3. Reset host in DB
      await (supabase.from('multiplayer_players') as any)
        .update({
          total_score: 0,
          correct_count: 0,
          current_streak: 0,
          max_streak: 0,
          is_ready: true,
        })
        .eq('room_id', room.id)
        .eq('user_id', room.hostId);

      // 4. Reset non-host players in DB
      await (supabase.from('multiplayer_players') as any)
        .update({
          total_score: 0,
          correct_count: 0,
          current_streak: 0,
          max_streak: 0,
          is_ready: false,
        })
        .eq('room_id', room.id)
        .neq('user_id', room.hostId);
    } catch (err) {
      console.warn('Supabase reset room error:', err);
    }
  }

  broadcastRoomState(resetRoom);
  return resetRoom;
}
