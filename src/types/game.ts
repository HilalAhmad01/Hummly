export type BollywoodEra = 'all' | '2020s' | '2010s' | '2000s' | '90s' | 'retro' | 'party' | 'romance' | 'punjabi';

export interface SnippetStage {
  stageNumber: number;
  name: 'Impossible' | 'Expert' | 'Hard' | 'Medium' | 'Easy';
  durationSec: number;
  basePoints: number;
  badgeColor: string;
  borderColor: string;
}

export const SNIPPET_STAGES: SnippetStage[] = [
  { stageNumber: 1, name: 'Impossible', durationSec: 0.2, basePoints: 1000, badgeColor: 'bg-purple-500/20 text-purple-300', borderColor: 'border-purple-500/40' },
  { stageNumber: 2, name: 'Expert', durationSec: 0.8, basePoints: 800, badgeColor: 'bg-rose-500/20 text-rose-300', borderColor: 'border-rose-500/40' },
  { stageNumber: 3, name: 'Hard', durationSec: 2.5, basePoints: 600, badgeColor: 'bg-amber-500/20 text-amber-300', borderColor: 'border-amber-500/40' },
  { stageNumber: 4, name: 'Medium', durationSec: 5.0, basePoints: 400, badgeColor: 'bg-yellow-500/20 text-yellow-300', borderColor: 'border-yellow-500/40' },
  { stageNumber: 5, name: 'Easy', durationSec: 10.0, basePoints: 200, badgeColor: 'bg-emerald-500/20 text-emerald-300', borderColor: 'border-emerald-500/40' },
];

export interface Song {
  id: string;
  title: string;
  artist: string;
  movie_or_album: string;
  language: string;
  era: '2020s' | '2010s' | '2000s' | '90s' | 'retro' | 'punjabi' | 'all';
  theme?: 'romantic' | 'party' | 'dance' | 'chartbuster' | 'retro' | 'soulful';
  year?: number;
  difficulty?: number;
  deezer_track_id?: string | null;
  deezer_preview_url?: string | null;
  youtube_video_id?: string | null;
  cover_url?: string | null;
  is_active?: boolean;
}

export interface SearchableSong {
  id: string;
  title: string;
  movie_or_album: string;
  artist: string;
  year?: number;
  cover_url?: string;
  era?: string;
}

export interface RoundAttempt {
  stageNumber: number;
  guessTitle: string;
  guessArtist?: string;
  guessMovie?: string;
  isCorrect: boolean;
}

export interface GameRoundState {
  roundNumber: number;
  song: Song;
  status: 'playing' | 'revealed' | 'skipped';
  currentStageIndex: number; // 0 to 4
  attempts: RoundAttempt[];
  selectedSong: SearchableSong | null;
  isCorrect: boolean;
  scoreAwarded: number;
  streakAtRound: number;
}

export interface GameSessionSummary {
  id?: string;
  mode: 'quick_play' | 'daily_challenge' | 'multiplayer';
  eraFilter: BollywoodEra;
  totalScore: number;
  correctCount: number;
  totalRounds: number;
  maxStreak: number;
  rounds: GameRoundState[];
  completedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  total_score: number;
  games_played: number;
  created_at?: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatarUrl?: string;
  totalScore: number;
  gamesPlayed: number;
  highScore: number;
  rank?: number;
}

// ==========================================
// MULTIPLAYER DATA CONTRACTS
// ==========================================

export type RoomStatus = 'lobby' | 'playing' | 'revealing' | 'finished';

export interface RoomPlayer {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  isHost: boolean;
  isReady: boolean;
  totalScore: number;
  correctCount: number;
  currentStreak: number;
  maxStreak: number;
  joinedAt: string;
  // Live round state
  roundStatus?: 'thinking' | 'guessed' | 'skipped';
  lastGuessCorrect?: boolean;
  lastRoundScore?: number;
}

export interface PlayerRoundGuess {
  userId: string;
  username: string;
  roundNumber: number;
  stageIndex: number;
  isCorrect: boolean;
  scoreAwarded: number;
  guessTitle?: string;
  guessedAt: string;
}

export interface MultiplayerRoom {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  eraFilter: BollywoodEra;
  currentRound: number;
  totalRounds: number;
  playlist: Song[];
  players: RoomPlayer[];
  currentRoundGuesses: Record<string, PlayerRoundGuess>; // Keyed by userId
  createdAt: string;
  updatedAt: string;
}
