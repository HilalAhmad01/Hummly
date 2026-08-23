export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      songs: {
        Row: {
          id: string
          title: string
          artist: string
          movie_or_album: string | null
          language: string
          era: string
          theme: string | null
          difficulty: number
          deezer_track_id: string | null
          deezer_preview_url: string | null
          youtube_video_id: string | null
          cover_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          artist: string
          movie_or_album?: string | null
          language?: string
          era: string
          theme?: string | null
          difficulty?: number
          deezer_track_id?: string | null
          deezer_preview_url?: string | null
          youtube_video_id?: string | null
          cover_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          artist?: string
          movie_or_album?: string | null
          language?: string
          era?: string
          theme?: string | null
          difficulty?: number
          deezer_track_id?: string | null
          deezer_preview_url?: string | null
          youtube_video_id?: string | null
          cover_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          total_score: number
          games_played: number
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          total_score?: number
          games_played?: number
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          total_score?: number
          games_played?: number
          created_at?: string
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string | null
          mode: string
          era_filter: string | null
          score: number
          correct_count: number
          total_rounds: number
          played_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          mode: string
          era_filter?: string | null
          score: number
          correct_count: number
          total_rounds: number
          played_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          mode?: string
          era_filter?: string | null
          score?: number
          correct_count?: number
          total_rounds?: number
          played_at?: string
        }
      }
    }
    Views: {
      leaderboard_view: {
        Row: {
          user_id: string
          username: string
          avatar_url: string | null
          total_score: number
          games_played: number
          high_score: number
        }
      }
    }
  }
}
